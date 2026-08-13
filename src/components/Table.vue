<template>
  <section class="app-table">
    <header class="app-table__toolbar">
      <div class="app-table__title-row">
        <div class="app-table__heading">
          <div v-if="icon" class="app-table__icon" aria-hidden="true">
            <v-icon :icon="icon" size="21" />
          </div>
          <div class="app-table__copy">
            <h1>{{ title }}</h1>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="app-table__utility-row">
        <div class="app-table__actions">
          <slot name="toolbar-actions" />

          <v-btn
            v-if="showCreateAction && checkPermissions(`create-${permissionEntity}`)"
            class="text-none"
            color="primary"
            prepend-icon="mdi-plus"
            variant="flat"
            @click="emit('create')"
          >
            Create
          </v-btn>

          <v-btn
            v-if="showImport && checkPermissions(`manage-${permissionEntity}`)"
            class="text-none"
            color="info"
            prepend-icon="mdi-upload-outline"
            variant="tonal"
            @click="triggerFileInput"
          >
            Import
          </v-btn>

          <v-btn
            v-if="showDownloadTemplate && checkPermissions(`manage-${permissionEntity}`)"
            class="text-none"
            color="secondary"
            prepend-icon="mdi-download-outline"
            variant="tonal"
            @click="emit('download-template')"
          >
            Template
          </v-btn>

          <input
            ref="fileInput"
            class="d-none"
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="onFileChange"
          />
        </div>

        <div class="app-table__filters">
          <slot name="filters" />

          <v-text-field
            v-if="showSearch"
            v-model="form.search"
            class="app-table__search"
            prepend-inner-icon="mdi-magnify"
            :placeholder="searchPlaceholder"
            density="compact"
            variant="outlined"
            hide-details
            clearable
            aria-label="Search table"
            @update:model-value="handleSearchChange"
          />
        </div>
      </div>
    </header>

    <v-divider />

    <v-data-table-server
      class="app-table__data"
      :headers="tableHeaders"
      :items="props.data"
      :items-length="Number(props.pagination?.total ?? 0)"
      :items-per-page-options="itemsPerPageOptions"
      :loading-text="loadingText"
      :loading="props.loading"
      :item-value="itemValue"
      hover
      @update:options="handleTableChange"
    >
      <template
        v-for="header in props.headers.filter((column) => column.displayAs === 'chip')"
        :key="`item.${header.key}`"
        v-slot:[`item.${header.key}`]="{ item }"
      >
        <v-chip
          v-if="formatCellValue(item, header)"
          :color="resolveChipColor(header, getNestedValue(item, header.key))"
          size="small"
          variant="tonal"
          label
          class="app-table__chip"
        >
          {{ formatCellValue(item, header) }}
        </v-chip>
        <span v-else class="app-table__empty-value">—</span>
      </template>

      <template
        v-for="header in props.headers.filter((column) => column.displayAs === 'chips')"
        :key="`item.${header.key}`"
        v-slot:[`item.${header.key}`]="{ item }"
      >
        <div class="app-table__chip-group">
          <v-chip
            v-for="(label, index) in formatCellArray(item, header)"
            :key="index"
            :color="resolveChipColor(header, label)"
            size="small"
            variant="tonal"
            label
            class="app-table__chip"
          >
            {{ label }}
          </v-chip>
          <span v-if="formatCellArray(item, header).length === 0" class="app-table__empty-value">—</span>
        </div>
      </template>

      <template
        v-for="header in props.headers.filter(
          (column) =>
            (column.formatter || isTemporalColumn(column)) &&
            column.displayAs !== 'chip' &&
            column.displayAs !== 'chips',
        )"
        :key="`item.${header.key}`"
        v-slot:[`item.${header.key}`]="{ item }"
      >
        <span :class="{ 'text-no-wrap': isTemporalColumn(header) }">
          {{ formatCellValue(item, header) || "—" }}
        </span>
      </template>

      <template #item.action="{ item }">
        <div class="app-table__row-actions" :class="`app-table__row-actions--${actionAlignment}`">
          <v-btn
            v-if="showViewAction && checkPermissions(`view-${permissionEntity}`)"
            color="primary"
            variant="tonal"
            size="small"
            density="comfortable"
            icon="mdi-eye-outline"
            :title="`View ${title}`"
            :aria-label="`View ${title}`"
            @click="emit('view', item)"
          />
          <v-btn
            v-if="showEditAction && checkPermissions(`update-${permissionEntity}`)"
            color="info"
            variant="tonal"
            size="small"
            density="comfortable"
            icon="mdi-pencil-outline"
            :title="`Edit ${title}`"
            :aria-label="`Edit ${title}`"
            @click="emit('edit', item)"
          />
          <v-btn
            v-if="
              showDeleteAction &&
              checkPermissions(`delete-${permissionEntity}`) &&
              item.id !== authUser?.role_id &&
              item.id !== authUser?.id
            "
            color="error"
            variant="tonal"
            size="small"
            density="comfortable"
            icon="mdi-delete-outline"
            :title="`Delete ${title}`"
            :aria-label="`Delete ${title}`"
            @click="emit('remove', item)"
          />
          <slot name="extra-actions" :item="item" />
        </div>
      </template>

      <template #no-data>
        <slot name="empty">
          <div class="app-table__empty">
            <div class="app-table__empty-icon">
              <v-icon icon="mdi-table-search" size="28" />
            </div>
            <strong>{{ emptyTitle }}</strong>
            <span>{{ emptyText }}</span>
          </div>
        </slot>
      </template>
    </v-data-table-server>
  </section>
</template>

<script lang="ts" setup>
import type { ColumnConfig, Data } from "@/types/types";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useAuth } from "@/composables/useAuth";
import { usePermissions } from "@/composables/usePermissions";
import debounce from "lodash/debounce";
import { formatDate, formatDateTime, formatTime } from "@/utils/dateFormatter";

const props = defineProps({
  entity: { type: String, default: "" },
  title: { type: String, default: "Records" },
  subtitle: { type: String, default: "" },
  icon: { type: String, default: "mdi-table" },
  headers: { type: Array as () => ColumnConfig[], default: () => [] },
  data: { type: Array as () => any[], default: () => [] },
  pagination: { type: Object as () => Partial<Data>, default: () => ({ total: 0 }) },
  relations: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  showCreateAction: { type: Boolean, default: true },
  showViewAction: { type: Boolean, default: true },
  showEditAction: { type: Boolean, default: true },
  showDeleteAction: { type: Boolean, default: true },
  showImport: { type: Boolean, default: false },
  showDownloadTemplate: { type: Boolean, default: false },
  showSearch: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: "Search records..." },
  emptyTitle: { type: String, default: "No records found" },
  emptyText: { type: String, default: "Try changing your search or filters." },
  loadingText: { type: String, default: "Loading records..." },
  itemValue: { type: String, default: "id" },
  itemsPerPageOptions: {
    type: Array as () => number[],
    default: () => [5, 10, 20, 50, 100],
  },
});

const emit = defineEmits([
  "filter",
  "create",
  "view",
  "edit",
  "remove",
  "import",
  "download-template",
]);

const { authUser, getUser } = useAuth();
const { checkPermissions } = usePermissions();
const fileInput = ref<HTMLInputElement | null>(null);
const form = ref<Record<string, any>>({
  page: 1,
  limit: 10,
  sortBy: [],
  search: "",
});

const tableHeaders = computed(() =>
  props.headers
    .filter((header) => header.visibleInTable !== false)
    .map((header) =>
      header.key === "action"
        ? { ...header, align: header.align ?? ("center" as const) }
        : header,
    ),
);

const actionAlignment = computed(
  () => props.headers.find((header) => header.key === "action")?.align ?? "center",
);

const permissionEntity = computed(() => {
  const raw = props.entity.toString().trim();
  const withSpaces = raw.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const kebab = withSpaces.replace(/[\s_]+/g, "-").toLowerCase();

  if (kebab.endsWith("s")) return kebab;
  if (kebab.endsWith("y")) return `${kebab.slice(0, -1)}ies`;
  if (kebab.endsWith("status")) return `${kebab}es`;
  return `${kebab}s`;
});

const getNestedValue = (object: any, path: string): any =>
  path.split(".").reduce((current, key) => current?.[key], object);

const isTemporalColumn = (header: ColumnConfig): boolean =>
  ["date", "time", "datetime"].includes(header.inputField ?? "");

const resolveChipColor = (header: ColumnConfig, value: any): string =>
  typeof header.chipColor === "function"
    ? header.chipColor(value)
    : header.chipColor || "primary";

const formatCellValue = (item: any, header: ColumnConfig): string => {
  const value = getNestedValue(item, header.key);

  if (header.formatter) {
    const result = header.formatter(value, item);
    return Array.isArray(result) ? result.join(", ") : String(result ?? "");
  }

  if (header.inputField === "datetime") return formatDateTime(value);
  if (header.inputField === "date") return formatDate(value);
  if (header.inputField === "time") return formatTime(value);

  if (header.displayAs === "chip" && typeof value === "string") {
    const option = header.inputOptions?.find((candidate: any) => candidate.value === value);
    if (option?.label) return option.label;

    const label = value.replace(/[_-]+/g, " ").trim();
    return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
  }

  return String(value ?? "");
};

const formatCellArray = (item: any, header: ColumnConfig): string[] => {
  const value = getNestedValue(item, header.key);

  if (header.formatter) {
    const result = header.formatter(value, item);
    return Array.isArray(result) ? result : result ? [String(result)] : [];
  }

  if (Array.isArray(value)) return value.map(String);
  return value ? [String(value)] : [];
};

const emitFilter = debounce(() => emit("filter", { ...form.value }), 300);

const handleSearchChange = () => {
  form.value.page = 1;
  emitFilter();
};

const handleTableChange = (options: any) => {
  form.value = { ...form.value, ...options, limit: options.itemsPerPage ?? form.value.limit };
  emitFilter();
};

const triggerFileInput = () => fileInput.value?.click();

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) emit("import", file);
  target.value = "";
};

onMounted(async () => {
  if (!authUser.value) await getUser();
});

onBeforeUnmount(() => emitFilter.cancel());

watch(
  () => props.relations,
  (relations) => {
    if (relations) form.value = { ...form.value, relations };
  },
  { immediate: true },
);
</script>

<style scoped>
.app-table {
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 10px 30px rgba(var(--v-theme-on-surface), 0.045);
}

.app-table__toolbar {
  display: flex;
  flex-direction: column;
}

.app-table__title-row,
.app-table__utility-row {
  display: flex;
  width: 100%;
}

.app-table__title-row {
  min-height: 76px;
  align-items: center;
  padding: 16px 18px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.045),
    transparent 48%
  );
}

.app-table__utility-row {
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 18px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.012);
}

.app-table__heading,
.app-table__actions,
.app-table__filters,
.app-table__row-actions,
.app-table__chip-group {
  display: flex;
  align-items: center;
}

.app-table__heading {
  min-width: 190px;
  gap: 12px;
}

.app-table__icon,
.app-table__empty-icon {
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}

.app-table__icon {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  border-radius: 12px;
}

.app-table__copy {
  min-width: 0;
}

.app-table__copy h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 750;
  line-height: 1.3;
}

.app-table__copy p {
  margin: 3px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.76rem;
  line-height: 1.4;
}

.app-table__actions,
.app-table__filters {
  gap: 9px;
}

.app-table__filters {
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-end;
}

.app-table__search {
  width: clamp(280px, 30vw, 420px);
  min-width: 280px;
  flex: 0 1 420px;
}

.app-table__search :deep(.v-field) {
  border-radius: 10px;
  background: rgba(var(--v-theme-surface), 0.72);
}

.app-table__data {
  background: transparent;
}

.app-table__data :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.app-table__data :deep(thead th) {
  height: 48px !important;
  color: rgba(var(--v-theme-on-surface), 0.67) !important;
  background: rgba(var(--v-theme-on-surface), 0.035) !important;
  font-size: 0.7rem !important;
  font-weight: 750 !important;
  letter-spacing: 0.045em !important;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-table__data :deep(tbody td) {
  height: 58px !important;
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.065) !important;
  font-size: 0.82rem;
}

.app-table__data :deep(tbody tr) {
  transition: background-color 140ms ease;
}

.app-table__data :deep(tbody tr:hover) {
  background: rgba(var(--v-theme-primary), 0.045) !important;
}

.app-table__data :deep(.v-data-table-footer) {
  min-height: 58px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  background: rgba(var(--v-theme-on-surface), 0.018);
}

.app-table__row-actions {
  width: 100%;
  gap: 6px;
  white-space: nowrap;
}

.app-table__row-actions--start { justify-content: flex-start; }
.app-table__row-actions--center { justify-content: center; }
.app-table__row-actions--end { justify-content: flex-end; }

.app-table__chip-group {
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px 0;
}

.app-table__chip {
  font-weight: 650;
}

.app-table__empty-value {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.app-table__empty {
  display: flex;
  min-height: 220px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 7px;
  padding: 28px;
  color: rgba(var(--v-theme-on-surface), 0.68);
}

.app-table__empty-icon {
  width: 52px;
  height: 52px;
  margin-bottom: 3px;
  border-radius: 15px;
}

.app-table__empty strong {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.92rem;
}

.app-table__empty span {
  font-size: 0.78rem;
}

@media (max-width: 960px) {
  .app-table__utility-row {
    align-items: stretch;
    flex-direction: column;
  }

  .app-table__actions,
  .app-table__filters {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .app-table__search {
    width: 100%;
    min-width: 0;
    max-width: none;
    flex-basis: 100%;
  }
}

@media (max-width: 600px) {
  .app-table {
    border-radius: 13px;
  }

  .app-table__title-row,
  .app-table__utility-row {
    padding: 14px;
  }

  .app-table__actions > :deep(.v-btn) {
    flex: 1 1 auto;
  }

  .app-table__data :deep(tbody td) {
    height: 54px !important;
  }
}
</style>
