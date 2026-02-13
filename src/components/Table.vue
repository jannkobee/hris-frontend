<template>
  <h1>{{ title }}</h1>
  <v-container class="container">
    <v-btn
      v-if="showCreateAction && checkPermissions(`create-${permissionEntity}`)"
      class="button"
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
    :headers="props.headers"
    :items="props.data"
    :items-length="props.pagination.total"
    :items-per-page-options="[5, 10, 20, 50, 100]"
    loading-text="Loading... Please wait"
    :loading="props.loading"
    item-value="title"
    @update:options="handleTableChange"
  >
    <template #top> </template>

    <!-- Dynamic slots for columns with chips -->
    <template
      v-for="header in props.headers.filter((h) => h.displayAs === 'chip')"
      :key="`item.${header.key}`"
      v-slot:[`item.${header.key}`]="{ item }"
    >
      <v-chip :color="header.chipColor || 'primary'" size="small" label>
        {{ formatCellValue(item, header) }}
      </v-chip>
    </template>

    <!-- Dynamic slots for columns with formatters (but not chips) -->
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
      <v-container class="action-container">
        <v-btn
          v-if="showViewAction && checkPermissions(`view-${permissionEntity}`)"
          size="small"
          elevation="4"
          density="comfortable"
          icon="mdi-eye"
          @click="$emit('view', item)"
        />
        <v-btn
          v-if="
            showEditAction && checkPermissions(`update-${permissionEntity}`)
          "
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
          size="small"
          elevation="4"
          density="comfortable"
          icon="mdi-delete"
          @click="$emit('remove', item)"
        />
      </v-container>
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

  console.log("Checking permissions for:", permission, "→", value);
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
  padding: 0;
  margin: 0;
  display: flex;
  gap: 5px;
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
