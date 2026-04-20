import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Employee",
    key: "employee.full_name",
    inputField: "select",
    selectKey: "employee_id",
    inputOptions: [],
    required: true,
  },
  {
    title: "Type",
    key: "leave_type.name",
    inputField: "select",
    selectKey: "leave_type_id",
    inputOptions: [],
    required: true,
  },
  {
    title: "Start Date",
    key: "start_date",
    inputField: "date",
    required: true,
  },
  {
    title: "End Date",
    key: "end_date",
    inputField: "date",
    required: true,
  },
  {
    title: "Reason",
    key: "reason",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Status",
    key: "status",
    displayAs: "chip" as const,
    inputField: "none",
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
