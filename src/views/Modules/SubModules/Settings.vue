<template>
  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">App Settings</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Personalize the application experience.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Configurations</v-chip>
    </div>

    <!-- Wait for global authUser to hydrate before rendering tabs -->
    <template v-if="authUser">
      <v-tabs v-model="tab" color="primary" class="mb-4">
        <v-tab value="general">
          <v-icon icon="mdi-palette-outline" start size="small" />
          General
        </v-tab>

        <v-tab v-if="canViewTasks" value="scheduled-tasks">
          <v-icon icon="mdi-clock-time-eight-outline" start size="small" />
          Scheduled Tasks
        </v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- GENERAL TAB -->
        <v-window-item value="general">
          <v-alert
            v-if="!canManageAppSettings"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            Company-wide policies are read-only. An administrator can change
            them here.
          </v-alert>

          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="settings-card h-100">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-palette-outline" start />
                  Your experience
                </v-card-title>
                <v-card-text>
                  <v-select
                    v-model="theme"
                    label="Application theme"
                    :items="themeOptions"
                    density="compact"
                    variant="outlined"
                    prepend-inner-icon="mdi-theme-light-dark"
                    hide-details
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="settings-card h-100">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-domain" start />
                  Organization
                </v-card-title>
                <v-card-text class="d-flex flex-column ga-3">
                  <v-text-field
                    v-model="appSettingValues['organization.company_name']"
                    label="Company name"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-select
                    v-model="appSettingValues['organization.timezone']"
                    label="Company timezone"
                    :items="timezoneOptions"
                    density="compact"
                    variant="outlined"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" lg="6">
              <v-card variant="outlined" class="settings-card h-100">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-clock-check-outline" start />
                  Attendance capture
                </v-card-title>
                <v-card-subtitle>
                  Choose what is collected when an employee times in or out.
                </v-card-subtitle>
                <v-card-text class="setting-list">
                  <v-switch
                    v-model="appSettingValues['attendance.photo_capture_enabled']"
                    label="Allow optional photos"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-select
                    v-if="appSettingValues['attendance.photo_capture_enabled']"
                    v-model="appSettingValues['attendance.photo_max_size_mb']"
                    label="Photo size limit (MB)"
                    :items="[1, 2, 5, 10]"
                    density="compact"
                    variant="outlined"
                    hide-details
                    class="mb-2"
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['attendance.location_capture_enabled']"
                    label="Capture current location"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['attendance.location_required']"
                    label="Location is required"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="
                      !canManageAppSettings ||
                      !appSettingValues['attendance.location_capture_enabled']
                    "
                  />
                  <v-switch
                    v-model="appSettingValues['attendance.notes_enabled']"
                    label="Allow optional notes"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['attendance.capture_ip_enabled']"
                    label="Record source IP address"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['attendance.manual_entries_enabled']"
                    label="Allow administrator manual entries"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" lg="6">
              <v-card variant="outlined" class="settings-card h-100">
                <v-card-title class="text-subtitle-1">
                  <v-icon icon="mdi-tune-variant" start />
                  Modules and notifications
                </v-card-title>
                <v-card-subtitle>
                  Company-wide behavior for supporting features.
                </v-card-subtitle>
                <v-card-text class="setting-list">
                  <v-switch
                    v-model="appSettingValues['leave.attachments_enabled']"
                    label="Leave request attachments"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['messaging.realtime_enabled']"
                    label="Real-time messaging"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                  <v-switch
                    v-model="appSettingValues['notifications.success_alerts_enabled']"
                    label="Global success alerts"
                    color="primary"
                    density="compact"
                    hide-details
                    :disabled="!canManageAppSettings"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-6">
            <v-btn
              color="primary"
              class="text-none"
              prepend-icon="mdi-content-save-outline"
              @click="saveGeneralSettings"
              :loading="saving || appSettingsLoading"
            >
              Save Changes
            </v-btn>
          </div>
        </v-window-item>

        <!-- SCHEDULED TASKS TAB -->
        <v-window-item v-if="canViewTasks" value="scheduled-tasks">
          <v-sheet
            class="pa-4 mb-5 d-flex align-center"
            border
            rounded
            color="transparent"
          >
            <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
              <v-icon icon="mdi-clock-time-eight-outline" size="large" />
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">
                Scheduled Tasks
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Automate recurring jobs without touching the server crontab.
              </div>
            </div>
          </v-sheet>

          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mb-4"
            icon="mdi-information-outline"
          >
            "Leave Accrual"'s timing is auto-derived from the active rules in
            Leave Credit Settings, so its schedule fields are locked here.
            Change how often it runs by editing the rules there, not on this
            row.
          </v-alert>

          <Table
            entity="ScheduledTask"
            title=""
            :headers="taskHeaders"
            :data="taskItems"
            :pagination="taskPagination"
            :loading="taskLoading"
            @filter="onTaskFilter"
            @create="onTaskCreate"
            @view="onTaskView"
            @edit="onTaskEdit"
            @remove="onTaskRemove"
          >
            <template #extra-actions="{ item }">
              <v-btn
                v-if="checkPermissions('run-scheduled-tasks')"
                color="success"
                variant="tonal"
                size="small"
                elevation="4"
                density="comfortable"
                icon="mdi-play"
                :loading="runningId === item.id"
                :title="`Run ${item.name} now`"
                :aria-label="`Run ${item.name} now`"
                @click="runTaskNow(item)"
              />
            </template>
          </Table>

          <Form
            :visible="taskDialog.visible"
            :action="taskDialog.action"
            entity="ScheduledTask"
            :fields="taskFieldsForDialog"
            :form="defaultTaskForm"
            :data="taskDialog.data"
            :loading="taskLoadingActions"
            @close="taskDialog.visible = false"
            @execute="onTaskExecute"
          />
        </v-window-item>
      </v-window>
    </template>

    <!-- Loading state while waiting for global authUser -->
    <template v-else>
      <div class="pa-10 text-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </div>
    </template>
  </v-container>
</template>

<script lang="ts" setup>
import { onMounted, ref, reactive, computed, watch } from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "@/composables/useAuth";
import { useApi } from "@/composables/useApi";
import { usePermissions } from "@/composables/usePermissions";
import { useAppSettings } from "@/composables/useAppSettings";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import { ColumnConfig } from "@/types/types";
import axios from "@/plugins/axios";

const tab = ref("general");

/* ---------------------------------------------------------------------- */
/* General / theme                                                        */
/* ---------------------------------------------------------------------- */

const theme = ref("light");
const themeOptions = ["light", "dark"];
const saving = ref(false);
const vuetifyTheme = useTheme();

// Removed getUser since BaseContainer handles fetching it for the global state
const { getSettings, updateSettings, authUser } = useAuth();
const { checkPermissions } = usePermissions();
const {
  values: appSettingValues,
  loading: appSettingsLoading,
  loadAppSettings,
  updateAppSettings,
} = useAppSettings();

const canManageAppSettings = computed(() =>
  checkPermissions("manage-app-settings"),
);
const timezoneOptions = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

// Force Vue to reactively track the global permissions array directly!
const canViewTasks = computed(() => {
  if (!authUser.value?.role?.permissions) {
    return false;
  }
  return checkPermissions("view-scheduled-tasks");
});

const applyTheme = (themeName: string) => {
  vuetifyTheme.global.name.value = themeName;
  localStorage.setItem("APP_THEME", themeName);
};

const saveGeneralSettings = async () => {
  saving.value = true;
  try {
    applyTheme(theme.value);
    await updateSettings({ theme: theme.value });
    if (canManageAppSettings.value) {
      if (!appSettingValues.value["attendance.location_capture_enabled"]) {
        appSettingValues.value["attendance.location_required"] = false;
      }
      await updateAppSettings({ ...appSettingValues.value });
    }
  } finally {
    saving.value = false;
  }
};

/* ---------------------------------------------------------------------- */
/* Scheduled tasks                                                        */
/* ---------------------------------------------------------------------- */

const {
  items: taskItems,
  pagination: taskPagination,
  loading: taskLoading,
  loadingActions: taskLoadingActions,
  index: indexTasks,
  store: storeTask,
  update: updateTask,
  destroy: destroyTask,
} = useApi("/scheduled-tasks");

const runningId = ref<string | null>(null);

// Automatically fetch table data the moment the global user permission passes
watch(
  canViewTasks,
  async (hasPermission) => {
    if (hasPermission) {
      await indexTasks();
    }
  },
  { immediate: true },
);

const dayOptions = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

const monthOptions = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

const formatDateTime = (value: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString();
};

const formatTaskOutput = (value: string) => {
  if (!value) return "-";
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
};

const taskHeaders: ColumnConfig[] = [
  { key: "name", title: "Name" },
  { key: "command", title: "Command" },
  {
    key: "frequency",
    title: "Frequency",
    displayAs: "chip",
    chipColor: "primary",
  },
  {
    key: "is_active",
    title: "Status",
    displayAs: "chip",
    chipColor: "success",
    formatter: (value: boolean) => (value ? "Active" : "Paused"),
  },
  { key: "last_run_at", title: "Last Run", formatter: formatDateTime },
  { key: "next_run_at", title: "Next Run", formatter: formatDateTime },
  { key: "last_run_output", title: "Last Result", formatter: formatTaskOutput },
  { key: "action", title: "Actions" },
];

const taskFields: ColumnConfig[] = [
  { key: "name", title: "Name", inputField: "text", required: true },
  { key: "description", title: "Description", inputField: "text" },
  {
    key: "command",
    title: "Artisan Command",
    inputField: "text",
    required: true,
  },
  {
    key: "frequency",
    selectKey: "frequency",
    title: "Frequency",
    inputField: "select",
    required: true,
    inputOptions: [
      { label: "Daily", value: "daily" },
      { label: "Weekly", value: "weekly" },
      { label: "Monthly", value: "monthly" },
      { label: "Yearly", value: "yearly" },
      { label: "Custom (cron expression)", value: "custom" },
    ],
    onChange: (value: string, form: Record<string, any>) => ({
      run_days: value === "weekly" ? (form.run_days ?? []) : [],
      run_day_of_month: ["monthly", "yearly"].includes(value)
        ? (form.run_day_of_month ?? 1)
        : null,
      run_months: value === "yearly" ? (form.run_months ?? []) : [],
      cron_expression: value === "custom" ? (form.cron_expression ?? "") : "",
    }),
  },
  { key: "run_time", title: "Run Time", inputField: "time" },
  { key: "timezone", title: "Timezone", inputField: "text" },
  {
    key: "run_days",
    selectKey: "run_days",
    title: "Run On (weekly only)",
    inputField: "select",
    inputOptions: dayOptions,
    multiple: true,
  },
  {
    key: "run_day_of_month",
    title: "Day of Month (monthly / yearly)",
    inputField: "text",
  },
  {
    key: "run_months",
    selectKey: "run_months",
    title: "Months (yearly only)",
    inputField: "select",
    inputOptions: monthOptions,
    multiple: true,
  },
  {
    key: "cron_expression",
    title: "Cron Expression (custom only)",
    inputField: "text",
  },
  { key: "is_active", title: "Active", inputField: "checkbox" },
];

const defaultTaskForm = {
  name: "",
  description: "",
  command: "",
  frequency: "daily",
  run_time: "00:00",
  timezone: "Asia/Manila",
  run_days: [] as number[],
  run_day_of_month: 1,
  run_months: [] as number[],
  cron_expression: "",
  is_active: true,
};

const autoManagedTaskNames = ["Leave Accrual"];
const autoManagedFieldKeys = new Set([
  "command",
  "frequency",
  "run_time",
  "run_days",
  "run_day_of_month",
  "run_months",
  "cron_expression",
]);

const isAutoManaged = (item: any) => autoManagedTaskNames.includes(item?.name);

const taskFieldsForDialog = computed<ColumnConfig[]>(() =>
  taskFields.map((field) =>
    isAutoManaged(taskDialog.data) && autoManagedFieldKeys.has(field.key)
      ? { ...field, readOnly: true }
      : field,
  ),
);

const taskDialog = reactive<{ visible: boolean; action: string; data: any }>({
  visible: false,
  action: "Create",
  data: {},
});

const onTaskFilter = (options: any) => indexTasks(options);
const onTaskCreate = () => {
  taskDialog.action = "Create";
  taskDialog.data = {};
  taskDialog.visible = true;
};
const onTaskView = (item: any) => {
  taskDialog.action = "View";
  taskDialog.data = item;
  taskDialog.visible = true;
};
const onTaskEdit = (item: any) => {
  taskDialog.action = "Edit";
  taskDialog.data = item;
  taskDialog.visible = true;
};
const onTaskRemove = (item: any) => {
  taskDialog.action = "Remove";
  taskDialog.data = item;
  taskDialog.visible = true;
};

const onTaskExecute = async (form: any) => {
  if (taskDialog.action === "Create") await storeTask(form);
  else if (taskDialog.action === "Edit")
    await updateTask(taskDialog.data.id, form);
  else if (taskDialog.action === "Remove")
    await destroyTask(taskDialog.data.id);

  taskDialog.visible = false;
};

const runTaskNow = async (item: any) => {
  runningId.value = item.id;
  try {
    await axios.post(`/scheduled-tasks/${item.id}/run`);
    await indexTasks();
  } finally {
    runningId.value = null;
  }
};

onMounted(async () => {
  const [savedSettings] = await Promise.all([
    getSettings(),
    loadAppSettings(),
  ]);
  const savedTheme =
    savedSettings?.theme || localStorage.getItem("APP_THEME") || "light";
  theme.value = savedTheme;
  applyTheme(savedTheme);
});
</script>

<style scoped>
.settings-card :deep(.v-card-title) {
  padding-bottom: 8px;
}

.settings-card :deep(.v-card-subtitle) {
  white-space: normal;
}

.setting-list {
  display: grid;
  gap: 4px;
}
</style>
