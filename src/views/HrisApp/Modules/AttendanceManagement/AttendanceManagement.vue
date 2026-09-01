<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :fields="fields"
    :data="data"
    @close="close"
    @execute="execute"
  />

  <v-dialog v-model="captureDialog" persistent max-width="540">
    <v-card>
      <v-card-title class="d-flex align-center ga-2">
        <v-avatar
          :color="captureAction === 'time-in' ? 'success' : 'primary'"
          variant="tonal"
          size="36"
        >
          <v-icon
            :icon="
              captureAction === 'time-in'
                ? 'mdi-login-variant'
                : 'mdi-logout-variant'
            "
          />
        </v-avatar>
        {{ captureActionLabel }}
      </v-card-title>

      <v-card-text class="capture-form">
        <v-alert type="info" variant="tonal" density="compact">
          Your attendance time is recorded by the server when you confirm.
          Photos are always optional.
        </v-alert>

        <template v-if="locationEnabled">
          <div class="text-caption font-weight-bold text-uppercase">
            Current location
          </div>
          <v-sheet border rounded class="pa-3">
            <div
              v-if="locationStatus === 'loading'"
              class="d-flex align-center ga-2 text-body-2"
            >
              <v-progress-circular indeterminate size="18" width="2" />
              Getting your current locationâ€¦
            </div>
            <div
              v-else-if="locationStatus === 'ready'"
              class="d-flex align-center justify-space-between flex-wrap ga-2"
            >
              <div class="d-flex align-center ga-2 text-body-2">
                <v-icon icon="mdi-map-marker-check" color="success" />
                <div>
                  <div>Location captured</div>
                  <div class="text-caption text-medium-emphasis">
                    Accuracy: {{ Math.round(captureLocation.accuracy || 0) }} m
                  </div>
                </div>
              </div>
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-map-outline"
                :href="captureMapUrl"
                target="_blank"
              >
                View map
              </v-btn>
            </div>
            <div v-else class="d-flex align-center justify-space-between ga-2">
              <div class="text-body-2 text-error">
                <v-icon icon="mdi-map-marker-alert-outline" class="mr-1" />
                {{ locationError }}
              </div>
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-refresh"
                @click="requestLocation"
              >
                Retry
              </v-btn>
            </div>
          </v-sheet>
        </template>

        <v-file-input
          v-if="photoEnabled"
          v-model="capturePhoto"
          label="Optional attendance photo"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          prepend-inner-icon="mdi-camera-outline"
          prepend-icon=""
          density="compact"
          variant="outlined"
          show-size
          clearable
          hide-details="auto"
        />

        <v-textarea
          v-if="notesEnabled"
          v-model="captureNotes"
          label="Optional note"
          rows="2"
          auto-grow
          maxlength="500"
          counter
          density="compact"
          variant="outlined"
          hide-details="auto"
        />
      </v-card-text>

      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="closeCapture">Cancel</v-btn>
        <v-btn
          :color="captureAction === 'time-in' ? 'success' : 'primary'"
          variant="flat"
          :prepend-icon="
            captureAction === 'time-in'
              ? 'mdi-login-variant'
              : 'mdi-logout-variant'
          "
          :loading="captureSubmitting"
          :disabled="captureBlocked"
          @click="submitCapture"
        >
          Confirm {{ captureActionLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-container fluid>
    <ModuleHeader
      eyebrow="Time and attendance"
      title="Attendance Management"
      subtitle="Capture your workday and manage attendance records."
      icon="mdi-clock-check-outline"
    />

    <v-tabs v-model="attendanceTab" color="primary" class="mb-4">
      <v-tab value="records">Attendance Records</v-tab>
      <v-tab value="corrections">Corrections</v-tab>
    </v-tabs>

    <v-window v-model="attendanceTab">
      <v-window-item value="records">
        <v-card variant="flat" class="mb-5 attendance-card">
          <v-card-text>
            <div
              v-if="authUser?.employee"
              class="d-flex align-center justify-space-between flex-wrap ga-4"
            >
              <div class="d-flex align-center ga-3">
                <v-avatar color="primary" variant="tonal" size="50">
                  <v-icon icon="mdi-clock-outline" size="28" />
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">My workday</div>
                  <div
                    v-if="todayLoading"
                    class="text-body-2 text-medium-emphasis"
                  >
                    Loading todayâ€™s attendanceâ€¦
                  </div>
                  <template v-else-if="todayAttendance">
                    <div class="text-body-2">
                      Time in:
                      <strong>{{ formatTime(todayAttendance.time_in) }}</strong>
                      <span v-if="todayAttendance.time_out">
                        Â· Time out:
                        <strong>{{
                          formatTime(todayAttendance.time_out)
                        }}</strong>
                      </span>
                    </div>
                    <div class="d-flex flex-wrap ga-2 mt-2">
                      <v-chip
                        v-if="todayAttendance.has_time_in_photo"
                        size="x-small"
                        prepend-icon="mdi-camera-check-outline"
                      >
                        Time-in photo
                      </v-chip>
                      <v-chip
                        v-if="todayAttendance.time_in_latitude"
                        size="x-small"
                        prepend-icon="mdi-map-marker-check-outline"
                      >
                        Time-in location
                      </v-chip>
                      <v-chip
                        v-if="todayAttendance.has_time_out_photo"
                        size="x-small"
                        prepend-icon="mdi-camera-check-outline"
                      >
                        Time-out photo
                      </v-chip>
                    </div>
                  </template>
                  <div v-else class="text-body-2 text-medium-emphasis">
                    You have not timed in today.
                  </div>
                </div>
              </div>

              <div>
                <v-btn
                  v-if="!todayAttendance"
                  color="success"
                  variant="flat"
                  prepend-icon="mdi-login-variant"
                  @click="openCapture('time-in')"
                >
                  Time In
                </v-btn>
                <v-btn
                  v-else-if="!todayAttendance.time_out"
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-logout-variant"
                  @click="openCapture('time-out')"
                >
                  Time Out
                </v-btn>
                <v-chip v-else color="success" variant="tonal">
                  <v-icon icon="mdi-check-circle-outline" start />
                  Workday complete
                </v-chip>
              </div>
            </div>

            <v-alert v-else type="warning" variant="tonal" density="compact">
              Your user account is not linked to an employee profile, so
              attendance capture is unavailable.
            </v-alert>
          </v-card-text>
        </v-card>

        <Table
          v-if="canViewCompanyAttendance"
          :entity="entity"
          title="Attendance Records"
          :headers="fields"
          :data="items"
          :loading="loading"
          :pagination="pagination"
          :relations="relations"
          :show-create-action="manualEntriesEnabled && canManageAttendance"
          :show-edit-action="manualEntriesEnabled && canManageAttendance"
          :show-delete-action="manualEntriesEnabled && canManageAttendance"
          @filter="fetchAttendance"
          @create="create"
          @view="view"
          @edit="edit"
          @remove="remove"
        >
          <template #filters>
            <v-text-field
              v-model="selectedDate"
              type="date"
              density="compact"
              variant="outlined"
              hide-details
              class="date-input"
              @update:model-value="onDateChange"
            />
          </template>
          <template #extra-actions="{ item }">
            <v-chip
              v-if="item.exception_codes?.includes('late')"
              size="x-small"
              color="warning"
              >Late {{ item.late_minutes }}m</v-chip
            >
            <v-chip
              v-if="item.exception_codes?.includes('undertime')"
              size="x-small"
              color="warning"
              >Undertime {{ item.undertime_minutes }}m</v-chip
            >
            <v-chip
              v-if="item.exception_codes?.includes('missing_clock_out')"
              size="x-small"
              color="error"
              >Missing out</v-chip
            >
            <v-chip
              v-if="item.exception_codes?.includes('unscheduled_attendance')"
              size="x-small"
              color="info"
              >Unscheduled</v-chip
            >
            <v-btn
              v-if="item.has_time_in_photo"
              class="app-table__icon-action"
              icon="mdi-camera-outline"
              color="secondary"
              variant="tonal"
              size="small"
              density="comfortable"
              title="Download time-in photo"
              @click="downloadPhoto(item, 'time-in')"
            />
            <v-btn
              v-if="item.has_time_out_photo"
              class="app-table__icon-action"
              icon="mdi-camera-timer"
              color="secondary"
              variant="tonal"
              size="small"
              density="comfortable"
              title="Download time-out photo"
              @click="downloadPhoto(item, 'time-out')"
            />
            <v-btn
              v-if="item.time_in_latitude && item.time_in_longitude"
              class="app-table__icon-action"
              icon="mdi-map-marker-outline"
              color="success"
              variant="tonal"
              size="small"
              density="comfortable"
              title="View time-in location"
              @click="openMap(item.time_in_latitude, item.time_in_longitude)"
            />
          </template>
        </Table>
      </v-window-item>
      <v-window-item value="corrections">
        <AttendanceCorrections :show-header="false" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import { useApi } from "@/composables/useApi";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePermissions } from "@/composables/usePermissions";
import { fields as importedFields } from "@/fields/attendance";
import type { ColumnConfig } from "@/types/types";
import Form from "@/components/Form.vue";
import Table from "@/components/Table.vue";
import AttendanceCorrections from "@/views/HrisApp/Modules/AttendanceCorrections.vue";
import {
  dateKeyInTimeZone,
  formatTimeInTimeZone,
  timeInputInTimeZone,
} from "@/utils/timezone";

const fields = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/attendances");
const { getOptions: getEmployees } = useApi("/employees");
const { authUser, getUser } = useAuth();
const { setting, loadAppSettings } = useAppSettings();
const { checkPermissions } = usePermissions();
const companyTimezone = computed(() =>
  setting("organization.timezone", "Asia/Manila"),
);

const relations = "employee.user";
const entity = ref("Attendance");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const todayAttendance = ref<any>(null);
const todayLoading = ref(false);
const captureDialog = ref(false);
const captureAction = ref<"time-in" | "time-out">("time-in");
const captureNotes = ref("");
const capturePhoto = ref<any>(null);
const captureSubmitting = ref(false);
const locationStatus = ref<"idle" | "loading" | "ready" | "error">("idle");
const locationError = ref("Location has not been captured.");
const captureLocation = ref({ latitude: 0, longitude: 0, accuracy: 0 });

const photoEnabled = computed(() =>
  setting("attendance.photo_capture_enabled", true),
);
const locationEnabled = computed(() =>
  setting("attendance.location_capture_enabled", true),
);
const locationRequired = computed(() =>
  setting("attendance.location_required", false),
);
const notesEnabled = computed(() => setting("attendance.notes_enabled", true));
const manualEntriesEnabled = computed(() =>
  setting("attendance.manual_entries_enabled", true),
);
const canViewCompanyAttendance = computed(() =>
  checkPermissions("view-attendances"),
);
const canManageAttendance = computed(() =>
  checkPermissions("manage-attendances"),
);
const captureActionLabel = computed(() =>
  captureAction.value === "time-in" ? "Time In" : "Time Out",
);
const captureBlocked = computed(
  () =>
    captureSubmitting.value ||
    locationStatus.value === "loading" ||
    (locationEnabled.value &&
      locationRequired.value &&
      locationStatus.value !== "ready"),
);
const captureMapUrl = computed(
  () =>
    `https://www.google.com/maps?q=${captureLocation.value.latitude},${captureLocation.value.longitude}`,
);

const todayIso = () => dateKeyInTimeZone(new Date(), companyTimezone.value);
const selectedDate = ref(todayIso());
const attendanceTab = ref("records");

const fetchAttendance = async (options: any = {}) => {
  await index({ ...options, relations, date: selectedDate.value });
};

const fetchTodayAttendance = async () => {
  if (!authUser.value?.employee) return;

  todayLoading.value = true;
  try {
    const response = await axios.get("/attendances/today", {
      headers: { "X-Suppress-Success-Notification": "true" },
    });
    todayAttendance.value = response.data.data;
  } finally {
    todayLoading.value = false;
  }
};

const onDateChange = () => fetchAttendance();

type AttendanceForm = {
  id: string;
  employee_id: string;
  date: string;
  time_in: string;
  time_out: string;
  time_in_notes: string;
  time_out_notes: string;
};

const initializeForm = (): AttendanceForm => ({
  id: "",
  employee_id: "",
  date: selectedDate.value,
  time_in: timeInputInTimeZone(new Date(), companyTimezone.value),
  time_out: "",
  time_in_notes: "",
  time_out_notes: "",
});

const form = ref<AttendanceForm>(initializeForm());
const readOnly = () => action.value === "View";

const normalizeAttendanceForForm = (item: any) => ({
  ...item,
  date: item.date?.slice?.(0, 10) ?? item.date,
  time_in: item.time_in
    ? timeInputInTimeZone(item.time_in, companyTimezone.value)
    : "",
  time_out: item.time_out
    ? timeInputInTimeZone(item.time_out, companyTimezone.value)
    : "",
});

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((o: any) => string),
): void => {
  const mapped = options.map((o: any) => ({
    label: typeof label === "function" ? label(o) : (o[label] ?? ""),
    value: o.id,
  }));
  const field = fields.value.find((f) => f.selectKey === selectKey);
  if (field) field.inputOptions = mapped;
};

const loadOptions = async () => {
  const employees = await getEmployees({ relations: "user" });
  setSelectOptions(
    "employee_id",
    employees,
    (employee) =>
      `${employee.user.first_name} ${employee.user.last_name} - ${employee.user?.email ?? ""}`,
  );
};

const create = () => {
  form.value = initializeForm();
  data.value = { ...form.value };
  action.value = "Create";
  isFormVisible.value = true;
};

const view = (item: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = normalizeAttendanceForForm(item);
};

const edit = (item: any) => {
  isFormVisible.value = true;
  action.value = "Edit";
  data.value = normalizeAttendanceForForm(item);
};

const remove = (item: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = item;
};

const close = () => {
  isFormVisible.value = false;
  form.value = initializeForm();
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") await store(payload);
    else if (action.value === "Edit") await update(payload.id, payload);
    else if (action.value === "Remove") await destroy(payload.id);

    isFormVisible.value = false;
    await Promise.all([fetchAttendance(), fetchTodayAttendance()]);
  } catch (error) {
    console.error(error);
  }
};

const openCapture = (nextAction: "time-in" | "time-out") => {
  captureAction.value = nextAction;
  captureNotes.value = "";
  capturePhoto.value = null;
  captureLocation.value = { latitude: 0, longitude: 0, accuracy: 0 };
  locationStatus.value = locationEnabled.value ? "loading" : "idle";
  locationError.value = "Location has not been captured.";
  captureDialog.value = true;

  if (locationEnabled.value) requestLocation();
};

const closeCapture = () => {
  if (captureSubmitting.value) return;
  captureDialog.value = false;
};

const requestLocation = () => {
  if (!navigator.geolocation) {
    locationStatus.value = "error";
    locationError.value = "Location is not supported by this browser.";
    return;
  }

  locationStatus.value = "loading";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      captureLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      locationStatus.value = "ready";
    },
    (error) => {
      locationStatus.value = "error";
      locationError.value =
        error.code === error.PERMISSION_DENIED
          ? "Location permission was denied."
          : "Your current location could not be obtained.";
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  );
};

const selectedPhoto = (): File | null => {
  const value = capturePhoto.value;
  if (value instanceof File) return value;
  if (Array.isArray(value) && value[0] instanceof File) return value[0];
  return null;
};

const submitCapture = async () => {
  if (captureBlocked.value) return;

  captureSubmitting.value = true;
  try {
    const payload = new FormData();
    if (notesEnabled.value && captureNotes.value) {
      payload.append("notes", captureNotes.value);
    }

    const photo = selectedPhoto();
    if (photoEnabled.value && photo) payload.append("photo", photo);

    if (locationEnabled.value && locationStatus.value === "ready") {
      payload.append("latitude", String(captureLocation.value.latitude));
      payload.append("longitude", String(captureLocation.value.longitude));
      payload.append("accuracy", String(captureLocation.value.accuracy));
    }

    await axios.post(`/attendances/${captureAction.value}`, payload);
    captureDialog.value = false;
    await Promise.all([
      fetchTodayAttendance(),
      ...(canViewCompanyAttendance.value ? [fetchAttendance()] : []),
    ]);
  } finally {
    captureSubmitting.value = false;
  }
};

const formatTime = (value: string) =>
  value ? formatTimeInTimeZone(value, companyTimezone.value) : "â€”";

const openMap = (latitude: number, longitude: number) => {
  window.open(
    `https://www.google.com/maps?q=${latitude},${longitude}`,
    "_blank",
    "noopener,noreferrer",
  );
};

const downloadPhoto = async (item: any, type: "time-in" | "time-out") => {
  const response = await axios.get(`/attendances/${item.id}/photos/${type}`, {
    responseType: "blob",
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    item[type === "time-in" ? "time_in_photo_name" : "time_out_photo_name"] ||
    `${type}-attendance-photo`;
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(async () => {
  if (!authUser.value) await getUser();
  const initialDate = selectedDate.value;
  await loadAppSettings();
  if (selectedDate.value === initialDate) selectedDate.value = todayIso();
  const companyLoads = canViewCompanyAttendance.value
    ? [
        ...(checkPermissions("view-employees") ? [loadOptions()] : []),
        fetchAttendance(),
      ]
    : [];
  await Promise.all([...companyLoads, fetchTodayAttendance()]);
});
</script>

<style scoped>
.date-input {
  max-width: 165px;
}

.attendance-card {
  background: transparent;
}

.attendance-card :deep(.v-card-text) {
  padding-inline: 0;
}

.capture-form {
  display: grid;
  gap: 14px;
}
</style>
