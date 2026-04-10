import { ColumnConfig } from "@/types/types";
import { formatDate } from "@/utils/dateFormatter";

export const fields: ColumnConfig[] = [
  {
    title: "First Name",
    key: "first_name",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Middle Name",
    key: "middle_name",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Last Name",
    key: "last_name",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Email",
    key: "email",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Gender",
    key: "gender",
    inputField: "radio",
    inputOptions: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
    ],
    nullable: false,
    required: true,
  },
  {
    title: "Birthday",
    key: "birthday",
    inputField: "date",
    nullable: false,
    required: true,
    formatter: formatDate,
  },
  {
    title: "Role",
    key: "role.name",
    selectKey: "role_id",
    inputField: "select",
    inputOptions: [],
    nullable: false,
    required: true,
  },
  {
    title: "Action",
    key: "action",
    sortable: false,
    inputField: "none",
  },
];
