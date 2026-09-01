<template>
  <v-container class="invite-page" fluid>
    <v-sheet class="invite-card" rounded="lg" elevation="8">
      <div class="invite-mark"><v-icon icon="mdi-domain-plus" size="30" /></div>
      <p class="eyebrow">ORGANIZATION SETUP</p>
      <h1>Claim your workspace</h1>
      <p class="subtitle">
        Create a secure owner account to finish setting up your LexisOne
        workspace.
      </p>

      <v-alert
        v-if="successMessage"
        type="success"
        variant="tonal"
        class="mb-5"
      >
        {{ successMessage }}
        <RouterLink :to="{ name: 'login' }">Sign in to continue</RouterLink>.
      </v-alert>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-5">
        {{ errorMessage }}
      </v-alert>

      <v-form
        v-if="!successMessage"
        ref="formRef"
        v-model="valid"
        @submit.prevent="submit"
      >
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="firstName"
              label="First name"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="lastName"
              label="Last name"
              variant="outlined"
            />
          </v-col>
        </v-row>
        <v-text-field
          v-model="password"
          label="Create password"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          variant="outlined"
          :rules="passwordRules"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-text-field
          v-model="passwordConfirmation"
          label="Confirm password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          :rules="confirmationRules"
        />
        <v-btn
          block
          color="primary"
          size="large"
          type="submit"
          :loading="submitting"
        >
          Activate owner account
        </v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import axiosRequest from "@/plugins/axios";

const route = useRoute();
const token = typeof route.query.token === "string" ? route.query.token : "";
const firstName = ref("");
const lastName = ref("");
const password = ref("");
const passwordConfirmation = ref("");
const valid = ref(false);
const formRef = ref();
const submitting = ref(false);
const showPassword = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const passwordRules = [
  (value: string) => value.length >= 12 || "Use at least 12 characters",
  (value: string) => /[a-z]/.test(value) || "Include a lowercase letter",
  (value: string) => /[A-Z]/.test(value) || "Include an uppercase letter",
  (value: string) => /\d/.test(value) || "Include a number",
  (value: string) => /[^A-Za-z0-9]/.test(value) || "Include a symbol",
];
const confirmationRules = [
  (value: string) => value === password.value || "Passwords do not match",
];

const submit = async () => {
  const result = await formRef.value.validate();
  if (!result.valid || !token) {
    errorMessage.value = token
      ? "Check the highlighted fields."
      : "This invitation link is invalid.";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await axiosRequest.post(
      "/onboarding/owner-invitations/accept",
      {
        token,
        first_name: firstName.value || undefined,
        last_name: lastName.value || undefined,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    );
    successMessage.value =
      response.data?.message ||
      "Your owner account is ready. You can now sign in.";
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "We could not accept this invitation. Request a new link from your administrator.";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(
    circle at top right,
    rgba(103, 180, 255, 0.16),
    transparent 42%
  );
}

.invite-card {
  width: min(100%, 520px);
  padding: 36px;
}

.invite-mark {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.12);
  margin-bottom: 20px;
}

.eyebrow {
  margin-bottom: 6px;
  color: rgb(var(--v-theme-primary));
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

h1 {
  margin-bottom: 8px;
}

.subtitle {
  margin-bottom: 24px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}
</style>
