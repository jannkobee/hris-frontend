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

      <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleLogin">
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
const showPassword = ref(false);
const loggingIn = ref(false);
const errorMessage = ref("");

const emailRules = [
  (v: string) => !!v || "Email is required",
  (v: string) => /.+@.+\..+/.test(v) || "Enter a valid email address",
];

const passwordRules = [(v: string) => !!v || "Password is required"];

const { login } = useAuth();

const handleLogin = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  errorMessage.value = "";
  loggingIn.value = true;
  try {
    await login(form);
  } catch (err) {
    errorMessage.value =
      err instanceof Error
        ? err.message
        : "Unable to log in. Please try again.";
  } finally {
    loggingIn.value = false;
  }
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
