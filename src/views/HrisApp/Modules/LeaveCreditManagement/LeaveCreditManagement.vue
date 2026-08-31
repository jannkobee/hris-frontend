<template>
  <Form
    :loading="api.loadingActions.value"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :form="form"
    :data="data"
    :fields="fields"
    @close="close"
    @execute="execute"
  />

  <v-container fluid class="leave-credit-page">
    <section class="accrual-hero">
      <div class="accrual-hero__icon">
        <v-icon icon="mdi-calendar-plus-outline" size="28" />
      </div>
      <div>
        <span>Leave credit policy</span>
        <h1>Leave Credit Accrual Settings</h1>
        <p>
          Create one rule for each leave benefit the company grants
          automatically.
        </p>
      </div>
      <v-chip color="primary" variant="flat"
        >{{ api.pagination.value.total }} rules</v-chip
      >
    </section>

    <section class="accrual-guide" aria-label="How leave credit accrual works">
      <article>
        <v-icon icon="mdi-form-select" color="primary" />
        <div>
          <strong>1. Choose a leave type</strong
          ><span>For example: Vacation Leave or Sick Leave.</span>
        </div>
      </article>
      <article>
        <v-icon icon="mdi-calendar-sync-outline" color="primary" />
        <div>
          <strong>2. Set recurring and initial credits</strong
          ><span
            >For example: 1.25 days monthly plus 5 days when an employee is
            hired.</span
          >
        </div>
      </article>
      <article>
        <v-icon icon="mdi-account-filter-outline" color="primary" />
        <div>
          <strong>3. Limit eligibility if needed</strong
          ><span
            >Leave filters blank to include all active employees with enough
            service.</span
          >
        </div>
      </article>
    </section>

    <v-alert
      type="info"
      variant="tonal"
      class="accrual-note"
      icon="mdi-information-outline"
    >
      These rules are company policy. Enable Grant Initial Credit on Hire and
      set its amount only for benefits you intentionally give to new employees.
      This initial grant is separate from the recurring credit amount and can be
      issued in the same month. Saving an active rule enables the daily Leave
      Accrual task, which prevents duplicate credits.
    </v-alert>

    <Table
      :entity="entity"
      title="Leave Credit Accrual Settings"
      :headers="fields"
      :data="api.items.value"
      :loading="api.loading.value"
      :pagination="api.pagination.value"
      :relations="relations"
      @filter="(opts: any) => api.index({ relations, ...opts })"
      @create="() => openForm('Create')"
      @view="(item: any) => openForm('View', item)"
      @edit="(item: any) => openForm('Edit', item)"
      @remove="(item: any) => openForm('Remove', item)"
    >
      <template #empty>
        <div class="accrual-empty">
          <v-icon icon="mdi-calendar-plus-outline" size="36" color="primary" />
          <strong>No accrual rules yet</strong>
          <span
            >Start with the leave type, amount granted, and the months when it
            should be credited.</span
          >
        </div>
      </template>
    </Table>
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";

import { fields as creditSettingFieldsRaw } from "@/fields/leave_credit_setting";

const entity = ref("LeaveCreditSetting");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);
const relations = "leaveType";

const fields = ref<ColumnConfig[]>([...creditSettingFieldsRaw]);

const api = useApi("/leave-credit-settings");
const { getOptions: getLeaveTypes } = useApi("/leave-types");
const { getOptions: getEmploymentStatuses } = useApi("/employment-statuses");
const { getOptions: getDepartments } = useApi("/departments");
const { getOptions: getPositions } = useApi("/positions");
const { getOptions: getJobGrades } = useApi("/job-grades");

const emptyForm = () => ({
  id: "",
  leave_type_id: "",
  name: "",
  description: "",
  credit_amount: 0,
  initial_credit_amount: 0,
  frequency: "monthly",
  run_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  eligible_employment_status_ids: [],
  eligible_department_ids: [],
  eligible_position_ids: [],
  eligible_job_grade_ids: [],
  minimum_service_months: 0,
  grant_on_hire: false,
  is_active: true,
});

const form = computed(() => emptyForm());

const readOnly = () => action.value === "View";

const loadOptions = async () => {
  const [leaveTypes, employmentStatuses, departments, positions, jobGrades] =
    await Promise.all([
      getLeaveTypes(),
      getEmploymentStatuses(),
      getDepartments(),
      getPositions(),
      getJobGrades(),
    ]);

  const setOptions = (key: string, options: any[]) => {
    const field = fields.value.find((item) => item.selectKey === key);
    if (field)
      field.inputOptions = options.map((option: any) => ({
        label: option.name,
        value: option.id,
      }));
  };

  setOptions("leave_type_id", leaveTypes);
  setOptions("eligible_employment_status_ids", employmentStatuses);
  setOptions("eligible_department_ids", departments);
  setOptions("eligible_position_ids", positions);
  setOptions("eligible_job_grade_ids", jobGrades);
};

const openForm = (actionName: string, item?: any) => {
  action.value = actionName;
  data.value = actionName === "Create" ? emptyForm() : { ...item };
  isFormVisible.value = true;
};

const close = () => {
  isFormVisible.value = false;
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") await api.store(payload);
    if (action.value === "Edit") await api.update(payload.id, payload);
    if (action.value === "Remove") await api.destroy(payload.id);

    isFormVisible.value = false;
  } catch (error) {
    console.error("Unable to save LeaveCreditSetting:", error);
  }
};

onMounted(async () => {
  await Promise.all([loadOptions(), api.index({ relations })]);
});
</script>

<style scoped>
.leave-credit-page {
  display: grid;
  gap: 16px;
}
.accrual-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 21px 22px;
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  border-radius: 17px;
  background: linear-gradient(
    125deg,
    rgba(var(--v-theme-primary), 0.13),
    rgba(var(--v-theme-surface), 0.96)
  );
}
.accrual-hero__icon {
  display: grid;
  width: 50px;
  height: 50px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.13);
}
.accrual-hero > div:nth-child(2) {
  min-width: 0;
  flex: 1;
}
.accrual-hero span {
  color: rgb(var(--v-theme-primary));
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.accrual-hero h1 {
  margin: 3px 0;
  font-size: 1.35rem;
  line-height: 1.2;
}
.accrual-hero p {
  margin: 0;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
}
.accrual-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.accrual-guide article {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 13px;
  background: rgb(var(--v-theme-surface));
}
.accrual-guide article > div {
  display: grid;
  gap: 3px;
}
.accrual-guide strong {
  font-size: 0.79rem;
}
.accrual-guide span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.7rem;
  line-height: 1.4;
}
.accrual-note {
  margin: 0;
  font-size: 0.78rem;
}
.accrual-empty {
  display: grid;
  max-width: 420px;
  justify-items: center;
  gap: 8px;
  margin: 20px auto;
  text-align: center;
}
.accrual-empty span {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.76rem;
}
@media (max-width: 850px) {
  .accrual-guide {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .accrual-hero {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .accrual-hero .v-chip {
    margin-left: 64px;
  }
}
</style>
