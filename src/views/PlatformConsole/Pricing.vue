<template>
  <section class="pricing-page">
    <h1>Pricing settings</h1>
    <p>Philippines · PHP · New checkout sessions use the effective rate.</p>
    <v-alert v-if="error" type="error" class="my-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate />
    <v-card v-else class="pa-6 mt-4">
      <v-form @submit.prevent="save">
        <v-text-field
          v-model.number="allowance"
          label="Free employee allowance"
          type="number"
          min="0"
        />
        <v-text-field
          v-model.number="rate"
          label="Monthly price per additional employee"
          prefix="₱"
          type="number"
          min="0"
          step="0.01"
        />
        <v-text-field
          v-model="effective"
          label="Effective date (local time, optional)"
          type="datetime-local"
        />
        <v-text-field
          v-model.number="employees"
          label="Preview employee count"
          type="number"
          min="1"
        />
        <p class="mb-4">
          {{ Math.max(0, employees - allowance) }} billable employees ·
          {{ formatPhp(Math.max(0, employees - allowance) * rate) }}/month
        </p>
        <v-btn type="submit" color="primary" :loading="saving"
          >Save pricing version</v-btn
        >
        <v-alert v-if="saved" type="success" class="mt-4"
          >Pricing version saved.</v-alert
        >
      </v-form>
    </v-card>
    <h2 class="mt-6">Version history</h2>
    <p v-if="!history.length">No pricing changes yet.</p>
    <v-table v-else
      ><thead>
        <tr>
          <th>Effective</th>
          <th>Free employees</th>
          <th>Monthly rate</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in history" :key="item.version">
          <td>{{ new Date(item.effective_at).toLocaleString() }}</td>
          <td>{{ item.free_employee_limit }}</td>
          <td>{{ formatPhp(item.growth_price_per_employee / 100) }}</td>
        </tr>
      </tbody></v-table
    >
  </section>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  fetchPricing,
  fetchPricingHistory,
  savePricing,
} from "@/composables/PlatformConsole/usePlatformPricing";
import { formatPhp } from "@/utils/growthPricing";
const allowance = ref(10),
  rate = ref(19),
  employees = ref(25);
const effective = ref(""),
  error = ref("");
const loading = ref(true),
  saving = ref(false),
  saved = ref(false);
const history = ref<any[]>([]);
onMounted(async () => {
  try {
    const [pricing, versions] = await Promise.all([
      fetchPricing(),
      fetchPricingHistory(),
    ]);
    allowance.value = pricing.free_employee_limit;
    rate.value = pricing.growth_price_per_employee / 100;
    history.value = versions;
  } catch {
    error.value = "Could not load pricing. Reload to try again.";
  } finally {
    loading.value = false;
  }
});
async function save() {
  saving.value = true;
  saved.value = false;
  error.value = "";
  try {
    await savePricing({
      free_employee_limit: allowance.value,
      growth_price_per_employee: Math.round(rate.value * 100),
      currency: "php",
      ...(effective.value
        ? { effective_at: new Date(effective.value).toISOString() }
        : {}),
    });
    history.value = await fetchPricingHistory();
    saved.value = true;
  } catch (e: any) {
    error.value =
      Object.values(e.response?.data?.errors ?? {})
        .flat()
        .join(" ") || "Could not save pricing.";
  } finally {
    saving.value = false;
  }
}
</script>
<style scoped>
.pricing-page {
  padding: 24px;
  max-width: 960px;
  margin: auto;
}
</style>
