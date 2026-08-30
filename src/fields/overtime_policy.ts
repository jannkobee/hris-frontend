import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Day Type",
    key: "day_type",
    inputField: "select",
    selectKey: "day_type",
    inputOptions: [
      { label: "Regular Day", value: "regular_day" },
      { label: "Rest Day", value: "rest_day" },
      { label: "Regular Holiday", value: "regular_holiday" },
      { label: "Special Non-Working Day", value: "special_non_working_day" },
      { label: "Special Working Day", value: "special_working_day" },
      { label: "Company Holiday", value: "company_holiday" },
    ],
    required: true,
  },
  {
    title: "Premium Multiplier",
    key: "multiplier",
    inputField: "text",
    required: true,
  },
  {
    title: "Active",
    key: "is_active",
    inputField: "checkbox",
    required: false,
    displayAs: "chip",
    chipColor: (val: boolean) => (val ? "success" : "error"),
    formatter: (val: boolean) => (val ? "Yes" : "No"),
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
