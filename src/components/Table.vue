<template>
  <section class="app-table">
    <header class="app-table__toolbar">
      <div
        v-if="showTitle && (title || subtitle || icon)"
        class="app-table__title-row"
      >
        <div class="app-table__heading">
          <div v-if="icon" class="app-table__icon" aria-hidden="true">
            <v-icon :icon="icon" size="21" />
          </div>
          <div class="app-table__copy">
            <div class="d-flex align-center ga-2">
              <h1 v-if="title">{{ title }}</h1>
              <span
                v-if="props.pagination?.total !== undefined"
                class="app-table__count-pill"
                :title="`${Number(props.pagination.total).toLocaleString()} total records`"
              >
                {{ Number(props.pagination.total).toLocaleString() }}
              </span>
            </div>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="app-table__utility-row">
        <div class="app-table__actions">
          <!-- Bulk selection actions slot -->
          <template v-if="selectedCount > 0">
            <slot
              name="bulk-actions"
              :selected="selectedItems"
              :count="selectedCount"
            >
              <span class="app-table__selected-pill">
                <v-icon icon="mdi-checkbox-marked" size="14" class="mr-1" />
                {{ selectedCount }} selected
              </span>
            </slot>
          </template>

          <slot name="toolbar-actions" />

          <!-- Create Action -->
          <v-btn
            v-if="canCreate"
            class="text-none"
            color="primary"
            :prepend-icon="createIcon"
            variant="flat"
            @click="emit('create')"
          >
            {{ createLabel }}
          </v-btn>

          <!-- Refresh Action -->
          <v-btn
            v-if="showRefresh"
            class="text-none"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-refresh"
            :loading="props.loading"
            title="Refresh records"
            @click="handleRefresh"
          >
            Refresh
          </v-btn>

          <!-- Export Action -->
          <v-btn
            v-if="showExport"
            class="text-none"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-export-variant"
            @click="emit('export')"
          >
            Export
          </v-btn>

          <!-- Import Action -->
          <v-btn
            v-if="showImport && checkPermissions(`manage-${permissionEntity}`)"
            class="text-none"
            color="primary"
            prepend-icon="mdi-upload-outline"
            variant="tonal"
            @click="triggerFileInput"
          >
            Import
          </v-btn>

          <!-- Template Action -->
          <v-btn
            v-if="
              showDownloadTemplate &&
              checkPermissions(`manage-${permissionEntity}`)
            "
            class="text-none"
            color="primary"
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
            @click:clear="handleSearchClear"
          />
        </div>
      </div>
    </header>

    <v-divider />

    <v-data-table-server
      v-model="selectedItems"
      class="app-table__data"
      :headers="tableHeaders"
      :items="props.data"
      :items-length="Number(props.pagination?.total ?? 0)"
      :items-per-page-options="itemsPerPageOptions"
      :loading-text="loadingText"
      :loading="props.loading"
      :item-value="itemValue"
      :show-select="showSelect"
      :density="density"
      hover
      @update:options="handleTableChange"
      @click:row="handleRowClick"
    >
      <!-- Forward custom item cell slots -->
      <template
        v-for="header in customItemHeaders"
        :key="`item.${header.key}`"
        v-slot:[`item.${header.key}`]="slotProps"
      >
        <slot :name="`item.${header.key}`" v-bind="slotProps" />
      </template>

      <!-- Optional top and bottom slots -->
      <template v-if="$slots.top" #top>
        <slot name="top" />
      </template>
      <template v-if="$slots.bottom" #bottom>
        <slot name="bottom" />
      </template>

      <!-- Standard chip display -->
      <template
        v-for="header in chipHeaders"
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

      <!-- Standard chips array display -->
      <template
        v-for="header in chipsHeaders"
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
          <span
            v-if="formatCellArray(item, header).length === 0"
            class="app-table__empty-value"
            >—</span
          >
        </div>
      </template>

      <!-- Standard formatted or temporal cell display -->
      <template
        v-for="header in formattedHeaders"
        :key="`item.${header.key}`"
        v-slot:[`item.${header.key}`]="{ item }"
      >
        <span :class="{ 'text-no-wrap': isTemporalColumn(header) }">
          {{ formatCellValue(item, header) || "—" }}
        </span>
      </template>

      <!-- Action column -->
      <template #item.action="{ item }">
        <div
          class="app-table__row-actions"
          :class="`app-table__row-actions--${actionAlignment}`"
        >
          <v-btn
            v-if="
              showViewAction && checkPermissions(`view-${permissionEntity}`)
            "
            class="app-table__icon-action"
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
            v-if="canEdit(item)"
            class="app-table__icon-action"
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
            v-if="canDelete(item)"
            class="app-table__icon-action"
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

      <!-- Enhanced Empty state -->
      <template #no-data>
        <slot name="empty">
          <div class="app-table__empty">
            <div class="app-table__empty-icon">
              <v-icon
                :icon="
                  form.search
                    ? 'mdi-magnify-remove-outline'
                    : 'mdi-table-search'
                "
                size="28"
              />
            </div>
            <strong>{{
              form.search ? "No matching records found" : emptyTitle
            }}</strong>
            <span>
              {{
                form.search
                  ? `No records found matching "${form.search}".`
                  : emptyText
              }}
            </span>
            <v-btn
              v-if="form.search"
              variant="tonal"
              size="small"
              class="mt-2 text-none"
              prepend-icon="mdi-close"
              @click="handleSearchClear"
            >
              Clear search filter
            </v-btn>
          </div>
        </slot>
      </template>
    </v-data-table-server>
  </section>
</template>

<script lang="ts" setup>
import type { ColumnConfig, Data } from "@/types/types";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useSlots,
  watch,
} from "vue";
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
  pagination: {
    type: Object as () => Partial<Data>,
    default: () => ({ total: 0 }),
  },
  relations: { type: String, default: "" },
  loading: { type: Boolean, default: false },
  showCreateAction: { type: Boolean, default: true },
  showViewAction: { type: Boolean, default: true },
  showEditAction: { type: Boolean, default: true },
  showDeleteAction: { type: Boolean, default: true },
  showImport: { type: Boolean, default: false },
  showDownloadTemplate: { type: Boolean, default: false },
  showExport: { type: Boolean, default: false },
  showRefresh: { type: Boolean, default: false },
  showSelect: { type: Boolean, default: false },
  showSearch: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: "Search records..." },
  emptyTitle: { type: String, default: "No records found" },
  emptyText: { type: String, default: "Try changing your search or filters." },
  loadingText: { type: String, default: "Loading records..." },
  itemValue: { type: String, default: "id" },
  density: {
    type: String as () => "default" | "comfortable" | "compact",
    default: "default",
  },
  showTitle: { type: Boolean, default: true },
  createLabel: { type: String, default: "Create" },
  createIcon: { type: String, default: "mdi-plus" },
  permission: { type: String, default: "" },
  ignorePermissions: { type: Boolean, default: false },
  itemsPerPageOptions: {
    type: Array as () => number[],
    default: () => [5, 10, 20, 50, 100],
  },
  modelValue: {
    type: Array as () => any[],
    default: () => [],
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
  "export",
  "refresh",
  "update:modelValue",
  "click:row",
]);

const slots = useSlots();
const { authUser, getUser } = useAuth();
const { checkPermissions } = usePermissions();
const fileInput = ref<HTMLInputElement | null>(null);
const form = ref<Record<string, any>>({
  page: 1,
  limit: 10,
  sortBy: [],
  search: "",
});

const selectedItems = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const selectedCount = computed(() => selectedItems.value.length);

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
  () =>
    props.headers.find((header) => header.key === "action")?.align ?? "center",
);

// Custom item cell slots provided by parent component
const customItemHeaders = computed(() =>
  props.headers.filter(
    (h) =>
      Boolean(slots[`item.${h.key}`]) &&
      h.displayAs !== "chip" &&
      h.displayAs !== "chips",
  ),
);

const chipHeaders = computed(() =>
  props.headers.filter((col) => col.displayAs === "chip"),
);

const chipsHeaders = computed(() =>
  props.headers.filter((col) => col.displayAs === "chips"),
);

const formattedHeaders = computed(() =>
  props.headers.filter(
    (col) =>
      (col.formatter || isTemporalColumn(col)) &&
      col.displayAs !== "chip" &&
      col.displayAs !== "chips",
  ),
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

const canCreate = computed(() => {
  if (!props.showCreateAction) return false;
  if (props.ignorePermissions) return true;
  if (props.permission) return checkPermissions(props.permission);
  return checkPermissions(`create-${permissionEntity.value}`);
});

const canEdit = (item?: any) => {
  if (!props.showEditAction) return false;
  if (props.ignorePermissions) return true;
  if (props.permission) return checkPermissions(props.permission);
  return checkPermissions(`update-${permissionEntity.value}`);
};

const canDelete = (item?: any) => {
  if (!props.showDeleteAction) return false;
  if (
    item &&
    (item.id === authUser.value?.role_id || item.id === authUser.value?.id)
  ) {
    return false;
  }
  if (props.ignorePermissions) return true;
  if (props.permission) return checkPermissions(props.permission);
  return checkPermissions(`delete-${permissionEntity.value}`);
};

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
    const option = header.inputOptions?.find(
      (candidate: any) => candidate.value === value,
    );
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

const handleSearchClear = () => {
  form.value.search = "";
  form.value.page = 1;
  emitFilter();
};

const handleRefresh = () => {
  emit("refresh");
  emitFilter();
};

const handleTableChange = (options: any) => {
  form.value = {
    ...form.value,
    ...options,
    limit: options.itemsPerPage ?? form.value.limit,
  };
  emitFilter();
};

const handleRowClick = (event: any, row: any) => {
  emit("click:row", event, row);
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
  border-radius: 0 !important;
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
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
  padding: 16px 20px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.045),
    transparent 48%
  );
}

.app-table__utility-row {
  min-height: 64px;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  gap: 12px;
  padding: 10px 18px;
  background: rgba(var(--v-theme-on-surface), 0.012);
}

.app-table__toolbar > .app-table__utility-row:not(:first-child) {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
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
  gap: 14px;
}

.app-table__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-table__actions :deep(.v-btn),
.app-table__filters :deep(.v-btn) {
  height: 36px !important;
  min-height: 36px !important;
  border-radius: 0 !important;
  font-weight: 600 !important;
  font-size: 0.8125rem !important;
  letter-spacing: 0.01em !important;
  padding: 0 14px !important;
}

.app-table__icon,
.app-table__empty-icon {
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
}

.app-table__icon {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 0 !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.app-table__copy {
  min-width: 0;
}

.app-table__copy h1 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 750;
  line-height: 1.3;
}

.app-table__count-pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 0 !important;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  line-height: 1.2;
}

.app-table__selected-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 0 !important;
  font-size: 0.76rem;
  font-weight: 650;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.28);
}

.app-table__copy p {
  margin: 3px 0 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.76rem;
  line-height: 1.4;
}

.app-table__actions,
.app-table__filters {
  gap: 8px;
}

.app-table__filters {
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.app-table__search {
  width: clamp(280px, 30vw, 420px);
  min-width: 280px;
  flex: 0 1 420px;
  width: clamp(260px, 28vw, 380px);
  min-width: 240px;
  flex: 0 1 380px;
}

.app-table__search :deep(.v-field),
.app-table__filters :deep(.v-field) {
  border-radius: 0 !important;
  height: 36px !important;
  min-height: 36px !important;
  background: rgba(var(--v-theme-surface), 0.72);
}

.app-table__search :deep(.v-field__input),
.app-table__filters :deep(.v-field__input) {
  min-height: 36px !important;
  height: 36px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  font-size: 0.8125rem !important;
  display: flex !important;
  align-items: center !important;
}

.app-table__search :deep(.v-field__prepend-inner),
.app-table__filters :deep(.v-field__prepend-inner),
.app-table__search :deep(.v-field__append-inner),
.app-table__filters :deep(.v-field__append-inner),
.app-table__search :deep(.v-field__clearable),
.app-table__filters :deep(.v-field__clearable) {
  padding-top: 0 !important;
  align-items: center !important;
}

.app-table__data {
  background: transparent;
}

.app-table__data :deep(.v-table__wrapper) {
  overflow-x: auto;
}

.app-table__data :deep(thead th) {
  height: 48px !important;
  color: rgba(var(--v-theme-on-surface), 0.7) !important;
  background: rgba(var(--v-theme-on-surface), 0.035) !important;
  font-size: 0.72rem !important;
  font-weight: 750 !important;
  letter-spacing: 0.045em !important;
  text-transform: uppercase;
  white-space: nowrap;
}

.app-table__data :deep(tbody td) {
  height: 58px !important;
  border-bottom-color: rgba(var(--v-theme-on-surface), 0.065) !important;
  font-size: 0.83rem;
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

/* Icon-only actions use compact square footprint with zero radius */
.app-table__row-actions :deep(.app-table__icon-action) {
  width: 28px !important;
  min-width: 28px !important;
  height: 28px !important;
  padding: 0 !important;
  border-radius: 0 !important;
}

.app-table__row-actions :deep(.app-table__icon-action .v-btn__content) {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.app-table__row-actions--start {
  justify-content: flex-start;
}
.app-table__row-actions--center {
  justify-content: center;
}
.app-table__row-actions--end {
  justify-content: flex-end;
}

.app-table__chip-group {
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px 0;
}

.app-table__chip {
  font-weight: 650;
  border-radius: 0 !important;
}

.app-table__empty-value {
  color: rgba(var(--v-theme-on-surface), 0.4);
}

.app-table__empty {
  display: flex;
  min-height: 240px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  padding: 32px;
  color: rgba(var(--v-theme-on-surface), 0.68);
  text-align: center;
}

.app-table__empty-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 4px;
  border-radius: 0 !important;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.app-table__empty strong {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.95rem;
}

.app-table__empty span {
  font-size: 0.8rem;
  max-width: 360px;
  line-height: 1.4;
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
    border-radius: 0 !important;
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
