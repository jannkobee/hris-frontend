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

const emptyForm = () => ({
  id: "",
  leave_type_id: "",
  name: "",
  description: "",
  credit_amount: 0,
  frequency: "monthly",
  run_months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  is_active: true,
});

const form = computed(() => emptyForm());

const readOnly = () => action.value === "View";

const loadOptions = async () => {
  const leaveTypes = await getLeaveTypes();

  const mapped = leaveTypes.map((leaveType: any) => ({
    label: leaveType.name,
    value: leaveType.id,
  }));

  const field = fields.value.find((item) => item.selectKey === "leave_type_id");
  if (field) field.inputOptions = mapped;
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
