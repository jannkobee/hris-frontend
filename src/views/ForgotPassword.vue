<template>
  <v-container class="container" fluid>
    <v-sheet class="sheet" rounded="lg" elevation="4">
      <h1 class="text-h5 font-weight-bold mb-2">Reset your password</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">
        Enter your work email and we will send a password reset link if an account exists.
      </p>

      <v-alert v-if="successMessage" type="success" variant="tonal" class="mb-4">
        {{ successMessage }}
      </v-alert>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
        <v-text-field
          v-model="email"
          label="Work email"
          type="email"
          autocomplete="email"
          variant="outlined"
          :rules="emailRules"
        />
        <v-btn type="submit" color="primary" block :loading="submitting" :disabled="submitting">
          Send reset link
        </v-btn>
      </v-form>

      <div class="text-center mt-4">
        <RouterLink class="text-body-2" :to="{ name: 'login' }">Back to sign in</RouterLink>
      </div>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";

const email = ref("");
const valid = ref(false);
const formRef = ref();
const submitting = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const { forgot_password } = useAuth();
const emailRules = [
  (value: string) => !!value || "Email is required",
  (value: string) => /.+@.+\..+/.test(value) || "Enter a valid email address",
];

const submit = async () => {
  const result = await formRef.value.validate();
  if (!result.valid) return;

  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await forgot_password({ email: email.value });
    successMessage.value = response.data.message;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Unable to send a reset link.";
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
.sheet { width: 100%; max-width: 420px; padding: 32px; }
</style>
