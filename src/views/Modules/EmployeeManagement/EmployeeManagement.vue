<template>
  <EmployeeStepperForm
    :loading="loadingActions"
    :entity="entity"
    :action="action"
    :readOnly="readOnly()"
    :visible="isFormVisible"
    :employeeForm="form"
    :data="data"
    :employeeFields="fields"
    :addressFields="addressFields"
    :contactFields="contactFields"
    :show-documents="canUseDocuments"
    @close="close"
    @execute="execute"
  />

  <v-container fluid>
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Employee Management</div>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Manage employee records, profiles, and organizational assignments.
        </p>
      </div>
      <v-chip color="primary" variant="flat">Employees</v-chip>
    </div>

    <Table
      :entity="entity"
      title="Employee Records"
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
  </v-container>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { useApi } from "@/composables/useApi";
import { fields as importedFields } from "@/fields/employee";
import { fields as addressFieldsImported } from "@/fields/employee_address";
import { fields as contactFieldsImported } from "@/fields/employee_contact";
import axios from "@/plugins/axios";
import type { ColumnConfig } from "@/types/types";
import EmployeeStepperForm from "@/components/EmployeeStepperForm.vue";
import Table from "@/components/Table.vue";
import { usePermissions } from "@/composables/usePermissions";
import { useAppSettings } from "@/composables/useAppSettings";

// Create a reactive copy of fields with proper typing
const fields = ref<ColumnConfig[]>([...importedFields] as ColumnConfig[]);
const addressFields = ref<ColumnConfig[]>([
  ...addressFieldsImported,
] as ColumnConfig[]);
const contactFields = ref<ColumnConfig[]>([
  ...contactFieldsImported,
] as ColumnConfig[]);

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
const { getOptions: getJobGrades } = useApi("/job-grades");

const relations =
  "user,employmentStatus,department,position,jobGrade,addresses,contacts";

const entity = ref("Employee");
const action = ref("");
const data = ref();
const isFormVisible = ref(false);

type EmployeeForm = {
  id: string;
  user_id: string;
  employee_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  gender: string;
  birthdate: string;
  hire_date: string;
  employment_status_id: string;
  department_id: string;
  position_id: string;
  job_grade_id: string;
  meta: Record<string, any>;
  basic_monthly_salary: number | string;
  pay_schedule: string;
};

const initializeForm = (): EmployeeForm => {
  return {
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
    job_grade_id: "",
    meta: {},
    basic_monthly_salary: 0,
    pay_schedule: "semi_monthly",
  };
};

const form = ref<EmployeeForm>(initializeForm());

const readOnly = () => action.value === "View";
const { checkPermissions } = usePermissions();
const { values: appSettings } = useAppSettings();
const documentsEnabled = computed(
  () => appSettings.value["employee_documents.enabled"] !== false,
);
const canUseDocuments = computed(
  () => documentsEnabled.value && checkPermissions("view-employee-documents"),
);

// Helper to format date for form input (converts to YYYY-MM-DD)
const formatDateForInput = (date: any): string => {
  if (!date) return "";

  // If it's already a string in YYYY-MM-DD format, return as is
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Try to parse and format
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const getEmployeeNumber = async () => {
  try {
    const res = await axios.get("/employees/employee-no/generate");

    form.value.employee_no = res.data.data.employee_no;

  } catch (error) {
    console.error("Error fetching employee number:", error);
  }
};

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
    const [users, statuses, departments, positions, jobGrades] =
      await Promise.all([
        getUsers(),
        getEmploymentStatuses(),
        getDepartments(),
        getPositions(),
        getJobGrades(),
      ]);

    setSelectOptions(
      "user_id",
      users,
      (u) => `${u.first_name} ${u.last_name} - ${u.email}`,
    );
    setSelectOptions("employment_status_id", statuses, "name");
    setSelectOptions("department_id", departments, "name");
    setSelectOptions("position_id", positions, "name");
    setSelectOptions("job_grade_id", jobGrades, "name");

  } catch (error) {
    console.error("Error loading options:", error);
  }
};

const ensureCurrentUserOption = (employee: any) => {
  const user = employee?.user;
  const userId = employee?.user_id ?? user?.id;
  if (!userId) return;

  const field = fields.value.find((item) => item.selectKey === "user_id");
  if (!field || field.inputOptions?.some((option) => option.value === userId)) return;

  field.inputOptions = [
    ...(field.inputOptions ?? []),
    {
      value: userId,
      label: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()
        + (user?.email ? ` - ${user.email}` : ""),
    },
  ];
};

const create = async () => {
  action.value = "Create";

  // Reset form to initial values
  form.value = initializeForm();

  // Fetch employee number
  await getEmployeeNumber();

  // Set data with the fetched employee number
  data.value = { ...form.value };

  // Show the form
  isFormVisible.value = true;
};

const view = (dataParam: any) => {
  ensureCurrentUserOption(dataParam);
  isFormVisible.value = true;
  action.value = "View";
  data.value = dataParam;
};

const edit = (dataParam: any) => {
  ensureCurrentUserOption(dataParam);
  isFormVisible.value = true;
  action.value = "Edit";

  data.value = {
    ...dataParam,
    hire_date: formatDateForInput(dataParam.hire_date), // Format date for input
    user: dataParam.user_id
      ? {
          id: dataParam.user_id,
          name: dataParam.user?.full_name || dataParam.user?.email || "",
        }
      : null,
    employment_status: dataParam.employment_status_id
      ? {
          id: dataParam.employment_status_id,
          name: dataParam.employment_status?.name || "",
        }
      : null,
    department: dataParam.department_id
      ? { id: dataParam.department_id, name: dataParam.department?.name || "" }
      : null,
    position: dataParam.position_id
      ? { id: dataParam.position_id, name: dataParam.position?.name || "" }
      : null,
    job_grade: dataParam.job_grade_id
      ? { id: dataParam.job_grade_id, name: dataParam.job_grade?.name || "" }
      : null,
    addresses: dataParam.addresses || [],
    contacts: dataParam.contacts || [],
  };
};

const remove = (dataParam: any) => {
  isFormVisible.value = true;
  action.value = "Remove";
  data.value = dataParam;
};

const close = () => {
  isFormVisible.value = false;
  form.value = initializeForm(); // Reset form to initial state
};

const execute = async (payload: any) => {
  try {
    if (action.value === "Create") {
      await store(payload);
      await loadOptions();
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
