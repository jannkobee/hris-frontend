<template>
  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Employee Number Settings</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Configure how employee numbers are automatically generated.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Employee Numbers</v-chip>
    </div>

    <v-card variant="tonal" color="primary" class="mb-6 rounded-lg">
      <v-card-text class="d-flex align-center justify-space-between py-2">
        <div class="d-flex align-center">
          <v-icon icon="mdi-eye-outline" class="mr-2" size="small"></v-icon>
          <span class="text-subtitle-2 font-weight-bold"
            >Next Generated Number Preview:</span
          >
        </div>
        <code class="text-subtitle-1 font-weight-black">{{
          finalPreview
        }}</code>
      </v-card-text>
    </v-card>

    <v-card :loading="loading" elevation="0" border class="rounded-lg mb-8">
      <v-form @submit.prevent="execute" ref="formRef">
        <v-card-text class="pa-6">
          <v-select
            v-model="form.strategy"
            :items="strategies"
            item-title="label"
            item-value="value"
            label="Generation Strategy"
            hint="Select how the system should automatically generate employee numbers."
            persistent-hint
            variant="outlined"
            :disabled="loading"
            density="compact"
            class="mb-4"
          ></v-select>

          <v-text-field
            v-model="form.prefix"
            :label="
              form.strategy === 'custom_format' ? 'Format Template' : 'Prefix'
            "
            :placeholder="dynamicPlaceholder"
            :hint="dynamicHint"
            persistent-hint
            variant="outlined"
            :disabled="loading"
            density="compact"
            class="mb-4"
            :rules="[
              (v) =>
                !!v ||
                (form.strategy === 'custom_format'
                  ? 'Format template is required'
                  : 'Prefix is required'),
            ]"
          ></v-text-field>

          <v-alert
            v-if="form.strategy === 'custom_format'"
            type="info"
            variant="tonal"
            icon="mdi-lightbulb-on-outline"
            class="mb-6 text-caption"
          >
            <strong>Format Template Examples:</strong>
            <ul class="mt-2 ml-6" style="list-style-type: disc">
              <li class="mb-1">
                <strong>Input:</strong> <code>{INC}</code> |
                <strong>Padding:</strong> 1 ➡️ <strong>Output:</strong> 1
              </li>
              <li class="mb-1">
                <strong>Input:</strong> <code>{INC}-NIG</code> |
                <strong>Padding:</strong> 3 ➡️ <strong>Output:</strong> 001-NIG
              </li>
              <li>
                <strong>Input:</strong> <code>EMP-{YYYY}-{INC}</code> |
                <strong>Padding:</strong> 4 ➡️
                <strong>Output:</strong> EMP-2026-0001
              </li>
            </ul>
          </v-alert>

          <v-text-field
            v-if="form.strategy !== 'yearly_random'"
            v-model.number="form.padding"
            type="number"
            label="Padding (Number of Zeroes)"
            placeholder="4"
            hint="Determines the minimum length of the incrementing number."
            persistent-hint
            variant="outlined"
            :disabled="loading"
            density="compact"
            min="1"
            max="10"
            :rules="[
              (v) => !!v || 'Padding is required',
              (v) => (v >= 1 && v <= 10) || 'Must be between 1 and 10',
            ]"
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-3 bg-surface-variant justify-end">
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-content-save"
            :loading="loading"
            :disabled="loading"
          >
            Save Settings
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>

    <v-card
      elevation="0"
      border
      variant="tonal"
      color="error"
      class="rounded-lg border-error"
    >
      <v-card-title class="text-error font-weight-bold pt-4 px-6">
        <v-icon color="error" class="mr-2" size="small"
          >mdi-alert-octagon</v-icon
        >
        Danger Zone
      </v-card-title>
      <v-card-text
        class="px-6 pb-6 pt-2 d-flex align-center justify-space-between"
      >
        <div>
          <h3 class="text-subtitle-2 font-weight-medium text-error">
            Reformat Existing Employees
          </h3>
          <p class="text-caption text-error mt-1 font-weight-medium">
            Retroactively apply current settings to everyone. This action is
            permanent.
          </p>
        </div>
        <v-btn
          color="error"
          variant="flat"
          size="small"
          prepend-icon="mdi-refresh"
          @click="confirmDialog = true"
          :disabled="loading"
        >
          Reformat All
        </v-btn>
      </v-card-text>
    </v-card>

    <v-dialog v-model="confirmDialog" max-width="400" persistent>
      <v-card>
        <v-card-title
          class="bg-error text-on-error pa-3 text-subtitle-1 d-flex align-center"
        >
          <v-icon size="small" class="mr-2">mdi-alert</v-icon>
          Confirm Reformat
        </v-card-title>
        <v-card-text class="pa-4 text-body-2">
          Overwrite all employee numbers? This cannot be undone.
        </v-card-text>
        <v-card-actions class="pa-3 justify-end">
          <v-btn variant="text" size="small" @click="confirmDialog = false"
            >Cancel</v-btn
          >
          <v-btn
            color="error"
            variant="flat"
            size="small"
            @click="executeReformat"
            :loading="reformatting"
            >Confirm</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from "vue";
import axios from "@/plugins/axios";
import { useNotification } from "@/composables/useNotification";

const { showNotification } = useNotification();

const loading = ref(false);
const reformatting = ref(false);
const confirmDialog = ref(false);
const formRef = ref();

const form = ref({
  strategy: "yearly_random",
  prefix: "EMP",
  padding: 4,
});

const finalPreview = computed(() => {
  const pad = form.value.padding || 1;
  const inc = String(1).padStart(pad, "0");
  const year = new Date().getFullYear();
  const prefix = form.value.prefix || "";

  if (form.value.strategy === "yearly_random")
    return `${prefix}-${year}-630993`;
  if (form.value.strategy === "auto_increment") return `${prefix}-${inc}`;
  if (form.value.strategy === "custom_format") {
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    return prefix
      .replace(/{INC}/g, inc)
      .replace(/{YYYY}/g, String(year))
      .replace(/{MM}/g, month);
  }
  return "Select a strategy";
});

const dynamicPlaceholder = computed(() => {
  return form.value.strategy === "custom_format"
    ? "e.g., EMP-{YYYY}-{INC}"
    : "e.g., EMP";
});

const dynamicHint = computed(() => {
  if (form.value.strategy === "custom_format")
    return `Use {INC} for numbers, {YYYY} for year, {MM} for month.`;
  return "The starting letters of the employee number.";
});

const strategies = ref([
  { label: "Yearly Random (e.g., EMP-2026-123456)", value: "yearly_random" },
  { label: "Auto Increment (e.g., EMP-0001)", value: "auto_increment" },
  { label: "Custom Format (Advanced)", value: "custom_format" },
]);

const fetchSettings = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/employees/employee-no/settings");
    if (res.data?.data) {
      form.value.strategy = res.data.data.strategy;
      form.value.prefix = res.data.data.prefix;
      form.value.padding = res.data.data.padding;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const execute = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;
  loading.value = true;
  try {
    const res = await axios.put("/employees/employee-no/settings", form.value);
    if (res.status === 200)
      showNotification("Success", res.data.message, "success");
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const executeReformat = async () => {
  reformatting.value = true;
  try {
    const res = await axios.post("/employees/employee-no/reformat");
    if (res.status === 200)
      showNotification("Success", res.data.message, "success");
    confirmDialog.value = false;
  } catch (error) {
    console.error(error);
  } finally {
    reformatting.value = false;
  }
};

onMounted(fetchSettings);
</script>
