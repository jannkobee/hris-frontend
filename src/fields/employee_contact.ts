import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Type",
    key: "type",
    inputField: "select",
    selectKey: "type",
    inputOptions: [
      { label: "Mobile", value: "mobile" },
      { label: "Home", value: "home" },
      { label: "Work", value: "work" },
      { label: "Email", value: "email" },
      { label: "Emergency", value: "emergency" },
    ],
    nullable: false,
    required: true,
  },
  {
    title: "Value",
    key: "value",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Action",
    key: "action",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
