<template>
  <v-container fluid class="profile-page">
    <div class="profile-hero">
      <div class="profile-photo-wrap">
        <v-avatar size="112" color="primary" class="profile-avatar">
          <v-img v-if="photoUrl" :src="photoUrl" cover />
          <span v-else class="text-h4 font-weight-bold">{{ profile?.initials }}</span>
        </v-avatar>
        <v-btn icon="mdi-camera-outline" color="primary" size="small" class="photo-button" :loading="uploadingPhoto" title="Change profile photo" @click="photoInput?.click()" />
        <input ref="photoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="uploadPhoto" />
      </div>
      <div class="profile-identity">
        <div class="d-flex align-center ga-2 flex-wrap">
          <h1>{{ profile?.full_name || "My profile" }}</h1>
          <v-chip size="small" color="primary" variant="tonal">{{ profile?.role?.name }}</v-chip>
        </div>
        <p>{{ profile?.email }}</p>
        <div class="profile-meta">
          <span v-if="employee?.employee_no"><v-icon icon="mdi-badge-account-horizontal-outline" />{{ employee.employee_no }}</span>
          <span v-if="employee?.position?.name"><v-icon icon="mdi-briefcase-outline" />{{ employee.position.name }}</span>
          <span v-if="employee?.department?.name"><v-icon icon="mdi-domain" />{{ employee.department.name }}</span>
        </div>
      </div>
      <div class="profile-actions">
        <v-btn v-if="photoUrl" variant="text" color="error" size="small" prepend-icon="mdi-image-remove-outline" class="text-none" @click="removePhoto">Remove photo</v-btn>
        <v-btn v-if="employee && documentsEnabled" color="primary" variant="tonal" prepend-icon="mdi-folder-account-outline" class="text-none" @click="documentsVisible = true">My 201 files</v-btn>
      </div>
    </div>

    <v-skeleton-loader v-if="loading" type="article, article" />
    <div v-else class="profile-grid">
      <section class="profile-card profile-card--personal">
        <div class="card-heading">
          <v-avatar color="primary" variant="tonal" size="38"><v-icon icon="mdi-account-edit-outline" /></v-avatar>
          <div><strong>Personal information</strong><small>Keep your personal details accurate.</small></div>
        </div>
        <div class="form-grid">
          <v-text-field v-model="form.first_name" label="First name" density="compact" variant="outlined" hide-details="auto" />
          <v-text-field v-model="form.middle_name" label="Middle name" density="compact" variant="outlined" hide-details="auto" />
          <v-text-field v-model="form.last_name" label="Last name" density="compact" variant="outlined" hide-details="auto" />
          <v-select v-model="form.gender" label="Gender" :items="['Male', 'Female', 'Other']" density="compact" variant="outlined" hide-details="auto" />
          <v-text-field v-model="form.birthday" label="Birthday" type="date" density="compact" variant="outlined" hide-details="auto" />
          <v-text-field :model-value="profile?.email" label="Email" density="compact" variant="outlined" readonly hide-details="auto" />
        </div>
        <div class="d-flex justify-end mt-5">
          <v-btn color="primary" prepend-icon="mdi-content-save-outline" class="text-none" :loading="saving" @click="save">Save profile</v-btn>
        </div>
      </section>

      <section class="profile-card">
        <div class="card-heading">
          <v-avatar color="primary" variant="tonal" size="38"><v-icon icon="mdi-briefcase-account-outline" /></v-avatar>
          <div><strong>Employment</strong><small>Your current company assignment.</small></div>
        </div>
        <div v-if="employee" class="detail-list">
          <div><span>Employee number</span><strong>{{ employee.employee_no || "—" }}</strong></div>
          <div><span>Hire date</span><strong>{{ formatDate(employee.hire_date) }}</strong></div>
          <div><span>Status</span><strong>{{ employee.employment_status?.name || "—" }}</strong></div>
          <div><span>Department</span><strong>{{ employee.department?.name || "—" }}</strong></div>
          <div><span>Position</span><strong>{{ employee.position?.name || "—" }}</strong></div>
          <div><span>Job grade</span><strong>{{ employee.job_grade?.name || "—" }}</strong></div>
        </div>
        <div v-else class="profile-empty">This account is not linked to an employee record.</div>
      </section>

      <section class="profile-card">
        <div class="card-heading">
          <v-avatar color="primary" variant="tonal" size="38"><v-icon icon="mdi-card-account-phone-outline" /></v-avatar>
          <div><strong>Contact details</strong><small>Managed in your employee record.</small></div>
        </div>
        <div v-if="employee?.contacts?.length" class="detail-list">
          <div v-for="contact in employee.contacts" :key="contact.id"><span class="text-capitalize">{{ contact.type }}</span><strong>{{ contact.value }}</strong></div>
        </div>
        <div v-else class="profile-empty">No contact details recorded.</div>
      </section>

      <section class="profile-card">
        <div class="card-heading">
          <v-avatar color="primary" variant="tonal" size="38"><v-icon icon="mdi-map-marker-outline" /></v-avatar>
          <div><strong>Addresses</strong><small>Current and permanent locations.</small></div>
        </div>
        <div v-if="employee?.addresses?.length" class="address-list">
          <div v-for="address in employee.addresses" :key="address.id">
            <v-chip size="x-small" variant="tonal" class="text-capitalize">{{ address.type }}</v-chip>
            <strong>{{ address.address_line_1 }}</strong>
            <span>{{ [address.address_line_2, address.city, address.province, address.postal_code, address.country].filter(Boolean).join(", ") }}</span>
          </div>
        </div>
        <div v-else class="profile-empty">No addresses recorded.</div>
      </section>
    </div>

    <EmployeeDocumentsDialog :visible="documentsVisible" :employee="employee" @close="documentsVisible = false" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import EmployeeDocumentsDialog from "@/components/EmployeeDocumentsDialog.vue";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { useProfilePhoto } from "@/composables/useProfilePhoto";

const profile = ref<any>();
const loading = ref(true);
const saving = ref(false);
const uploadingPhoto = ref(false);
const documentsVisible = ref(false);
const photoInput = ref<HTMLInputElement | null>(null);
const form = ref({ first_name: "", middle_name: "", last_name: "", gender: "", birthday: "" });
const { getUser } = useAuth();
const { values } = useAppSettings();
const { photoUrl, loadProfilePhoto, clearProfilePhoto } = useProfilePhoto();
const employee = computed(() => profile.value?.employee);
const documentsEnabled = computed(() => values.value["employee_documents.enabled"] !== false);

const load = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/profile");
    profile.value = response.data.data;
    form.value = {
      first_name: profile.value.first_name ?? "",
      middle_name: profile.value.middle_name ?? "",
      last_name: profile.value.last_name ?? "",
      gender: profile.value.gender ? profile.value.gender[0].toUpperCase() + profile.value.gender.slice(1).toLowerCase() : "",
      birthday: profile.value.birthday ?? "",
    };
    await loadProfilePhoto(profile.value.profile_photo_url);
  } finally { loading.value = false; }
};

const save = async () => {
  saving.value = true;
  try { await axios.put("/profile", form.value); await Promise.all([load(), getUser()]); }
  finally { saving.value = false; }
};

const uploadPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  uploadingPhoto.value = true;
  try {
    const payload = new FormData();
    payload.append("photo", file);
    await axios.post("/profile/photo", payload);
    await Promise.all([load(), getUser()]);
  } finally { uploadingPhoto.value = false; input.value = ""; }
};

const removePhoto = async () => {
  await axios.delete("/profile/photo");
  clearProfilePhoto();
  await Promise.all([load(), getUser()]);
};

const formatDate = (value?: string) => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "—";
onMounted(load);
</script>

<style scoped>
.profile-page { max-width: 1440px; }
.profile-hero { display: flex; align-items: center; gap: 24px; margin-bottom: 22px; padding: 24px; border-radius: 18px; background: linear-gradient(125deg, rgba(var(--v-theme-primary), .14), rgba(var(--v-theme-primary), .035)); }
.profile-photo-wrap { position: relative; flex: 0 0 auto; }
.profile-avatar { box-shadow: 0 8px 28px rgba(var(--v-theme-on-surface), .16); }
.photo-button { position: absolute; right: -2px; bottom: 2px; }
.profile-identity { min-width: 0; }
.profile-identity h1 { font-size: 1.55rem; line-height: 1.25; }
.profile-identity p { margin: 4px 0 11px; color: rgb(var(--v-theme-on-surface-variant)); }
.profile-meta { display: flex; flex-wrap: wrap; gap: 14px; }
.profile-meta span { display: flex; align-items: center; gap: 5px; font-size: .8rem; }
.profile-actions { display: flex; align-items: flex-end; gap: 5px; margin-left: auto; flex-direction: column; }
.profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.profile-card { min-width: 0; padding: 20px; border-radius: 16px; background: rgba(var(--v-theme-on-surface), .035); box-shadow: 0 1px 0 rgba(var(--v-theme-on-surface), .06); }
.profile-card--personal { grid-row: span 2; }
.card-heading { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; }
.card-heading > div:last-child { display: flex; flex-direction: column; }
.card-heading small, .profile-empty { color: rgb(var(--v-theme-on-surface-variant)); }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.detail-list { display: grid; }
.detail-list > div { display: flex; justify-content: space-between; gap: 18px; padding: 10px 2px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .075); }
.detail-list span { color: rgb(var(--v-theme-on-surface-variant)); }
.address-list { display: grid; gap: 10px; }
.address-list > div { display: flex; align-items: flex-start; flex-direction: column; gap: 4px; padding: 12px; border-radius: 10px; background: rgba(var(--v-theme-on-surface), .035); }
.address-list span { color: rgb(var(--v-theme-on-surface-variant)); font-size: .8rem; }
@media (max-width: 850px) { .profile-grid { grid-template-columns: 1fr; } .profile-card--personal { grid-row: auto; } .profile-hero { align-items: flex-start; flex-wrap: wrap; } .profile-actions { width: 100%; align-items: stretch; margin-left: 0; } }
@media (max-width: 560px) { .profile-hero { text-align: center; justify-content: center; } .profile-meta { justify-content: center; } .form-grid { grid-template-columns: 1fr; } }
</style>
