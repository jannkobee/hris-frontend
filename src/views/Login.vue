<template>
  <v-container class="container" fluid>
    <v-sheet class="sheet" rounded="lg" elevation="4">
      <div class="text-center mb-6">
        <h1 class="text-h5 font-weight-bold text-high-emphasis mb-1">
          Portal Login
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Sign in to continue</p>
      </div>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form v-if="!mfaChallenge" ref="formRef" v-model="isFormValid" @submit.prevent="handleLogin">
        <v-text-field
          v-model="form.email"
          label="Email"
          hint="Enter your Email Address"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          :rules="emailRules"
          autocomplete="username"
          class="mb-2"
        />
        <v-text-field
          v-model="form.password"
          label="Password"
          hint="Enter your Password"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          :rules="passwordRules"
          autocomplete="current-password"
          @click:append-inner="showPassword = !showPassword"
        />

        <v-btn
          type="submit"
          class="mt-2"
          color="primary"
          size="large"
          block
          :loading="loggingIn"
          :disabled="loggingIn"
        >
          Login
        </v-btn>
        <div class="text-center mt-4">
          <RouterLink class="text-body-2" :to="{ name: 'forgot-password' }">
            Forgot your password?
          </RouterLink>
        </div>
      </v-form>

      <v-form v-else ref="mfaFormRef" v-model="isMfaFormValid" @submit.prevent="handleMfaChallenge">
        <p class="text-body-2 text-medium-emphasis mb-4">
          Enter the six-digit code from your authenticator app, or a recovery code.
        </p>
        <v-text-field
          v-model="mfaCode"
          label="Verification code"
          prepend-inner-icon="mdi-shield-key-outline"
          variant="outlined"
          autocomplete="one-time-code"
          :rules="mfaRules"
          autofocus
        />
        <v-btn
          type="submit"
          class="mt-2"
          color="primary"
          size="large"
          block
          :loading="loggingIn"
          :disabled="loggingIn"
        >
          Verify and sign in
        </v-btn>
        <v-btn class="mt-2" variant="text" block :disabled="loggingIn" @click="resetMfa">
          Use another account
        </v-btn>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { useAuth } from "@/composables/useAuth";

const form = reactive({
  email: "",
  password: "",
});

const formRef = ref();
const isFormValid = ref(false);
const isMfaFormValid = ref(false);
const showPassword = ref(false);
const loggingIn = ref(false);
const errorMessage = ref("");
const mfaChallenge = ref("");
const mfaCode = ref("");
const mfaFormRef = ref();

const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) => /.+@.+\..+/.test(v) || "Enter a valid email address",
];

const passwordRules = [(v: string) => !!v || "Password is required"];
const mfaRules = [(v: string) => !!v || "Verification code is required"];

const { login, verifyMfaChallenge } = useAuth();

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  errorMessage.value = "";
  loggingIn.value = true;
  try {
    const result = await login(form);
    if (result?.mfa_required) {
      mfaChallenge.value = result.challenge;
    }
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : "Unable to log in. Please try again.";
  } finally {
    loggingIn.value = false;
  }
};

const handleMfaChallenge = async () => {
  const { valid } = await mfaFormRef.value.validate();
  if (!valid) return;

  errorMessage.value = "";
  loggingIn.value = true;
  try {
    await verifyMfaChallenge({ challenge: mfaChallenge.value, code: mfaCode.value });
  } catch (err) {
    errorMessage.value =
      err instanceof Error ? err.message : "Unable to verify that code. Please try again.";
  } finally {
    loggingIn.value = false;
  }
};

const resetMfa = () => {
  mfaChallenge.value = "";
  mfaCode.value = "";
  errorMessage.value = "";
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  /* Falls back to the current theme's background token in case this view
     ever renders outside a themed v-main (e.g. during SSR/first paint). */
  background-color: rgb(var(--v-theme-background));
}

.sheet {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  background-color: rgb(var(--v-theme-surface));
}

@media (max-width: 400px) {
  .sheet {
    padding: 24px;
  }
}
</style>
