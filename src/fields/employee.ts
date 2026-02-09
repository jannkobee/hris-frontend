import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  // =====================
  // Identity
  // =====================
  {
    title: "Employee No",
    key: "employee_no",
    inputField: "text",
    nullable: false,
  },
  {
    title: "User Account",
    key: "user_id",
    inputField: "select",
    selectKey: "users",
    inputOptions: [], // populated dynamically
    nullable: true,
  },

  // =====================
  // Personal Information
  // =====================
  {
    title: "First Name",
    key: "first_name",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Middle Name",
    key: "middle_name",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Last Name",
    key: "last_name",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Suffix",
    key: "suffix",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Gender",
    key: "gender",
    inputField: "radio",
    inputOptions: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
    ],
    nullable: false,
  },
  {
    title: "Birthdate",
    key: "birthdate",
    inputField: "date",
    nullable: false,
  },

  // =====================
  // Employment Details
  // =====================
  {
    title: "Hire Date",
    key: "hire_date",
    inputField: "date",
    nullable: true,
  },
  {
    title: "Employment Status",
    key: "employment_status_id",
    inputField: "select",
    selectKey: "employment_statuses",
    inputOptions: [],
    nullable: true,
  },
  {
    title: "Department",
    key: "department_id",
    inputField: "select",
    selectKey: "departments",
    inputOptions: [],
    nullable: true,
  },
  {
    title: "Position",
    key: "position_id",
    inputField: "select",
    selectKey: "positions",
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
