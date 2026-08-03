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
        <div class="text-h5 font-weight-bold">Overtime Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Review, approve, and track employee overtime requests.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Overtime</v-chip>
    </div>

    <Table
      entity="Overtime"
      title="Overtime Requests"
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
      <template #extra-actions="{ item }">
        <v-btn
          v-if="item.status === 'pending'"
          size="small"
          color="success"
          variant="text"
          :loading="actionLoading === item.id"
          @click="approveOvertime(item)"
        >
          Approve
        </v-btn>
        <v-btn
          v-if="item.status === 'pending'"
          size="small"
          color="error"
          variant="text"
          :loading="actionLoading === item.id"
          @click="rejectOvertime(item)"
        >
          Reject
        </v-btn>
      </template>
    </Table>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import axios from "@/plugins/axios";
import { useApi } from "@/composables/useApi";
import Table from "@/components/Table.vue";
import Form from "@/components/Form.vue";
import type { ColumnConfig } from "@/types/types";
import { fields as overtimeFieldsRaw } from "@/fields/overtime";

const entity = ref("Overtime");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);
const actionLoading = ref<string | null>(null);

const fields = ref<ColumnConfig[]>([...overtimeFieldsRaw]);

const relations = "employee.user,approver";

const api = useApi("/overtime");
const { getOptions: getEmployees } = useApi("/employees");

const emptyForm = () => ({
  id: "",
  employee_id: "",
  date: "",
  time_start: "",
  time_end: "",
  hours: "",
  reason: "",
});

const form = ref(emptyForm());

const readOnly = () => action.value === "View";

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((option: any) => string),
) => {
  const mapped = options.map((option) => ({
    label: typeof label === "function" ? label(option) : (option[label] ?? ""),
    value: option.id,
  }));

  const field = fields.value.find((item) => item.selectKey === selectKey);
  if (field) field.inputOptions = mapped;
};

const loadOptions = async () => {
  const employees = await getEmployees({ relations: "user" });

  setSelectOptions(
    "employee_id",
    employees,
    (employee) =>
      `${employee.user?.first_name ?? ""} ${
        employee.user?.last_name ?? ""
      }`.trim() || employee.employee_no,
  );
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
    console.error("Unable to save Overtime:", error);
  }
};

// Approve/reject aren't plain CRUD, so they bypass useApi's store/update
// and hit the two extra endpoints directly, then refresh the list.
const approveOvertime = async (item: any) => {
  actionLoading.value = item.id;

  try {
    await axios.post(`/overtime/${item.id}/approve`);
    await api.index({ relations });
  } catch (error) {
    console.error("Unable to approve overtime request:", error);
  } finally {
    actionLoading.value = null;
  }
};

const rejectOvertime = async (item: any) => {
  const remarks =
    window.prompt("Reason for rejecting (optional):") ?? undefined;
  actionLoading.value = item.id;

  try {
    await axios.post(`/overtime/${item.id}/reject`, { remarks });
    await api.index({ relations });
  } catch (error) {
    console.error("Unable to reject overtime request:", error);
  } finally {
    actionLoading.value = null;
  }
};

onMounted(async () => {
  await Promise.all([loadOptions(), api.index({ relations })]);
});
</script>
