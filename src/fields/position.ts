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
    title: "Description",
    key: "description",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
