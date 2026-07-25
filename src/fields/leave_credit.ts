import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  { title: "Employee", key: "employee.user.email", inputField: "select", selectKey: "employee_id", inputOptions: [], required: true },
  { title: "Type", key: "leave_type.name", inputField: "select", selectKey: "leave_type_id", inputOptions: [], required: true },
  { title: "Year", key: "year", inputField: "text", required: true },
  { title: "Earned", key: "total_earned", inputField: "text", required: true },
  { title: "Used", key: "used", inputField: "text", required: true },
  { title: "Remaining", key: "remaining", inputField: "none" },
  { title: "Actions", key: "action", sortable: false, inputField: "none", align: "center" },
];
