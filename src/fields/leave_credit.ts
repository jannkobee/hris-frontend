import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  { title: "Employee", key: "employee.full_name", inputField: "none" },
  { title: "Type", key: "leave_type.name", inputField: "none" },
  { title: "Year", key: "year", inputField: "none" },
  { title: "Earned", key: "total_earned", inputField: "none" },
  { title: "Used", key: "used", inputField: "none" },
  { title: "Remaining", key: "remaining", inputField: "none" },
];
