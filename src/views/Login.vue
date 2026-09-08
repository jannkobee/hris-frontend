<template>
  <v-container class="container" fluid>
    <v-sheet class="sheet" rounded="lg" elevation="4">
      <div class="login-heading">
        <RouterLink class="login-brand" to="/" aria-label="LexisOne home">
          <LexisOneLogo />
          <span>Lexis<span>One</span></span>
        </RouterLink>
        <div class="login-heading__copy">
          <p class="login-eyebrow">Your workspace</p>
          <h1>Welcome back</h1>
          <p>Sign in to continue to your team’s workspace.</p>
        </div>
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

      <v-form
        v-if="!mfaChallenge"
        ref="formRef"
        v-model="isFormValid"
        @submit.prevent="handleLogin"
      >
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
          Sign in
        </v-btn>
        <div class="text-center mt-4">
          <RouterLink class="text-body-2" :to="{ name: 'forgot-password' }">
            Forgot your password?
          </RouterLink>
        </div>

        <v-divider class="my-5" />
        <v-btn
          variant="tonal"
          block
          :disabled="loggingIn"
          @click="ssoDialog = true"
        >
          <v-icon start icon="mdi-domain" />
          Continue with Enterprise SSO
        </v-btn>
      </v-form>

      <v-form
        v-else
        ref="mfaFormRef"
        v-model="isMfaFormValid"
        @submit.prevent="handleMfaChallenge"
      >
        <p class="text-body-2 text-medium-emphasis mb-4">
          Enter the six-digit code from your authenticator app, or a recovery
          code.
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
        <v-btn
          class="mt-2"
          variant="text"
          block
          :disabled="loggingIn"
          @click="resetMfa"
        >
          Use another account
        </v-btn>
      </v-form>

      <v-dialog v-model="ssoDialog" max-width="420">
        <v-card>
          <v-card-title>Enterprise SSO</v-card-title>
          <v-card-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Enter your organization slug to continue with your company
              identity provider.
            </p>
            <v-text-field
              v-model="organizationSlug"
              label="Organization slug"
              hint="Example: acme"
              prepend-inner-icon="mdi-office-building-outline"
              variant="outlined"
              autocomplete="organization"
              @keyup.enter="startOidcLogin"
            />
          </v-card-text>
          <v-card-actions class="px-6 pb-5">
            <v-spacer />
            <v-btn variant="text" @click="ssoDialog = false">Cancel</v-btn>
            <v-btn
              color="primary"
              :disabled="!organizationSlug.trim()"
              @click="startOidcLogin"
            >
              Continue
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-sheet>
  </v-container>
</template>

<script lang="ts" setup>
import LexisOneLogo from "@/components/LexisOneLogo.vue";
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
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
const ssoDialog = ref(false);
const organizationSlug = ref("");
const route = useRoute();

const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) => /.+@.+\..+/.test(v) || "Enter a valid email address",
];

const passwordRules = [(v: string) => !!v || "Password is required"];
const mfaRules = [(v: string) => !!v || "Verification code is required"];

const { login, verifyMfaChallenge, exchangeOidcLogin } = useAuth();

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
    await verifyMfaChallenge({
      challenge: mfaChallenge.value,
      code: mfaCode.value,
    });
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : "Unable to verify that code. Please try again.";
  } finally {
    loggingIn.value = false;
  }
};

const resetMfa = () => {
  mfaChallenge.value = "";
  mfaCode.value = "";
  errorMessage.value = "";
};

const startOidcLogin = () => {
  const slug = organizationSlug.value.trim().toLowerCase();
  if (!slug) return;

  const apiUrl =
    import.meta.env.VITE_API_URL || "http://localhost:8000/backend/api/v1";
  window.location.assign(
    `${apiUrl}/auth/oidc/${encodeURIComponent(slug)}/redirect`,
  );
};

onMounted(async () => {
  const exchangeCode = route.query.oidc_exchange;
  if (typeof exchangeCode !== "string" || !exchangeCode) return;

  errorMessage.value = "";
  loggingIn.value = true;
  try {
    const result = await exchangeOidcLogin(exchangeCode);
    if (result?.mfa_required) {
      mfaChallenge.value = result.challenge;
    }
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : "Unable to complete your SSO sign-in. Please try again.";
  } finally {
    loggingIn.value = false;
  }
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
  /* Falls back to the current theme's background token in case this view
     ever renders outside a themed v-main (e.g. during SSR/first paint). */
  background:
    radial-gradient(
      circle at 50% 0,
      rgba(var(--v-theme-primary), 0.14),
      transparent 42%
    ),
    rgb(var(--v-theme-background));
}

.sheet {
  width: 100%;
  max-width: 420px;
  padding: 36px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.16);
  background: rgb(var(--v-theme-surface));
}

.login-heading {
  display: grid;
  justify-items: center;
  gap: 24px;
  margin-bottom: 30px;
  text-align: center;
}

.login-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
}

.login-brand :deep(.lexisone-logo) {
  width: 34px;
  height: 34px;
  flex-basis: 34px;
  border-radius: 7px;
}

.login-brand > span > span {
  color: rgb(var(--v-theme-primary));
}

.login-heading__copy {
  display: grid;
  gap: 6px;
}

.login-heading h1 {
  color: rgb(var(--v-theme-on-surface));
  font-size: 1.5rem;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.login-heading__copy > p:last-child {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 0.88rem;
}

.login-eyebrow {
  color: rgb(var(--v-theme-primary));
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.sheet :deep(.v-field) {
  border-radius: 8px;
}

.sheet :deep(.v-btn) {
  min-height: 46px;
  letter-spacing: 0.04em;
  text-transform: none;
}

@media (max-width: 400px) {
  .sheet {
    padding: 28px 22px;
  }
}
</style>
