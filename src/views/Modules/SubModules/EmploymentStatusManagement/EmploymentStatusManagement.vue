<template>
  <Form
    :loading="loadingActions"
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

  <DataTable
    :entity="entity"
    :title="title"
    :headers="fields"
    :data="items"
    :loading="loading"
    :pagination="pagination"
    :relations="relations"
    @filter="index"
    @create="create"
    @view="view"
    @edit="edit"
    @remove="remove"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/employee";
import axios from "@/plugins/axios";

// Create a reactive copy of fields
const fields = ref([...importedFields]);

const {
  index,
  items,
  loading,
  loadingActions,
  pagination,
  store,
  update,
  destroy,
} = useApi("/employees");

const { getOptions: getUsers } = useApi(
  "/users?without_employee=true&require_email=true",
);
const { getOptions: getEmploymentStatuses } = useApi("/employment-statuses");
const { getOptions: getDepartments } = useApi("/departments");
const { getOptions: getPositions } = useApi("/positions");

const relations = "user,employmentStatus,department,position";

const title = ref("Employee Management");
const entity = ref("Employee");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

const form = ref<any>({
  id: "",
  user_id: "",
  employee_no: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  suffix: "",
  gender: "",
  birthdate: "",
  hire_date: "",
  employment_status_id: "",
  department_id: "",
  position_id: "",
  meta: {},
});

const readOnly = () => action.value === "View";

const getEmployeeNumber = async () => {
  try {
    const res = await axios.get("/employees/generate-employee-number");

    form.value.employee_no = res.data.data.employee_no;

    console.log("Generated Employee Number:", form.value.employee_no);
  } catch (error) {
    console.error("Error fetching employee number:", error);
  }
};

const setSelectOptions = (
  selectKey: string,
  options: any[],
  label: string | ((o: any) => string),
) => {
  const mapped = options.map((o: any) => ({
    label: typeof label === "function" ? label(o) : o[label] ?? "",
    value: o.id,
  }));

  console.log(`Setting options for ${selectKey}:`, mapped);

  // Fixed: Search by selectKey instead of key in the reactive fields
  const field = fields.value.find((f: any) => f.selectKey === selectKey);
  if (field) {
    field.inputOptions = mapped;
    console.log(`Field found and updated for ${selectKey}:`, field);
  } else {
    console.warn(`No field found with selectKey: ${selectKey}`);
  }
};

const loadOptions = async () => {
  try {
    const [users, statuses, departments, positions] = await Promise.all([
      getUsers(),
      getEmploymentStatuses(),
      getDepartments(),
      getPositions(),
    ]);

    console.log("Loaded users:", users);
    console.log("Loaded statuses:", statuses);
    console.log("Loaded departments:", departments);
    console.log("Loaded positions:", positions);

    setSelectOptions(
      "user_id",
      users,
      (u) => `${u.first_name} ${u.last_name} - ${u.email}`,
    );
    setSelectOptions("employment_status_id", statuses, "name");
    setSelectOptions("department_id", departments, "name");
    setSelectOptions("position_id", positions, "name");

    console.log("All fields after setting options:", fields.value);
  } catch (error) {
    console.error("Error loading options:", error);
  }
};

const create = () => {
  isFormVisible.value = true;
  action.value = "Create";
  data.value = { ...form.value };

  getEmployeeNumber();
};

const view = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

const edit = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Edit";

  data.value = {
    ...dataParam,
    user: dataParam.user_id
      ? {
          id: dataParam.user_id,
          name: dataParam.user?.full_name || dataParam.user?.email || "",
        }
      : null,
    employmentStatus: dataParam.employment_status_id
      ? {
          id: dataParam.employment_status_id,
          name: dataParam.employmentStatus?.name || "",
        }
      : null,
    department: dataParam.department_id
      ? { id: dataParam.department_id, name: dataParam.department?.name || "" }
      : null,
    position: dataParam.position_id
      ? { id: dataParam.position_id, name: dataParam.position?.name || "" }
      : null,
  };
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
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
  await index({ relations } as any);
});
</script>
