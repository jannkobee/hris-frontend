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
  },
  {
    title: "Address Line 1",
    key: "address_line_1",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Address Line 2",
    key: "address_line_2",
    inputField: "text",
    nullable: true,
  },
  {
    title: "City",
    key: "city",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Province/State",
    key: "province",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Postal Code",
    key: "postal_code",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Country",
    key: "country",
    inputField: "text",
    nullable: false,
  },
  {
    title: "Action",
    key: "action",
    inputField: "none",
    sortable: false,
    align: "center",
  },
];
