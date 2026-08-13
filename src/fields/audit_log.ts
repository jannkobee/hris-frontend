import { ColumnConfig } from "@/types/types";
import { formatDateTime } from "@/utils/dateFormatter";
import { statusChipColor } from "@/utils/chipColors";

export const fields: ColumnConfig[] = [
  {
    title: "Date/Time",
    key: "created_at",
    inputField: "date",
    nullable: false,
    required: false,
    formatter: formatDateTime,
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
    key: "module",
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
    displayAs: "chip",
    chipColor: "info",
  },
  {
    title: "Result",
    key: "result",
    inputField: "text",
    nullable: false,
    required: false,
    displayAs: "chip",
    chipColor: statusChipColor,
  },
  {
    title: "Details",
    key: "action_details",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
