<template>
  <Form
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :fields="fields"
    :data="data"
    @close="close"
    @execute="execute"
  />

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Attendance Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Track and manage employee time-in and time-out records.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Attendance</v-chip>
    </div>

    <Table
      :entity="entity"
      title="Attendance Records"
      :headers="fields"
      :data="items"
      :loading="loading"
      :pagination="pagination"
      :relations="relations"
      @filter="fetchAttendance"
      @create="create"
      @view="view"
      @edit="edit"
      @remove="remove"
    >
      <template #filters>
        <v-text-field
          v-model="selectedDate"
          type="date"
          density="compact"
          variant="outlined"
          hide-details
          class="date-input"
          @update:model-value="onDateChange"
        />
      </template>
    </Table>
  </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/attendance";
import type { ColumnConfig } from "@/types/types";
import Form from "@/components/Form.vue";
import Table from "@/components/Table.vue";

const fields = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/attendances");

const { getOptions: getEmployees } = useApi("/employees");

const relations = "employee.user";

const entity = ref("Attendance");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const todayIso = () => new Date().toLocaleDateString("en-CA");
const selectedDate = ref(todayIso());

const fetchAttendance = async (options: any = {}) => {
  await index({ ...options, relations, date: selectedDate.value });
};

const onDateChange = () => {
  fetchAttendance();
};

type AttendanceForm = {
  id: string;
  employee_id: string;
  date: string;
  time_in: string;
  time_out: string;
  time_in_notes: string;
  time_out_notes: string;
};

const initializeForm = (): AttendanceForm => ({
  id: "",
  employee_id: "",
  date: "",
  time_in: "",
  time_out: "",
  time_in_notes: "",
  time_out_notes: "",
});

const form = ref<AttendanceForm>(initializeForm());

const readOnly = () => action.value === "View";

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((o: any) => string),
): void => {
  const mapped = options.map((o: any) => ({
    label: typeof label === "function" ? label(o) : (o[label] ?? ""),
    value: o.id,
  }));

  const field = fields.value.find((f) => f.selectKey === selectKey);
  if (field) {
    field.inputOptions = mapped;
  }
};

const loadOptions = async () => {
  try {
    const employees = await getEmployees({ relations: "user" });
    setSelectOptions(
      "employee_id",
      employees,
      (e) =>
        `${e.user.first_name} ${e.user.last_name} - ${e.user?.email ?? ""}`,
    );
  } catch (error) {
    console.error("Error loading options:", error);
  }
};

const create = () => {
  form.value = initializeForm();
  data.value = { ...form.value };
  action.value = "Create";
  isFormVisible.value = true;
};

const view = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

const edit = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Edit";
  data.value = { ...dataParam };
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
  form.value = initializeForm();
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") {
      await store(payload);
    } else if (action.value === "Edit") {
      await update(payload.id, payload);
    } else if (action.value === "Remove") {
      await destroy(payload.id);
    }

    isFormVisible.value = false;
  } catch (error) {
    console.error(error);
  }
};

onMounted(async () => {
  await loadOptions();
  await fetchAttendance();
});
</script>

<style scoped>
.date-input {
  max-width: 165px;
}
</style>
