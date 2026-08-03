import { ColumnConfig } from "@/types/types";
import { formatDate } from "@/utils/dateFormatter";

export const fields: ColumnConfig[] = [
  {
    title: "Date/Time",
    key: "created_at",
    inputField: "date",
    nullable: false,
    required: false,
    formatter: formatDate,
  },
  {
    title: "User",
    key: "user_full_name",
    inputField: "text",
    nullable: false,
    required: false,
  },
  {
    title: "Module",
    key: "module_name",
    inputField: "text",
    nullable: false,
    required: false,
    displayAs: "chip",
    chipColor: "primary",
  },
  {
    title: "Action",
    key: "action",
    inputField: "text",
    nullable: false,
    required: false,
  },
  {
    title: "Result",
    key: "result",
    inputField: "text",
    nullable: false,
    required: false,
    displayAs: "chip",
    chipColor: "success",
  },
  {
    title: "Details",
    key: "action_details",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
