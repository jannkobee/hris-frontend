import { ColumnConfig } from "@/types/types";
import { formatDate } from "@/utils/dateFormatter";

export const fields: ColumnConfig[] = [
  // =====================
  // Identity
  // =====================
  {
    title: "User Account",
    key: "user.email", // for table display (optional)
    inputField: "select",
    selectKey: "user_id", // IMPORTANT: this is what Form.vue writes into
    inputOptions: [], // populated dynamically
    nullable: false,
    readOnlyOnEdit: true, // Read-only when editing (but not when creating)
  },

  {
    title: "Employee No.",
    key: "employee_no",
    inputField: "text",
    nullable: false,
    readOnly: true,
    displayAs: "chip",
    chipColor: "primary",
  },

  // =====================
  // Employment Details
  // =====================
  {
    title: "Hire Date",
    key: "hire_date",
    inputField: "date",
    nullable: true,
    formatter: formatDate, // Format as "April 15, 2001"
  },
  {
    title: "Employment Status",
    key: "employment_status.name", // for table display
    inputField: "select",
    selectKey: "employment_status_id",
    inputOptions: [],
    nullable: true,
  },
  {
    title: "Department",
    key: "department.name", // for table display (optional)
    inputField: "select",
    selectKey: "department_id",
    inputOptions: [],
    nullable: true,
  },
  {
    title: "Position",
    key: "position.name", // for table display (optional)
    inputField: "select",
    selectKey: "position_id",
    inputOptions: [],
    nullable: true,
  },
  {
    title: "Job Grade",
    key: "job_grade.name", // for table display (optional)
    inputField: "select",
    selectKey: "job_grade_id",
    inputOptions: [],
    nullable: true,
  },

  // =====================
  // Action
  // =====================
  {
    title: "Action",
    key: "action",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
