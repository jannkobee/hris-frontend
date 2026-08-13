import type { ColumnConfig } from "@/types/types";
import { formatDate } from "@/utils/dateFormatter";

export const holidayTypeOptions = [
  { label: "Regular holiday", value: "regular_holiday" },
  { label: "Special non-working day", value: "special_non_working_day" },
  { label: "Special working day", value: "special_working_day" },
  { label: "Company holiday", value: "company_holiday" },
];

const holidayTypeColor = (value: unknown): string => {
  const colors: Record<string, string> = {
    regular_holiday: "error",
    special_non_working_day: "warning",
    special_working_day: "info",
    company_holiday: "primary",
  };

  return colors[String(value)] ?? "secondary";
};

export const fields: ColumnConfig[] = [
  {
    title: "Date",
    key: "date",
    inputField: "date",
    required: true,
    nullable: false,
    sortable: true,
    formatter: formatDate,
  },
  {
    title: "Calendar entry",
    key: "name",
    inputField: "text",
    required: true,
    nullable: false,
    sortable: true,
  },
  {
    title: "Day type",
    key: "type",
    selectKey: "type",
    inputField: "select",
    inputOptions: holidayTypeOptions,
    required: true,
    nullable: false,
    sortable: true,
    displayAs: "chip",
    chipColor: holidayTypeColor,
  },
  {
    title: "Description",
    key: "description",
    inputField: "text",
    required: false,
    nullable: true,
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
