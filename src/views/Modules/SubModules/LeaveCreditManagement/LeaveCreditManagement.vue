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

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Leave Credit Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Configure automatic leave credit accrual rules.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Leave Credits</v-chip>
    </div>

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
    />
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
  frequency: "monthly",
  run_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  eligible_employment_status_ids: [],
  eligible_department_ids: [],
  eligible_position_ids: [],
  eligible_job_grade_ids: [],
  minimum_service_months: 0,
  is_active: true,
});

const form = computed(() => emptyForm());

const readOnly = () => action.value === "View";

const loadOptions = async () => {
  const [leaveTypes, employmentStatuses, departments, positions, jobGrades] = await Promise.all([
    getLeaveTypes(), getEmploymentStatuses(), getDepartments(), getPositions(), getJobGrades(),
  ]);

  const setOptions = (key: string, options: any[]) => {
    const field = fields.value.find((item) => item.selectKey === key);
    if (field) field.inputOptions = options.map((option: any) => ({ label: option.name, value: option.id }));
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
