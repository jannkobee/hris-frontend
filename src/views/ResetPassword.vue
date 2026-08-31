<template>
  <v-container class="container" fluid>
    <v-sheet class="sheet" rounded="lg" elevation="4">
      <h1 class="text-h5 font-weight-bold mb-2">Choose a new password</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Use at least 12 characters, with upper and lowercase letters, a number,
        and a symbol.
      </p>

      <v-alert
        v-if="successMessage"
        type="success"
        variant="tonal"
        class="mb-4"
      >
        {{ successMessage }}
        <RouterLink :to="{ name: 'login' }">Sign in</RouterLink>
      </v-alert>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{
        errorMessage
      }}</v-alert>

      <v-form
        v-if="!successMessage"
        ref="formRef"
        v-model="valid"
        @submit.prevent="submit"
      >
        <v-text-field
          v-model="email"
          label="Work email"
          type="email"
          variant="outlined"
          :rules="emailRules"
        />
        <v-text-field
          v-model="password"
          label="New password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          :rules="passwordRules"
        />
        <v-text-field
          v-model="passwordConfirmation"
          label="Confirm new password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          :rules="confirmationRules"
        />
        <v-btn
          type="submit"
          color="primary"
          block
          :loading="submitting"
          :disabled="submitting"
          >Reset password</v-btn
        >
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const route = useRoute();
const email = ref(
  typeof route.query.email === "string" ? route.query.email : "",
);
const token = typeof route.query.token === "string" ? route.query.token : "";
const password = ref("");
const passwordConfirmation = ref("");
const valid = ref(false);
const formRef = ref();
const showPassword = ref(false);
const submitting = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const { reset_password } = useAuth();
const emailRules = [
  (value: string) => !!value || "Email is required",
  (value: string) => /.+@.+\..+/.test(value) || "Enter a valid email address",
];
const passwordRules = [
  (value: string) => value.length >= 12 || "Use at least 12 characters",
];
const confirmationRules = [
  (value: string) => value === password.value || "Passwords do not match",
];

const submit = async () => {
  const result = await formRef.value.validate();
  if (!result.valid || !token) {
    errorMessage.value = token
      ? "Check the highlighted fields."
      : "This password reset link is invalid.";
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await reset_password({
      email: email.value,
      token,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    });
    successMessage.value = response.data.message;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to reset your password.";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.sheet {
  width: 100%;
  max-width: 420px;
  padding: 32px;
}
</style>
