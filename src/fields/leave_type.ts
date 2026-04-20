import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Name",
    key: "name",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Default Days",
    key: "default_days",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Paid Leave",
    key: "is_paid",
    inputField: "checkbox",
    displayAs: "chip" as const,
    formatter: (v: any) => (v ? "Yes" : "No"),
    chipColor: "success",
    nullable: false,
    required: true,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
