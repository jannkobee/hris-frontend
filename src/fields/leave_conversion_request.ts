import { ColumnConfig } from "@/types/types";
import { statusChipColor } from "@/utils/chipColors";

export const fields: ColumnConfig[] = [
  {
    title: "Employee",
    key: "employee.user.email",
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
    displayAs: "chip",
    chipColor: "secondary",
  },
  {
    title: "Credits Requested",
    key: "credits_requested",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Monetary Value",
    key: "monetary_value",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Reason",
    key: "reason",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Status",
    key: "status",
    displayAs: "chip" as const,
    inputField: "none",
    chipColor: statusChipColor,
  },
  {
    title: "Remarks",
    key: "remarks",
    inputField: "text",
    nullable: true,
    required: false,
    readOnlyOnEdit: true,
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
