<template>
  <h1>{{ title }}</h1>

  <!-- Top Bar Container -->
  <v-container class="top-bar-container">
    <!-- Left side: Create Button -->
    <div class="actions-group">
      <v-btn
        v-if="
          showCreateAction && checkPermissions(`create-${permissionEntity}`)
        "
        class="button"
        color="success"
        prepend-icon="mdi-plus"
        elevation="4"
        @click="$emit('create')"
      >
        Create
      </v-btn>
    </div>

    <!-- Right side: Template, Import, Search & Filters -->
    <div class="filters-group">
      <v-btn
        v-if="showImport && checkPermissions(`manage-${permissionEntity}`)"
        class="button"
        color="info"
        prepend-icon="mdi-upload"
        elevation="4"
        @click="triggerFileInput"
      >
        Import
      </v-btn>

      <v-btn
        v-if="
          showDownloadTemplate &&
          checkPermissions(`manage-${permissionEntity}`)
        "
        class="button"
        color="secondary"
        prepend-icon="mdi-download"
        elevation="4"
        @click="$emit('download-template')"
      >
        Template
      </v-btn>

      <input
        type="file"
        ref="fileInput"
        style="display: none"
        accept=".xlsx,.xls,.csv"
        @change="onFileChange"
      />

      <slot name="filters" />

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
    </div>
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
      v-for="header in props.headers.filter((h) => h.displayAs === 'chips')"
      :key="`item.${header.key}`"
      v-slot:[`item.${header.key}`]="{ item }"
    >
      <div class="chip-group">
        <v-chip
          v-for="(label, idx) in formatCellArray(item, header)"
          :key="idx"
          :color="header.chipColor || 'primary'"
          size="small"
          label
        >
          {{ label }}
        </v-chip>
        <span
          v-if="formatCellArray(item, header).length === 0"
          class="text-medium-emphasis"
        >
          —
        </span>
      </div>
    </template>

    <template
      v-for="header in props.headers.filter(
        (h) => h.formatter && h.displayAs !== 'chip' && h.displayAs !== 'chips',
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
import { usePermissions } from "@/composables/usePermissions";
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
  showImport: { type: Boolean, default: false },
  showDownloadTemplate: { type: Boolean, default: false },
});

const { authUser, getUser } = useAuth();
const { checkPermissions } = usePermissions();

const emit = defineEmits([
  "filter",
  "create",
  "view",
  "edit",
  "remove",
  "import",
  "download-template",
]);

const tableHeaders = computed(() =>
  props.headers.filter((header) => header.visibleInTable !== false).map((header) =>
    header.key === "action" ? { ...header, align: "center" as const } : header,
  ),
);

const form = ref({
  page: 1,
  limit: 10,
  sortBy: [],
  search: "",
});

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit("import", target.files[0]);
    target.value = ""; // Reset input so the same file can be selected again if needed
  }
};

const permissionEntity = computed(() => {
  const raw = (props.entity ?? "").toString().trim();
  const withSpaces = raw.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const kebab = withSpaces.replace(/[\s_]+/g, "-").toLowerCase();

  if (kebab.endsWith("s")) return kebab;
  if (kebab.endsWith("y")) return kebab.slice(0, -1) + "ies";
  if (kebab.endsWith("status")) return kebab + "es";
  return kebab + "s";
});

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

const formatCellValue = (item: any, header: ColumnConfig): string => {
  const value = getNestedValue(item, header.key);

  if (header.formatter && typeof header.formatter === "function") {
    const result = header.formatter(value);
    return Array.isArray(result) ? result.join(", ") : result;
  }

  return value ?? "";
};

const formatCellArray = (item: any, header: ColumnConfig): string[] => {
  const value = getNestedValue(item, header.key);

  if (header.formatter && typeof header.formatter === "function") {
    const result = header.formatter(value);
    return Array.isArray(result) ? result : result ? [String(result)] : [];
  }

  if (Array.isArray(value)) return value.map(String);
  return value ? [String(value)] : [];
};

const handleTableChange = (options: any) => {
  form.value = { ...form.value, ...options };
  emitFilter();
};

const emitFilter = debounce(() => {
  emit("filter", form.value);
}, 300);

onMounted(async () => {
  if (!authUser.value) await getUser();
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
.top-bar-container {
  padding: 10px 0 15px 0;
  display: flex;
  flex-wrap: nowrap; /* FORCES a single row */
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.actions-group {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: nowrap; /* Prevent buttons from wrapping */
  flex-shrink: 0; /* Prevent buttons from getting squished by the search bar */
}

.filters-group {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  flex-grow: 1; /* Allows the search bar container to take up remaining space */
  justify-content: flex-end; /* Pushes the search bar to the far right */
}

.text-field {
  flex: 1 1 400px; /* Allows it to grow and shrink smoothly */
  max-width: 600px;
  min-width: 250px;
}

.action-container {
  display: flex;
  width: 100%;
  gap: 6px;
  justify-content: center;
  align-items: center;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
}

/* Stacks nicely on phones where 1 row isn't possible. */
@media (max-width: 768px) {
  .top-bar-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .actions-group {
    flex-wrap: wrap; /* Allows buttons to wrap on mobile */
  }

  .button {
    flex: 1 1 auto;
  }
}
</style>
