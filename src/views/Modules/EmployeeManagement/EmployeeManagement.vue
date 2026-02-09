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
import { fields } from "@/fields/employee";

// Employees API
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

// Options APIs
const { getOptions: getUsers } = useApi("/users");
const { getOptions: getEmploymentStatuses } = useApi("/employment-statuses");
const { getOptions: getDepartments } = useApi("/departments");
const { getOptions: getPositions } = useApi("/positions");

// Relations to request from API (if supported by backend)
const relations = "user,employmentStatus,department,position";

const title = ref("Employee Management");
const entity = ref("Employee");
const action = ref("");
const data = ref();

const isFormVisible = ref(false);

// Basic employee shape used by the generic <Form /> component
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
  // meta is optional; keep as object for extension
  meta: {},
});

const readOnly = () => action.value === "View";

const create = () => {
  isFormVisible.value = true;
  action.value = "Create";
  data.value = { ...form.value };
};

const view = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

const edit = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Edit";

  // Normalize nested select fields for the generic <Form />
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

const setSelectOptions = (
  fieldKey: string,
  options: any[],
  labelKey = "name",
) => {
  const mapped = options.map((o: any) => ({
    label: o[labelKey] ?? o.name ?? o.email ?? "",
    value: o.id,
  }));

  const field = fields.find((f: any) => f.key === fieldKey);
  if (field) field.inputOptions = mapped;
};

const loadOptions = async () => {
  const [users, statuses, departments, positions] = await Promise.all([
    getUsers(),
    getEmploymentStatuses(),
    getDepartments(),
    getPositions(),
  ]);

  // Match these keys with your fields/employee.ts
  setSelectOptions("user_id", users, "email");
  setSelectOptions("employment_status_id", statuses, "name");
  setSelectOptions("department_id", departments, "name");
  setSelectOptions("position_id", positions, "name");
};

onMounted(async () => {
  await loadOptions();

  // Load table data
  await index({ relations } as any);
});
</script>
