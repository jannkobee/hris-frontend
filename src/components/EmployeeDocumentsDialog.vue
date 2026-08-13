<template>
  <v-dialog :model-value="visible" max-width="920" scrollable @update:model-value="close">
    <v-card rounded="xl">
      <v-card-title class="document-header">
        <v-avatar color="primary" variant="tonal" size="40">
          <v-icon icon="mdi-folder-account-outline" />
        </v-avatar>
        <div class="min-width-0">
          <div class="text-subtitle-1 font-weight-bold">Employee 201 files</div>
          <div class="text-caption text-medium-emphasis text-truncate">
            {{ employeeLabel }} · Private personnel records
          </div>
        </div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />
      <v-card-text class="pa-5">
        <v-expand-transition>
          <section v-if="canManage" class="upload-panel mb-5">
            <div class="d-flex align-center ga-3 mb-4">
              <v-icon icon="mdi-file-upload-outline" color="primary" />
              <div>
                <div class="text-subtitle-2 font-weight-bold">Add personnel document</div>
                <div class="text-caption text-medium-emphasis">
                  PDF, Office, or image file. Maximum {{ maxSizeMb }} MB.
                </div>
              </div>
            </div>
            <div class="upload-grid">
              <v-select
                v-model="form.category"
                :items="categoryOptions"
                item-title="title"
                item-value="value"
                label="Category"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
              <v-text-field
                v-model="form.title"
                label="Document title"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
              <v-text-field
                v-model="form.document_number"
                label="Document number (optional)"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
              <v-select
                v-model="form.visibility"
                :items="visibilityOptions"
                item-title="title"
                item-value="value"
                label="Who can view"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
              <v-text-field
                v-model="form.expires_at"
                type="date"
                label="Expiry date (optional)"
                density="compact"
                variant="outlined"
                hide-details="auto"
              />
              <v-file-input
                v-model="selectedFile"
                label="Choose document"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                density="compact"
                variant="outlined"
                hide-details="auto"
                class="upload-file"
              />
              <v-btn
                color="primary"
                prepend-icon="mdi-upload"
                class="text-none upload-button"
                :loading="uploading"
                :disabled="!form.category || !form.title || !normalizedFile"
                @click="upload"
              >
                Upload
              </v-btn>
            </div>
          </section>
        </v-expand-transition>

        <div class="d-flex align-center justify-space-between mb-3">
          <div>
            <div class="text-subtitle-2 font-weight-bold">Documents</div>
            <div class="text-caption text-medium-emphasis">
              {{ documents.length }} {{ documents.length === 1 ? "record" : "records" }}
            </div>
          </div>
          <v-btn icon="mdi-refresh" variant="text" size="small" :loading="loading" @click="load" />
        </div>

        <v-skeleton-loader v-if="loading" type="list-item-three-line@3" />
        <div v-else-if="documents.length" class="document-list">
          <article v-for="document in documents" :key="document.id" class="document-row">
            <v-avatar color="primary" variant="tonal" size="42">
              <v-icon :icon="fileIcon(document.mime_type)" size="21" />
            </v-avatar>
            <div class="document-copy">
              <div class="d-flex align-center ga-2 flex-wrap">
                <strong>{{ document.title }}</strong>
                <v-chip size="x-small" variant="tonal">{{ categoryLabel(document.category) }}</v-chip>
                <v-chip v-if="document.visibility === 'hr_only'" size="x-small" color="warning" variant="tonal" prepend-icon="mdi-lock-outline">HR only</v-chip>
                <v-chip
                  v-if="document.expires_at"
                  size="x-small"
                  :color="isExpired(document.expires_at) ? 'error' : 'warning'"
                  variant="tonal"
                >
                  {{ isExpired(document.expires_at) ? "Expired" : `Expires ${formatDate(document.expires_at)}` }}
                </v-chip>
              </div>
              <small>{{ document.original_name }} · {{ formatBytes(document.size) }}</small>
              <small v-if="document.document_number">No. {{ document.document_number }}</small>
            </div>
            <v-btn
              icon="mdi-download-outline"
              size="small"
              variant="tonal"
              color="primary"
              title="Download"
              @click="download(document)"
            />
            <v-btn
              v-if="canManage"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              title="Remove"
              @click="remove(document)"
            />
          </article>
        </div>
        <div v-else class="empty-documents">
          <v-icon icon="mdi-folder-open-outline" size="42" color="medium-emphasis" />
          <strong>No personnel documents yet</strong>
          <span>{{ canManage ? "Upload the first record above." : "HR has not added records to this file." }}</span>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import axios from "@/plugins/axios";
import { usePermissions } from "@/composables/usePermissions";
import { useAppSettings } from "@/composables/useAppSettings";

const props = defineProps({
  visible: { type: Boolean, default: false },
  employee: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["close"]);
const { checkPermissions } = usePermissions();
const { values } = useAppSettings();

const loading = ref(false);
const uploading = ref(false);
const documents = ref<any[]>([]);
const categories = ref<Record<string, string>>({});
const selectedFile = ref<File | File[] | null>(null);
const form = ref({ category: "employment", visibility: "employee", title: "", document_number: "", expires_at: "" });
const visibilityOptions = [
  { title: "Employee and HR", value: "employee" },
  { title: "HR only", value: "hr_only" },
];

const canManage = computed(() => checkPermissions("manage-employee-documents"));
const maxSizeMb = computed(() => values.value["employee_documents.max_size_mb"] ?? 10);
const employeeLabel = computed(
  () => props.employee?.user?.full_name || props.employee?.employee_no || "Employee",
);
const categoryOptions = computed(() =>
  Object.entries(categories.value).map(([value, title]) => ({ value, title })),
);
const normalizedFile = computed<File | null>(() => {
  if (Array.isArray(selectedFile.value)) return selectedFile.value[0] ?? null;
  return selectedFile.value instanceof File ? selectedFile.value : null;
});

const close = () => emit("close");
const load = async () => {
  if (!props.employee?.id) return;
  loading.value = true;
  try {
    const [documentResponse, categoryResponse] = await Promise.all([
      axios.get(`/employees/${props.employee.id}/documents`),
      axios.get("/employee-documents/categories"),
    ]);
    documents.value = documentResponse.data.data ?? [];
    categories.value = categoryResponse.data.data ?? {};
  } finally {
    loading.value = false;
  }
};

const upload = async () => {
  if (!normalizedFile.value) return;
  uploading.value = true;
  try {
    const payload = new FormData();
    Object.entries(form.value).forEach(([key, value]) => value && payload.append(key, value));
    payload.append("file", normalizedFile.value);
    await axios.post(`/employees/${props.employee.id}/documents`, payload);
    form.value = { category: "employment", visibility: "employee", title: "", document_number: "", expires_at: "" };
    selectedFile.value = null;
    await load();
  } finally {
    uploading.value = false;
  }
};

const download = async (document: any) => {
  const response = await axios.get(`/employee-documents/${document.id}/download`, {
    responseType: "blob",
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = document.original_name;
  link.click();
  URL.revokeObjectURL(url);
};

const remove = async (document: any) => {
  if (!window.confirm(`Remove ${document.title}?`)) return;
  await axios.delete(`/employee-documents/${document.id}`);
  await load();
};

const categoryLabel = (category: string) => categories.value[category] ?? category;
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString();
const isExpired = (date: string) => new Date(`${date}T23:59:59`) < new Date();
const formatBytes = (bytes: number) => {
  if (!bytes) return "0 KB";
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(bytes / 1024)} KB`;
};
const fileIcon = (mime = "") => {
  if (mime.includes("pdf")) return "mdi-file-pdf-box";
  if (mime.includes("image")) return "mdi-file-image-outline";
  if (mime.includes("sheet") || mime.includes("excel")) return "mdi-file-excel-outline";
  if (mime.includes("word")) return "mdi-file-word-outline";
  return "mdi-file-document-outline";
};

watch(() => props.visible, (visible) => visible && load());
</script>

<style scoped>
.document-header { display: flex; align-items: center; gap: 12px; padding: 18px 20px; }
.min-width-0 { min-width: 0; }
.upload-panel { padding: 17px; border-radius: 14px; background: rgba(var(--v-theme-primary), 0.055); }
.upload-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-items: start; }
.upload-file { grid-column: 1 / -1; }
.upload-button { justify-self: end; grid-column: 2; }
.document-list { display: grid; gap: 9px; }
.document-row { display: flex; align-items: center; gap: 12px; padding: 13px; border-radius: 12px; background: rgba(var(--v-theme-on-surface), 0.04); }
.document-copy { display: flex; flex: 1; min-width: 0; flex-direction: column; }
.document-copy small { color: rgb(var(--v-theme-on-surface-variant)); }
.empty-documents { display: flex; min-height: 190px; align-items: center; justify-content: center; flex-direction: column; gap: 7px; color: rgb(var(--v-theme-on-surface-variant)); }
@media (max-width: 650px) { .upload-grid { grid-template-columns: 1fr; } .upload-file, .upload-button { grid-column: 1; } .upload-button { width: 100%; } .document-row { align-items: flex-start; flex-wrap: wrap; } }
</style>
