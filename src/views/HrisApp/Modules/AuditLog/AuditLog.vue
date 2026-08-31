<template>
  <v-container fluid>
    <ModuleHeader
      eyebrow="Security and compliance"
      title="Audit Logs"
      subtitle="Track user actions and system changes across all modules."
      icon="mdi-shield-search-outline"
    />

    <v-card variant="flat" class="border mb-4">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="filters.search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              variant="outlined"
              clearable
              hide-details
              @update:model-value="debouncedSearch"
              @click:clear="fetchLogs()"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="filters.from"
              type="date"
              label="From"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="fetchLogs()"
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-text-field
              v-model="filters.to"
              type="date"
              label="To"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="fetchLogs()"
            />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end">
            <v-btn
              variant="tonal"
              prepend-icon="mdi-refresh"
              @click="resetFilters"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card variant="flat" class="border">
      <v-data-table-server
        :headers="headers"
        :items="items"
        :items-length="pagination.total"
        :loading="loading"
        :items-per-page="pagination.itemsPerPage || 10"
        item-value="id"
        @update:options="onOptionsUpdate"
      >
        <template #item.created_at="{ item }: { item: AuditLogEntry }">
          {{ formatDateTime(item.created_at) }}
        </template>

        <template #item.module="{ item }: { item: AuditLogEntry }">
          <v-chip size="small" color="primary" variant="tonal">
            {{ formatModuleName(item.module) }}
          </v-chip>
        </template>

        <template #item.action="{ item }: { item: AuditLogEntry }">
          <v-chip size="small" color="info" variant="tonal">
            {{ item.action }}
          </v-chip>
        </template>

        <template #item.result="{ item }: { item: AuditLogEntry }">
          <v-chip
            size="small"
            :color="item.result === 'Success' ? 'green' : 'red'"
            variant="flat"
          >
            {{ item.result }}
          </v-chip>
        </template>

        <template #item.action_details="{ item }: { item: AuditLogEntry }">
          <v-btn
            size="small"
            variant="text"
            prepend-icon="mdi-eye-outline"
            @click="viewLog(item)"
          >
            View
          </v-btn>
        </template>

        <template #no-data>
          <div class="py-8 text-center text-medium-emphasis">
            No audit logs found for the selected filters.
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="isDetailVisible" max-width="640">
      <v-card v-if="selectedLog">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Audit Log Detail</span>
          <v-chip
            size="small"
            :color="selectedLog.result === 'Success' ? 'green' : 'red'"
            variant="flat"
          >
            {{ selectedLog.result }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row dense>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Timestamp</div>
              <div>{{ formatDateTime(selectedLog.created_at) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">User</div>
              <div>{{ selectedLog.user_full_name }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Module</div>
              <div>{{ formatModuleName(selectedLog.module) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis">Action</div>
              <div>{{ selectedLog.action }}</div>
            </v-col>
            <v-col v-if="selectedLog.ip_address" cols="6">
              <div class="text-caption text-medium-emphasis">IP address</div>
              <div>{{ selectedLog.ip_address }}</div>
            </v-col>
            <v-col
              v-if="selectedLog.http_method || selectedLog.route_name"
              cols="6"
            >
              <div class="text-caption text-medium-emphasis">API request</div>
              <div>
                {{ selectedLog.http_method || "—" }}
                {{ selectedLog.route_name || "" }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-3" />

          <div class="text-caption text-medium-emphasis mb-1">Payload</div>
          <pre class="payload-block">{{ formattedPayload }}</pre>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="isDetailVisible = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/audit_log";
import { formatDateTime } from "@/utils/dateFormatter";
import type { ColumnConfig } from "@/types/types";

// Shape of a single audit log row, as returned by GET /audit-logs.
// Typing useApi with this (instead of leaving it to infer `unknown`)
// is what lets the `{ item }` scoped slots below type-check.
interface AuditLogEntry {
  id: string;
  created_at: string;
  module: string;
  action: string;
  result: "Success" | "Failed" | string;
  user_full_name: string;
  action_details?: unknown;
  payload?: string | Record<string, unknown> | null;
  ip_address?: string | null;
  http_method?: string | null;
  route_name?: string | null;
}

const headers = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);

const { index, items, loading, pagination } =
  useApi<AuditLogEntry>("/audit-logs");

const defaultFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const defaultTo = () => new Date().toISOString().slice(0, 10);

const filters = ref({
  search: "",
  from: defaultFrom(),
  to: defaultTo(),
});

let searchDebounce: ReturnType<typeof setTimeout> | undefined;
const debouncedSearch = () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => fetchLogs(), 400);
};

const fetchLogs = async (options: any = {}) => {
  await index({
    ...options,
    search: filters.value.search || undefined,
    from: filters.value.from,
    to: filters.value.to,
  });
};

const onOptionsUpdate = (options: any) => {
  fetchLogs({
    page: options.page,
    itemsPerPage: options.itemsPerPage,
    sortBy: options.sortBy,
  });
};

const resetFilters = () => {
  filters.value = { search: "", from: defaultFrom(), to: defaultTo() };
  fetchLogs();
};

const isDetailVisible = ref(false);
const selectedLog = ref<AuditLogEntry | null>(null);

const viewLog = (item: AuditLogEntry) => {
  selectedLog.value = item;
  isDetailVisible.value = true;
};

const formatModuleName = (moduleName: string) => {
  if (!moduleName) return "-";
  const parts = moduleName.split("\\");
  return parts[parts.length - 1];
};

const formattedPayload = computed(() => {
  if (!selectedLog.value?.payload) return "—";

  try {
    const parsed =
      typeof selectedLog.value.payload === "string"
        ? JSON.parse(selectedLog.value.payload)
        : selectedLog.value.payload;

    return JSON.stringify(parsed, null, 2);
  } catch {
    return selectedLog.value.payload;
  }
});

onMounted(async () => {
  await fetchLogs();
});
</script>

<style scoped>
.payload-block {
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.045);
  border-radius: 8px;
  padding: 12px;
  font-size: 12.5px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
