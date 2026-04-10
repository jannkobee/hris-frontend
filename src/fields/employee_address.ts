import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Type",
    key: "type",
    inputField: "select",
    selectKey: "type",
    inputOptions: [
      { label: "Current", value: "current" },
      { label: "Permanent", value: "permanent" },
      { label: "Previous", value: "previous" },
    ],
    nullable: false,
    required: true,
  },
  {
    title: "Address Line 1",
    key: "address_line_1",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Address Line 2",
    key: "address_line_2",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "City",
    key: "city",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Province/State",
    key: "province",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Postal Code",
    key: "postal_code",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Country",
    key: "country",
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
