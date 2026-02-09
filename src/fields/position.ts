import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Name",
    key: "name",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Description",
    key: "description",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
