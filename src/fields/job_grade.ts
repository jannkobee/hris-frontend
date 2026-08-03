import type { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    key: "name",
    title: "Name",
    inputField: "text",
    required: true,
  },
  {
    key: "description",
    title: "Description",
    inputField: "text",
  },
  {
    key: "action",
    title: "Actions",
  },
];
