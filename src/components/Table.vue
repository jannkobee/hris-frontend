<template>
  <h1>{{ title }}</h1>
  <v-container class="container">
    <v-btn
      v-if="showCreateAction && checkPermissions(`create-${permissionEntity}`)"
      class="button"
      color="success"
      prepend-icon="mdi-plus"
      elevation="4"
      @click="$emit('create')"
    >
      Create
    </v-btn>
    <v-text-field
      v-model="form.search"
      class="text-field"
      append-inner-icon="mdi-magnify"
      density="compact"
      placeholder="Search here..."
      variant="outlined"
      hide-details
      clearable
      @input="emitFilter"
      @click:clear="emitFilter"
    />
  </v-container>
  <v-data-table-server
    :headers="tableHeaders"
    :items="props.data"
    :items-length="props.pagination.total"
    :items-per-page-options="[5, 10, 20, 50, 100]"
    loading-text="Loading... Please wait"
    :loading="props.loading"
    item-value="title"
    @update:options="handleTableChange"
  >
    <template #top> </template>

    <template
      v-for="header in props.headers.filter((h) => h.displayAs === 'chip')"
      :key="`item.${header.key}`"
      v-slot:[`item.${header.key}`]="{ item }"
    >
      <v-chip :color="header.chipColor || 'primary'" size="small" label>
        {{ formatCellValue(item, header) }}
      </v-chip>
    </template>

    <template
      v-for="header in props.headers.filter(
        (h) => h.formatter && h.displayAs !== 'chip',
      )"
      :key="`item.${header.key}`"
      v-slot:[`item.${header.key}`]="{ item }"
    >
      {{ formatCellValue(item, header) }}
    </template>

    <template #item.action="{ item }">
      <div class="action-container">
        <v-btn
          v-if="showViewAction && checkPermissions(`view-${permissionEntity}`)"
          color="primary"
          variant="tonal"
          size="small"
          elevation="4"
          density="comfortable"
          icon="mdi-eye"
          :title="`View ${title}`"
          :aria-label="`View ${title}`"
          @click="$emit('view', item)"
        />
        <v-btn
          v-if="
            showEditAction && checkPermissions(`update-${permissionEntity}`)
          "
          color="info"
          size="small"
          elevation="4"
          density="comfortable"
          icon="mdi-pencil"
          @click="$emit('edit', item)"
        />
        <v-btn
          v-if="
            showDeleteAction &&
            checkPermissions(`delete-${permissionEntity}`) &&
            item.id !== authUser?.role_id &&
            item.id !== authUser?.id
          "
          color="error"
          size="small"
          elevation="4"
          density="comfortable"
          icon="mdi-delete"
          @click="$emit('remove', item)"
        />
        <slot name="extra-actions" :item="item" />
      </div>
    </template>
  </v-data-table-server>
</template>

<script lang="ts" setup>
import { ColumnConfig, Data } from "@/types/types";
import { ref, watch, onMounted, computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import debounce from "lodash/debounce";

const props = defineProps({
  entity: { type: String, default: "" },
  title: { type: String, default: "" },
  headers: { type: Array as () => ColumnConfig[], default: () => [] },
  data: { type: Array as () => any[], default: () => [] },
  pagination: { type: Object as () => Data, default: () => ({}) },
  relations: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  showCreateAction: { type: Boolean, default: true },
  showViewAction: { type: Boolean, default: true },
  showEditAction: { type: Boolean, default: true },
  showDeleteAction: { type: Boolean, default: true },
});

const { authUser, getUser } = useAuth();

const emit = defineEmits(["filter", "create", "view", "edit", "remove"]);

// The Action column's buttons are centered (see .action-container below),
// but header labels default to left/"start" alignment. Force that one
// column's header to center so it lines up with the buttons underneath,
// regardless of what the fields config passed in via props.headers sets.
const tableHeaders = computed(() =>
  props.headers.map((header) =>
    header.key === "action" ? { ...header, align: "center" as const } : header,
  ),
);

const form = ref({
  page: 1,
  limit: 10,
  sortBy: [],
  search: "",
});

const permissionEntity = computed(() => {
  const raw = (props.entity ?? "").toString().trim();

  // Convert CamelCase to words: EmploymentStatus -> Employment Status
  const withSpaces = raw.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  // Normalize to kebab: Employment Status / employment_status -> employment-status
  const kebab = withSpaces.replace(/[\s_]+/g, "-").toLowerCase();

  // Simple pluralization (works for your slugs like employment-statuses)
  if (kebab.endsWith("s")) return kebab;
  if (kebab.endsWith("y")) return kebab.slice(0, -1) + "ies"; // company -> companies
  if (kebab.endsWith("status")) return kebab + "es"; // status -> statuses
  return kebab + "s";
});

// Helper function to get nested property value
const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Format cell value using formatter if available
const formatCellValue = (item: any, header: ColumnConfig): string => {
  const value = getNestedValue(item, header.key);

  if (header.formatter && typeof header.formatter === "function") {
    return header.formatter(value);
  }

  return value ?? "";
};

const handleTableChange = (options: any) => {
  form.value = { ...form.value, ...options };

  emitFilter();
};

const checkPermissions = (permission: string): boolean => {
  if (!authUser.value?.role?.permissions) {
    return false;
  }

  const value = authUser.value.role.permissions.some(
    (perm: { slug: string }) => perm.slug === permission,
  );

  return value;
};

const emitFilter = debounce(() => {
  emit("filter", form.value);
}, 300);

onMounted(async () => {
  await getUser();
});

watch(
  () => props.relations,
  (data) => {
    if (data !== "") {
      const relations = { relations: data };

      form.value = { ...form.value, ...relations };
    }
  },
  { immediate: true },
);
</script>

<style lang="css" scoped>
.container {
  padding: 5px 0 0 0;
  display: flex;
  min-width: 100%;
  gap: 20px;
}

.text-field {
  max-width: 500px;
  margin-left: auto;
}

.action-container {
  display: flex;
  width: 100%;
  gap: 6px;
  justify-content: center; /* Centers the buttons horizontally */
  align-items: center; /* Centers the buttons vertically */
}

@media (max-width: 1200px) {
  .container {
    flex-direction: column;
    gap: 5px;
  }

  .button {
    width: 100%;
    margin-bottom: 15px;
  }

  .text-field {
    min-width: 100%;
    margin-left: auto;
  }
}
</style>
