import { ref } from "vue";
import axios from "@/plugins/axios";

export type AppSettingValue = string | number | boolean | null;
// Settings are schema-driven by the backend, so individual keys intentionally
// remain dynamic at the component boundary (text fields, selects and switches
// each require a different v-model type).
export type AppSettingValues = Record<string, any>;

const storageKey = "HRIS_APP_SETTINGS";

const defaults: AppSettingValues = {
  "organization.company_name": "HRIS",
  "organization.timezone": "Asia/Manila",
  "attendance.photo_capture_enabled": true,
  "attendance.location_capture_enabled": true,
  "attendance.location_required": false,
  "attendance.notes_enabled": true,
  "attendance.capture_ip_enabled": true,
  "attendance.manual_entries_enabled": true,
  "attendance.photo_max_size_mb": 5,
  "leave.attachments_enabled": true,
  "messaging.realtime_enabled": true,
  "messaging.attachments_enabled": true,
  "messaging.max_attachment_size_mb": 25,
  "notifications.success_alerts_enabled": true,
};

const readStoredSettings = (): AppSettingValues => {
  try {
    return {
      ...defaults,
      ...JSON.parse(localStorage.getItem(storageKey) ?? "{}"),
    };
  } catch {
    return { ...defaults };
  }
};

const values = ref<AppSettingValues>(readStoredSettings());
const definitions = ref<Record<string, any>>({});
const loading = ref(false);
const initialized = ref(false);
let loadPromise: Promise<AppSettingValues> | null = null;

const persist = () => {
  localStorage.setItem(storageKey, JSON.stringify(values.value));
};

export const useAppSettings = () => {
  const loadAppSettings = async (force = false): Promise<AppSettingValues> => {
    if (initialized.value && !force) return values.value;
    if (loadPromise) return loadPromise;

    loading.value = true;
    loadPromise = (async () => {
      const response = await axios.get("/app-settings", {
        headers: { "X-Suppress-Success-Notification": "true" },
      });
      values.value = { ...defaults, ...(response.data.data?.values ?? {}) };
      definitions.value = response.data.data?.definitions ?? {};
      persist();
      return values.value;
    })();

    try {
      return await loadPromise;
    } finally {
      loadPromise = null;
      loading.value = false;
      initialized.value = true;
    }
  };

  const updateAppSettings = async (updates: AppSettingValues) => {
    loading.value = true;
    try {
      const response = await axios.put("/app-settings", { values: updates });
      values.value = {
        ...defaults,
        ...(response.data.data?.values ?? updates),
      };
      definitions.value = response.data.data?.definitions ?? definitions.value;
      persist();
      return values.value;
    } finally {
      loading.value = false;
    }
  };

  const setting = <T extends AppSettingValue>(key: string, fallback: T): T =>
    (values.value[key] ?? fallback) as T;

  return {
    values,
    definitions,
    loading,
    initialized,
    loadAppSettings,
    updateAppSettings,
    setting,
  };
};
