<template>
  <v-container class="trial-page" fluid
    ><v-sheet class="trial-card" rounded="xl" border>
      <div class="text-center mb-6">
        <RouterLink class="brand-link" to="/saas">HRISFlow</RouterLink>
        <div class="text-overline text-primary mt-3">14-day free trial</div>
        <h1 class="text-h5 font-weight-bold">Set up your HRIS workspace</h1>
        <p class="text-body-2 text-medium-emphasis">
          No payment details required. Your workspace is ready in minutes.
        </p>
      </div>
      <v-alert v-if="success" type="success" variant="tonal"
        ><div>{{ success }}</div>
        <v-btn class="mt-3" color="success" variant="flat" to="/login"
          >Sign in to your workspace</v-btn
        ></v-alert
      >
      <v-form v-else ref="formRef" v-model="valid" @submit.prevent="submit"
        ><v-row
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.organization_name"
              label="Organization name"
              variant="outlined"
              :rules="required" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.slug"
              label="Workspace slug"
              hint="Lowercase letters, numbers, and hyphens"
              persistent-hint
              variant="outlined"
              :rules="required"
              @update:model-value="form.slug = normalize(form.slug)" /></v-col
          ><v-col cols="12" md="6"
            ><v-select
              v-model="form.plan_code"
              label="Start with"
              :items="plans"
              variant="outlined" /></v-col
          ><v-col cols="12" md="3"
            ><v-text-field
              v-model="form.country_code"
              label="Country code"
              hint="Controls regional pricing"
              persistent-hint
              variant="outlined"
              :rules="required"
              @update:model-value="
                form.country_code = form.country_code.toUpperCase()
              " /></v-col
          ><v-col cols="12" md="3"
            ><v-select
              v-model="form.timezone"
              label="Timezone"
              :items="timezones"
              variant="outlined" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.first_name"
              label="First name"
              variant="outlined"
              :rules="required" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.last_name"
              label="Last name"
              variant="outlined"
              :rules="required" /></v-col
          ><v-col cols="12"
            ><v-text-field
              v-model="form.email"
              label="Work email"
              type="email"
              variant="outlined"
              :rules="emailRules" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.password"
              label="Password"
              type="password"
              variant="outlined"
              :rules="passwordRules" /></v-col
          ><v-col cols="12" md="6"
            ><v-text-field
              v-model="form.password_confirmation"
              label="Confirm password"
              type="password"
              variant="outlined"
              :rules="[
                (value: string) =>
                  value === form.password || 'Passwords do not match',
              ]" /></v-col
          ><v-col cols="12"
            ><v-checkbox
              v-model="form.terms_accepted"
              label="I agree to create an organization trial workspace."
              :rules="[
                (value: boolean) => value || 'You must accept to continue',
              ]" /></v-col></v-row
        ><v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :loading="submitting"
          >Create my free trial</v-btn
        >
        <div class="text-center mt-4">
          <RouterLink to="/login">Already have a workspace? Sign in</RouterLink>
        </div></v-form
      >
    </v-sheet></v-container
  >
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";
import axios from "@/plugins/axios";
const route = useRoute();
const selectablePlans = ["starter", "growth", "business"];
const requestedPlan = String(route.query.plan ?? "growth");
const initialPlan = selectablePlans.includes(requestedPlan)
  ? requestedPlan
  : "growth";
const formRef = ref();
const valid = ref(false);
const submitting = ref(false);
const success = ref("");
const form = ref({
  organization_name: "",
  slug: "",
  plan_code: initialPlan,
  country_code: "PH",
  timezone: "Asia/Manila",
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  password_confirmation: "",
  terms_accepted: false,
});
const plans = [
  { title: "Starter · up to 25 employees", value: "starter" },
  { title: "Growth · up to 100 employees", value: "growth" },
  { title: "Business · up to 500 employees", value: "business" },
];
const timezones = [
  "Asia/Manila",
  "UTC",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
];
const required = [(value: string) => !!value || "This field is required"];
const emailRules = [
  (value: string) => /.+@.+\..+/.test(value) || "Enter a valid email",
];
const passwordRules = [
  (value: string) => value.length >= 12 || "Use at least 12 characters",
  (value: string) =>
    (/[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9]/.test(value)) ||
    "Use upper/lowercase, number, and symbol",
];
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 63);
const submit = async () => {
  const result = await formRef.value.validate();
  if (!result.valid) return;
  submitting.value = true;
  try {
    const response = await axios.post(
      "/public-apis/trial-signups",
      form.value,
      { headers: { "X-Suppress-Success-Notification": "true" } },
    );
    success.value = `${response.data.data.organization.name} is ready. Your 14-day trial has started—sign in with your new administrator account.`;
  } finally {
    submitting.value = false;
  }
};
</script>
<style scoped>
.trial-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 16px;
  background:
    radial-gradient(
      circle at top,
      rgba(var(--v-theme-primary), 0.14),
      transparent 46%
    ),
    rgb(var(--v-theme-background));
}
.trial-card {
  width: 100%;
  max-width: 800px;
  padding: 32px;
  box-shadow: none;
}
.brand-link {
  font-size: 1.25rem;
  font-weight: 800;
  color: inherit;
  text-decoration: none;
}
@media (max-width: 600px) {
  .trial-card {
    padding: 22px;
  }
}
</style>
