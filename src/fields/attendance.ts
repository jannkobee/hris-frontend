import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "ID",
    key: "id",
    inputField: "none",
    sortable: true,
  },
  {
    title: "Employee Email",
    key: "user.email",
    inputField: "text",
    nullable: false,
    required: true,
    sortable: true,
  },
  {
    title: "Date",
    key: "date",
    inputField: "date",
    nullable: false,
    required: true,
    sortable: true,
  },
  {
    title: "Time In",
    key: "time_in",
    inputField: "time",
    nullable: false,
    required: true,
    sortable: true,
  },
  {
    title: "Time Out",
    key: "time_out",
    inputField: "time",
    nullable: true,
    required: false,
    sortable: true,
  },
  {
    title: "Time In Notes",
    key: "time_in_notes",
    inputField: "text",
    nullable: true,
    sortable: false,
  },
  {
    title: "Time Out Notes",
    key: "time_out_notes",
    inputField: "text",
    nullable: true,
    required: false,
    sortable: false,
  },
  {
    title: "Action",
    key: "action",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
