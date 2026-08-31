<template>
  <v-container class="platform-page" fluid>
    <div class="page-heading">
      <div>
        <div class="eyebrow">Workspace provisioning</div>
        <h1>Create an organization</h1>
        <p>
          Provision the tenant, subscription, defaults, and first administrator
          in one workflow.
        </p>
      </div>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-arrow-left"
        :to="{ name: 'platform-organizations' }"
        >Organizations</v-btn
      >
    </div>
    <v-sheet class="platform-card" rounded="lg" border>
      <v-alert v-if="success" type="success" variant="tonal" class="mb-6">
        <div class="font-weight-medium">
          {{ success.name }} has been provisioned.
        </div>
        <div class="text-body-2 mt-1">
          Plan: {{ success.plan }} · Subscription: {{ success.subscription }}.
          Configure the tenant host/DNS, then share the administrator sign-in
          details securely.
        </div>
      </v-alert>

      <v-form ref="formRef" v-model="valid" @submit.prevent="submit">
        <v-row>
          <v-col cols="12"
            ><h2 class="text-subtitle-1 font-weight-bold">
              Organization
            </h2></v-col
          >
          <v-col cols="12" md="7">
            <v-text-field
              v-model="form.name"
              label="Organization name"
              variant="outlined"
              :rules="requiredRules"
            />
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="form.slug"
              label="Tenant slug"
              hint="Lowercase letters, numbers, and hyphens only"
              persistent-hint
              variant="outlined"
              :rules="slugRules"
              @update:model-value="form.slug = normalizedSlug(form.slug)"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.timezone"
              label="Organization timezone"
              :items="timezones"
              variant="outlined"
              :rules="requiredRules"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.country_code"
              label="Country code"
              hint="ISO alpha-2, e.g. PH"
              persistent-hint
              variant="outlined"
              :rules="countryRules"
              @update:model-value="
                form.country_code = form.country_code.toUpperCase()
              "
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.plan_code"
              label="Plan"
              :items="plans"
              item-title="title"
              item-value="value"
              variant="outlined"
              :rules="requiredRules"
            />
          </v-col>
          <v-col cols="12">
            <v-alert type="info" variant="tonal" density="compact">
              {{ planDescription }} Leave the employee limit blank to use the
              selected plan's default.
            </v-alert>
          </v-col>

          <v-col cols="12"><v-divider class="my-1" /></v-col>
          <v-col cols="12"
            ><h2 class="text-subtitle-1 font-weight-bold">
              Subscription
            </h2></v-col
          >
          <v-col cols="12" md="4">
            <v-select
              v-model="form.subscription_status"
              label="Initial status"
              :items="subscriptionStatuses"
              item-title="title"
              item-value="value"
              variant="outlined"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
            v-if="form.subscription_status === 'trialing'"
          >
            <v-text-field
              v-model="form.trial_ends_at"
              label="Trial ends"
              type="datetime-local"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.current_period_ends_at"
              label="Current period ends (optional)"
              type="datetime-local"
              variant="outlined"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.employee_limit"
              label="Employee limit (optional)"
              type="number"
              min="1"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12"><v-divider class="my-1" /></v-col>
          <v-col cols="12"
            ><h2 class="text-subtitle-1 font-weight-bold">
              First administrator
            </h2></v-col
          >
          <v-col cols="12" md="6"
            ><v-text-field
              v-model="form.admin_first_name"
              label="First name"
              variant="outlined"
              :rules="requiredRules"
          /></v-col>
          <v-col cols="12" md="6"
            ><v-text-field
              v-model="form.admin_last_name"
              label="Last name"
              variant="outlined"
              :rules="requiredRules"
          /></v-col>
          <v-col cols="12"
            ><v-text-field
              v-model="form.admin_email"
              label="Work email"
              type="email"
              autocomplete="email"
              variant="outlined"
              :rules="emailRules"
          /></v-col>
          <v-col cols="12" md="6"
            ><v-text-field
              v-model="form.admin_password"
              label="Temporary password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              variant="outlined"
              :rules="passwordRules"
          /></v-col>
          <v-col cols="12" md="6"
            ><v-text-field
              v-model="form.admin_password_confirmation"
              label="Confirm temporary password"
              :type="showPassword ? 'text' : 'password'"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              autocomplete="new-password"
              variant="outlined"
              :rules="confirmationRules"
              @click:append-inner="showPassword = !showPassword"
          /></v-col>
        </v-row>

        <div class="d-flex justify-end mt-4">
          <v-btn
            color="primary"
            type="submit"
            :loading="submitting"
            :disabled="submitting"
            >Provision organization</v-btn
          >
        </div>
      </v-form>
    </v-sheet>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import axios from "@/plugins/axios";
import { platformHeaders } from "@/composables/PlatformConsole/usePlatformAuth";

const formRef = ref();
const valid = ref(false);
const submitting = ref(false);
const showPassword = ref(false);
const success = ref<{
  name: string;
  plan: string;
  subscription: string;
} | null>(null);
const form = ref({
  name: "",
  slug: "",
  timezone: "Asia/Manila",
  country_code: "PH",
  plan_code: "growth",
  subscription_status: "trialing",
  trial_ends_at: toLocalDateTime(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  ),
  current_period_ends_at: "",
  employee_limit: "",
  admin_first_name: "",
  admin_last_name: "",
  admin_email: "",
  admin_password: "",
  admin_password_confirmation: "",
});

const timezones = [
  "Asia/Manila",
  "UTC",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];
const plans = [
  { title: "Starter", value: "starter" },
  { title: "Growth", value: "growth" },
  { title: "Business", value: "business" },
  { title: "Enterprise", value: "enterprise" },
  { title: "Basic (legacy)", value: "basic" },
];
const subscriptionStatuses = [
  { title: "Trialing", value: "trialing" },
  { title: "Active", value: "active" },
  { title: "Past due", value: "past_due" },
  { title: "Suspended", value: "suspended" },
  { title: "Cancelled", value: "cancelled" },
];
const planDescription = computed(
  () =>
    (
      ({
        starter: "Starter defaults to 25 employees.",
        growth: "Growth defaults to 100 employees.",
        business: "Business defaults to 500 employees.",
        enterprise: "Enterprise has no default employee cap.",
        basic: "Legacy Basic defaults to 50 employees.",
      }) as Record<string, string>
    )[form.value.plan_code],
);
const requiredRules = [(value: string) => !!value || "This field is required"];
const emailRules = [
  (value: string) => !!value || "Email is required",
  (value: string) => /.+@.+\..+/.test(value) || "Enter a valid email address",
];
const slugRules = [
  (value: string) => !!value || "Tenant slug is required",
  (value: string) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value) ||
    "Use lowercase letters, numbers, and hyphens",
];
const countryRules = [
  (value: string) =>
    /^[A-Z]{2}$/.test(value) || "Use a two-letter country code",
];
const passwordRules = [
  (value: string) => value.length >= 12 || "Use at least 12 characters",
  (value: string) =>
    (/[a-z]/.test(value) &&
      /[A-Z]/.test(value) &&
      /\d/.test(value) &&
      /[^A-Za-z0-9]/.test(value)) ||
    "Include upper/lowercase, a number, and a symbol",
];
const confirmationRules = [
  (value: string) =>
    value === form.value.admin_password || "Passwords do not match",
];

function normalizedSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, 63);
}
function toLocalDateTime(value: Date) {
  const offset = value.getTimezoneOffset() * 60000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}
function optionalDate(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

const submit = async () => {
  const result = await formRef.value.validate();
  if (!result.valid) return;

  submitting.value = true;
  success.value = null;
  try {
    const response = await axios.post(
      "/platform/organizations",
      {
        ...form.value,
        trial_ends_at:
          form.value.subscription_status === "trialing"
            ? optionalDate(form.value.trial_ends_at)
            : undefined,
        current_period_ends_at: optionalDate(form.value.current_period_ends_at),
        employee_limit: form.value.employee_limit
          ? Number(form.value.employee_limit)
          : undefined,
      },
      { headers: platformHeaders() },
    );
    const organization = response.data.data;
    success.value = {
      name: organization.name,
      plan: organization.plan?.name ?? organization.plan_code,
      subscription: organization.subscription_status,
    };
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.platform-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
}
.page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}
.eyebrow {
  color: #6576ff;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.page-heading h1 {
  margin-top: 4px;
  font-size: 1.75rem;
  letter-spacing: -0.035em;
}
.page-heading p {
  margin-top: 4px;
  color: #737e92;
  font-size: 0.88rem;
}
.platform-card {
  padding: 30px;
  border-color: #e3e7ef;
  box-shadow: 0 6px 22px rgba(24, 35, 58, 0.035);
}
.platform-card h2 {
  color: #303a4e;
}
@media (max-width: 600px) {
  .platform-page {
    padding: 22px 14px;
  }
  .page-heading {
    flex-direction: column;
  }
  .platform-card {
    padding: 20px;
  }
}
</style>
