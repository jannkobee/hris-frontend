<template>
  <v-container fluid class="profile-page">
    <section class="profile-hero">
      <div class="profile-photo">
        <v-img v-if="photoUrl" :src="photoUrl" cover />
        <span v-else class="text-h4 font-weight-bold">{{
          profile?.initials
        }}</span>
        <input
          ref="photoInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          @change="uploadPhoto"
        />
      </div>
      <div class="profile-identity">
        <span class="profile-kicker">My account</span>
        <div class="d-flex align-center ga-3 flex-wrap">
          <h1>{{ profile?.full_name || "My profile" }}</h1>
          <span class="profile-role">{{
            profile?.role?.name || "Team member"
          }}</span>
        </div>
        <p>{{ profile?.email }}</p>
        <div class="profile-meta">
          <span v-if="employee?.employee_no"
            ><v-icon icon="mdi-account" />{{ employee.employee_no }}</span
          >
          <span v-if="employee?.position?.name"
            ><v-icon icon="mdi-briefcase-outline" />{{
              employee.position.name
            }}</span
          >
          <span v-if="employee?.department?.name"
            ><v-icon icon="mdi-domain" />{{ employee.department.name }}</span
          >
        </div>
      </div>
      <div class="profile-actions">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-camera-outline"
          class="text-none"
          :loading="uploadingPhoto"
          @click="photoInput?.click()"
          >Change photo</v-btn
        >
        <v-btn
          v-if="employee && documentsEnabled"
          variant="outlined"
          prepend-icon="mdi-folder-account-outline"
          class="text-none"
          @click="documentsVisible = true"
          >My 201 files</v-btn
        >
        <v-btn
          v-if="photoUrl"
          variant="text"
          color="error"
          size="small"
          prepend-icon="mdi-image-remove-outline"
          class="text-none"
          @click="removePhoto"
          >Remove photo</v-btn
        >
      </div>
    </section>

    <v-skeleton-loader v-if="loading" type="article, article" />
    <v-alert
      v-else-if="loadError"
      type="error"
      variant="tonal"
      class="profile-error"
      title="Profile could not be loaded"
    >
      {{ loadError }}
      <template #append>
        <v-btn variant="text" @click="load">Try again</v-btn>
      </template>
    </v-alert>
    <template v-else>
      <section class="profile-summary" aria-label="Profile summary">
        <div>
          <span>Employee ID</span>
          <strong>{{ employee?.employee_no || "—" }}</strong>
        </div>
        <div>
          <span>Department</span>
          <strong>{{ employee?.department?.name || "Not assigned" }}</strong>
        </div>
        <div>
          <span>Position</span>
          <strong>{{ employee?.position?.name || "Not assigned" }}</strong>
        </div>
        <div>
          <span>Access role</span>
          <strong>{{ profile?.role?.name || "Team member" }}</strong>
        </div>
      </section>

      <div class="profile-grid">
        <section class="profile-card profile-card--personal">
          <div class="card-heading">
            <v-avatar color="primary" variant="tonal" size="38"
              ><v-icon icon="mdi-account-edit-outline"
            /></v-avatar>
            <div>
              <strong>Personal information</strong
              ><small>Keep your personal details accurate.</small>
            </div>
          </div>
          <div class="form-grid">
            <v-text-field
              v-model="form.first_name"
              label="First name"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <v-text-field
              v-model="form.middle_name"
              label="Middle name"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <v-text-field
              v-model="form.last_name"
              label="Last name"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <v-select
              v-model="form.gender"
              label="Gender"
              :items="['Male', 'Female', 'Other']"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <v-text-field
              v-model="form.birthday"
              label="Birthday"
              type="date"
              density="compact"
              variant="outlined"
              hide-details="auto"
            />
            <v-text-field
              :model-value="profile?.email"
              label="Email"
              density="compact"
              variant="outlined"
              readonly
              hide-details="auto"
            />
          </div>
          <div class="d-flex justify-end mt-5">
            <v-btn
              color="primary"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="saving"
              :disabled="!hasChanges"
              @click="save"
              >Save changes</v-btn
            >
          </div>
        </section>

        <section class="profile-card profile-card--employment">
          <div class="card-heading">
            <v-avatar color="primary" variant="tonal" size="38"
              ><v-icon icon="mdi-briefcase-account-outline"
            /></v-avatar>
            <div>
              <strong>Employment</strong
              ><small>Your current company assignment.</small>
            </div>
          </div>
          <div v-if="employee" class="detail-list">
            <div>
              <span>Employee number</span
              ><strong>{{ employee.employee_no || "—" }}</strong>
            </div>
            <div>
              <span>Hire date</span
              ><strong>{{ formatDate(employee.hire_date) }}</strong>
            </div>
            <div>
              <span>Status</span
              ><strong>{{ employee.employment_status?.name || "—" }}</strong>
            </div>
            <div>
              <span>Department</span
              ><strong>{{ employee.department?.name || "—" }}</strong>
            </div>
            <div>
              <span>Position</span
              ><strong>{{ employee.position?.name || "—" }}</strong>
            </div>
            <div>
              <span>Job grade</span
              ><strong>{{ employee.job_grade?.name || "—" }}</strong>
            </div>
          </div>
          <div v-else class="profile-empty">
            This account is not linked to an employee record.
          </div>
        </section>

        <section class="profile-card">
          <div class="card-heading">
            <v-avatar color="primary" variant="tonal" size="38"
              ><v-icon icon="mdi-card-account-phone-outline"
            /></v-avatar>
            <div>
              <strong>Contact details</strong
              ><small>Managed in your employee record.</small>
            </div>
          </div>
          <div v-if="employee?.contacts?.length" class="detail-list">
            <div v-for="contact in employee.contacts" :key="contact.id">
              <span class="text-capitalize">{{ contact.type }}</span
              ><strong>{{ contact.value }}</strong>
            </div>
          </div>
          <div v-else class="profile-empty">No contact details recorded.</div>
        </section>

        <section class="profile-card">
          <div class="card-heading">
            <v-avatar color="primary" variant="tonal" size="38"
              ><v-icon icon="mdi-map-marker-outline"
            /></v-avatar>
            <div>
              <strong>Addresses</strong
              ><small>Current and permanent locations.</small>
            </div>
          </div>
          <div v-if="employee?.addresses?.length" class="address-list">
            <div v-for="address in employee.addresses" :key="address.id">
              <v-chip size="x-small" variant="tonal" class="text-capitalize">{{
                address.type
              }}</v-chip>
              <strong>{{ address.address_line_1 }}</strong>
              <span>{{
                [
                  address.address_line_2,
                  address.city,
                  address.province,
                  address.postal_code,
                  address.country,
                ]
                  .filter(Boolean)
                  .join(", ")
              }}</span>
            </div>
          </div>
          <div v-else class="profile-empty">No addresses recorded.</div>
        </section>

        <section class="profile-card">
          <div class="card-heading">
            <v-avatar color="primary" variant="tonal" size="38"
              ><v-icon icon="mdi-shield-lock-outline"
            /></v-avatar>
            <div>
              <strong>Account security</strong>
              <small
                >Protect your account with two-factor authentication.</small
              >
            </div>
          </div>
          <div class="detail-list">
            <div>
              <span>Two-factor authentication</span>
              <v-chip
                :color="mfaStatus.enabled ? 'success' : 'warning'"
                size="small"
                variant="tonal"
              >
                {{ mfaStatus.enabled ? "Enabled" : "Not enabled" }}
              </v-chip>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-5">
            <v-btn
              color="primary"
              class="text-none"
              :loading="mfaBusy"
              @click="openMfaDialog"
            >
              {{ mfaStatus.enabled ? "Manage MFA" : "Set up MFA" }}
            </v-btn>
            <v-btn
              variant="outlined"
              class="text-none"
              :loading="sessionBusy"
              @click="signOutOtherSessions"
            >
              Sign out other devices
            </v-btn>
          </div>
        </section>
      </div>
    </template>

    <EmployeeDocumentsDialog
      :visible="documentsVisible"
      :employee="employee"
      @close="documentsVisible = false"
    />

    <v-dialog v-model="mfaDialog" max-width="520">
      <v-card>
        <v-card-title>Two-factor authentication</v-card-title>
        <v-card-text>
          <template v-if="mfaMode === 'setup' && !mfaSecret">
            <p class="mb-4">
              Confirm your password before setting up an authenticator app.
            </p>
            <v-text-field
              v-model="securityPassword"
              label="Current password"
              type="password"
              autocomplete="current-password"
              variant="outlined"
            />
          </template>
          <template v-else-if="mfaMode === 'setup' && mfaSecret">
            <p>
              In your authenticator app, add a new account using this setup key,
              then enter its six-digit code.
            </p>
            <v-alert type="info" variant="tonal" class="my-4"
              ><code class="security-secret">{{ mfaSecret }}</code></v-alert
            >
            <v-text-field
              v-model="mfaCode"
              label="Verification code"
              autocomplete="one-time-code"
              variant="outlined"
            />
          </template>
          <template v-else-if="mfaMode === 'recovery'">
            <v-alert type="warning" variant="tonal" class="mb-4"
              >Save these recovery codes in a secure place. Each code works once
              and will not be shown again.</v-alert
            >
            <div class="recovery-codes">
              <code v-for="code in recoveryCodes" :key="code">{{ code }}</code>
            </div>
          </template>
          <template v-else>
            <p class="mb-4">
              To disable MFA, confirm your password and a current authenticator
              or recovery code.
            </p>
            <v-text-field
              v-model="securityPassword"
              label="Current password"
              type="password"
              autocomplete="current-password"
              variant="outlined"
            />
            <v-text-field
              v-model="mfaCode"
              label="Authenticator or recovery code"
              autocomplete="one-time-code"
              variant="outlined"
            />
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="mfaBusy" @click="mfaDialog = false">{{
            mfaMode === "recovery" ? "Done" : "Cancel"
          }}</v-btn>
          <v-btn
            v-if="mfaMode === 'setup' && !mfaSecret"
            color="primary"
            :loading="mfaBusy"
            @click="startMfaSetup"
            >Continue</v-btn
          >
          <v-btn
            v-else-if="mfaMode === 'setup'"
            color="primary"
            :loading="mfaBusy"
            @click="confirmMfa"
            >Enable MFA</v-btn
          >
          <v-btn
            v-else-if="mfaMode === 'disable'"
            color="error"
            :loading="mfaBusy"
            @click="disableMfa"
            >Disable MFA</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import axios from "@/plugins/axios";
import EmployeeDocumentsDialog from "@/components/EmployeeDocumentsDialog.vue";
import { useAuth } from "@/composables/useAuth";
import { useAppSettings } from "@/composables/useAppSettings";
import { usePlanEntitlements } from "@/composables/usePlanEntitlements";
import { useProfilePhoto } from "@/composables/useProfilePhoto";
import { formatDate } from "@/utils/dateFormatter";

type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: string;
  birthday: string;
};

const profile = ref<any>();
const loading = ref(true);
const loadError = ref("");
const saving = ref(false);
const uploadingPhoto = ref(false);
const documentsVisible = ref(false);
const mfaDialog = ref(false);
const mfaBusy = ref(false);
const sessionBusy = ref(false);
const securityPassword = ref("");
const mfaCode = ref("");
const mfaSecret = ref("");
const recoveryCodes = ref<string[]>([]);
const mfaMode = ref<"setup" | "disable" | "recovery">("setup");
const mfaStatus = ref({
  enabled: false,
  confirmed_at: null as string | null,
  recovery_codes_remaining: 0,
});
const photoInput = ref<HTMLInputElement | null>(null);
const form = ref<ProfileForm>({
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "",
  birthday: "",
});
const initialForm = ref<ProfileForm>({ ...form.value });
const { getUser } = useAuth();
const { values } = useAppSettings();
const { hasFeature } = usePlanEntitlements();
const { photoUrl, loadProfilePhoto, clearProfilePhoto } = useProfilePhoto();
const employee = computed(() => profile.value?.employee);
const hasChanges = computed(() =>
  Object.entries(form.value).some(
    ([key, value]) => value !== initialForm.value[key as keyof ProfileForm],
  ),
);
const documentsEnabled = computed(
  () =>
    hasFeature("employee_documents") &&
    values.value["employee_documents.enabled"] !== false,
);

const load = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const response = await axios.get("/profile");
    profile.value = response.data.data;
    form.value = {
      first_name: profile.value.first_name ?? "",
      middle_name: profile.value.middle_name ?? "",
      last_name: profile.value.last_name ?? "",
      gender: profile.value.gender
        ? profile.value.gender[0].toUpperCase() +
          profile.value.gender.slice(1).toLowerCase()
        : "",
      birthday: profile.value.birthday ?? "",
    };
    initialForm.value = { ...form.value };
    await loadProfilePhoto(profile.value.profile_photo_url);
  } catch {
    loadError.value =
      "We couldn't retrieve your account details. Check your connection and try again.";
  } finally {
    loading.value = false;
  }
};

const loadMfaStatus = async () => {
  const response = await axios.get("/auth/mfa", {
    headers: { "X-Suppress-Success-Notification": "true" },
  });
  mfaStatus.value = response.data.data;
};

const openMfaDialog = () => {
  securityPassword.value = "";
  mfaCode.value = "";
  mfaSecret.value = "";
  recoveryCodes.value = [];
  mfaMode.value = mfaStatus.value.enabled ? "disable" : "setup";
  mfaDialog.value = true;
};

const startMfaSetup = async () => {
  mfaBusy.value = true;
  try {
    const response = await axios.post("/auth/mfa/setup", {
      current_password: securityPassword.value,
    });
    mfaSecret.value = response.data.data.secret;
    securityPassword.value = "";
  } finally {
    mfaBusy.value = false;
  }
};

const confirmMfa = async () => {
  mfaBusy.value = true;
  try {
    const response = await axios.post("/auth/mfa/confirm", {
      code: mfaCode.value,
    });
    recoveryCodes.value = response.data.data.recovery_codes;
    mfaMode.value = "recovery";
    await loadMfaStatus();
  } finally {
    mfaBusy.value = false;
  }
};

const disableMfa = async () => {
  mfaBusy.value = true;
  try {
    await axios.delete("/auth/mfa", {
      data: { current_password: securityPassword.value, code: mfaCode.value },
    });
    mfaDialog.value = false;
    await loadMfaStatus();
  } finally {
    mfaBusy.value = false;
  }
};

const signOutOtherSessions = async () => {
  sessionBusy.value = true;
  try {
    await axios.delete("/auth/sessions/others");
  } finally {
    sessionBusy.value = false;
  }
};

const save = async () => {
  saving.value = true;
  try {
    await axios.put("/profile", form.value);
    await Promise.all([load(), getUser()]);
  } finally {
    saving.value = false;
  }
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
  } finally {
    uploadingPhoto.value = false;
    input.value = "";
  }
};

const removePhoto = async () => {
  await axios.delete("/profile/photo");
  clearProfilePhoto();
  await Promise.all([load(), getUser()]);
};

onMounted(async () => {
  await Promise.all([load(), loadMfaStatus()]);
});
</script>

<style scoped>
.profile-page {
  width: 100%;
  max-width: none;
}
.profile-hero {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) auto;
  align-items: center;
  gap: 24px;
  margin-bottom: 18px;
  padding: 4px 0 24px;
  border-bottom: 2px solid rgb(var(--v-theme-primary));
}
.profile-photo {
  display: grid;
  width: 112px;
  height: 112px;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-primary), 0.55);
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
}
.profile-identity {
  min-width: 0;
}
.profile-kicker {
  display: block;
  margin-bottom: 5px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.profile-identity h1 {
  margin: 0;
  font-size: clamp(1.5rem, 2.6vw, 2rem);
  line-height: 1.25;
}
.profile-role {
  padding: 4px 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
  color: rgb(var(--v-theme-primary));
  font-size: 0.75rem;
  font-weight: 700;
}
.profile-identity p {
  margin: 4px 0 11px;
  color: rgb(var(--v-theme-on-surface-variant));
}
.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.profile-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-right: 8px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  font-size: 0.76rem;
}
.profile-meta span:last-child {
  border-right: 0;
}
.profile-meta .v-icon {
  color: rgb(var(--v-theme-primary));
}
.profile-actions {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex-direction: column;
}
.profile-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 16px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
}
.profile-summary > div {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 15px 18px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}
.profile-summary > div:last-child {
  border-right: 0;
}
.profile-summary span,
.detail-list span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.profile-summary strong {
  overflow: hidden;
  font-size: 0.88rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
  align-items: start;
}
.profile-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  background: rgb(var(--v-theme-surface));
}
.profile-card--personal {
  grid-row: span 2;
}
.profile-card--employment {
  background: rgb(var(--v-theme-surface));
}
.card-heading {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 18px;
}
.card-heading > div:last-child {
  display: flex;
  flex-direction: column;
}
.card-heading small,
.profile-empty {
  color: rgb(var(--v-theme-on-surface-variant));
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.detail-list {
  display: grid;
}
.detail-list > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 11px 2px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.075);
}
.detail-list > div:last-child {
  border-bottom: 0;
}
.detail-list span {
  font-size: 0.7rem;
}
.detail-list strong {
  font-size: 0.82rem;
  text-align: right;
}
.address-list {
  display: grid;
  gap: 10px;
}
.address-list > div {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-left: 3px solid rgba(var(--v-theme-primary), 0.55);
  background: rgba(var(--v-theme-on-surface), 0.035);
}
.address-list span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.8rem;
}
.security-secret {
  font-size: 1rem;
  letter-spacing: 0.08em;
  word-break: break-all;
}
.recovery-codes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.recovery-codes code {
  padding: 8px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  text-align: center;
}
@media (max-width: 850px) {
  .profile-hero {
    grid-template-columns: 96px minmax(0, 1fr);
  }
  .profile-photo {
    width: 96px;
    height: 96px;
  }
  .profile-grid {
    grid-template-columns: 1fr;
  }
  .profile-card--personal {
    grid-row: auto;
  }
  .profile-hero {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .profile-actions {
    grid-column: 1 / -1;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .profile-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .profile-summary > div:nth-child(2) {
    border-right: 0;
  }
  .profile-summary > div:nth-child(-n + 2) {
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  }
}
@media (max-width: 560px) {
  .profile-hero {
    display: flex;
    text-align: center;
    justify-content: center;
  }
  .profile-meta {
    justify-content: center;
  }
  .profile-meta span {
    border-right: 0;
  }
  .profile-actions {
    width: 100%;
    justify-content: center;
  }
  .profile-summary {
    grid-template-columns: 1fr;
  }
  .profile-summary > div,
  .profile-summary > div:nth-child(2) {
    border-right: 0;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  }
  .profile-summary > div:last-child {
    border-bottom: 0;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
