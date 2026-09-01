<template>
  <v-container fluid class="pa-0">
    <ModuleHeader
      eyebrow="TOTAL REWARDS"
      title="Benefits & Expenses"
      subtitle="Manage benefit coverage, payroll deductions, and reimbursements."
      icon="mdi-heart-plus-outline"
    />
    <v-tabs v-model="tab" color="primary"
      ><v-tab value="benefits">Benefits</v-tab
      ><v-tab value="expenses">Expenses</v-tab></v-tabs
    >
    <v-window v-model="tab" class="mt-4"
      ><v-window-item value="benefits"
        ><v-card
          ><v-card-title>Available benefit plans</v-card-title
          ><v-list
            ><v-list-item
              v-for="plan in plans"
              :key="plan.id"
              :title="plan.name"
              :subtitle="`Employee deduction: ₱${plan.employee_contribution} • Employer contribution: ₱${plan.employer_contribution}`"
              ><template #prepend
                ><v-icon
                  icon="mdi-shield-heart-outline"
                  color="primary" /></template></v-list-item
            ><v-list-item
              v-if="!plans.length"
              title="No benefit plans configured yet." /></v-list></v-card></v-window-item
      ><v-window-item value="expenses"
        ><v-row
          ><v-col cols="12" md="5"
            ><v-card
              ><v-card-title>Submit an expense</v-card-title
              ><v-card-text
                ><v-text-field
                  v-model="draft.category"
                  label="Category" /><v-text-field
                  v-model="draft.amount"
                  label="Amount"
                  type="number"
                  prefix="₱" /><v-textarea
                  v-model="draft.description"
                  label="Description" /><v-tooltip
                  text="Submit expense claim"
                  location="top"
                  ><template #activator="{ props }"
                    ><v-btn
                      v-bind="props"
                      icon="mdi-send"
                      color="primary"
                      :loading="saving"
                      aria-label="Submit expense claim"
                      @click="
                        submit
                      " /></template></v-tooltip></v-card-text></v-card></v-col
          ><v-col cols="12" md="7"
            ><v-card
              ><v-card-title>Expense claims</v-card-title
              ><v-list
                ><v-list-item
                  v-for="claim in claims"
                  :key="claim.id"
                  :title="claim.category"
                  :subtitle="claim.description"
                  ><template #append
                    ><v-chip
                      :color="
                        claim.status === 'reimbursed'
                          ? 'success'
                          : claim.status === 'rejected'
                            ? 'error'
                            : 'warning'
                      "
                      size="small"
                      >{{ claim.status }}</v-chip
                    ></template
                  ></v-list-item
                ><v-list-item
                  v-if="!claims.length"
                  title="No expense claims yet." /></v-list></v-card></v-col></v-row></v-window-item
    ></v-window>
  </v-container>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import ModuleHeader from "@/components/layouts/HrisApp/ModuleHeader.vue";
import axios from "@/plugins/axios";
const tab = ref("benefits"),
  plans = ref<any[]>([]),
  claims = ref<any[]>([]),
  saving = ref(false);
const draft = ref({ category: "", amount: "", description: "" });
const load = async () => {
  plans.value = (await axios.get("/benefit-plans")).data.data;
  claims.value = (await axios.get("/expense-claims")).data.data;
};
const submit = async () => {
  saving.value = true;
  try {
    const me = (await axios.get("/profile")).data.data;
    await axios.post("/expense-claims", {
      ...draft.value,
      employee_id: me.employee?.id,
      expense_date: new Date().toISOString().slice(0, 10),
    });
    draft.value = { category: "", amount: "", description: "" };
    await load();
  } finally {
    saving.value = false;
  }
};
onMounted(load);
</script>
