import { ColumnConfig } from "@/types/types";
import { formatDateTime } from "@/utils/dateFormatter";
import { booleanChipColor } from "@/utils/chipColors";

const excerpt = (value: string, length = 90): string => {
  const text = (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > length ? `${text.slice(0, length)}…` : text;
};

export const fields: ColumnConfig[] = [
  { title: "Title", key: "title", inputField: "text", required: true },
  {
    title: "Content",
    key: "content",
    inputField: "richtext",
    formatter: (value: string) => excerpt(value),
  },
  {
    title: "Category",
    key: "category",
    inputField: "text",
    nullable: true,
  },
  {
    title: "Color",
    key: "color",
    inputField: "select",
    selectKey: "value",
    inputOptions: [
      { label: "Primary", value: "primary" },
      { label: "Secondary", value: "secondary" },
      { label: "Info", value: "info" },
      { label: "Success", value: "success" },
      { label: "Warning", value: "warning" },
      { label: "Important", value: "error" },
    ],
    displayAs: "chip",
    chipColor: (value: string) => value || "primary",
    required: true,
  },
  {
    title: "Pinned",
    key: "is_pinned",
    inputField: "checkbox",
    displayAs: "chip",
    formatter: (value: boolean) => (value ? "Pinned" : "No"),
    chipColor: booleanChipColor,
    required: true,
  },
  {
    title: "Archived",
    key: "is_archived",
    inputField: "checkbox",
    displayAs: "chip",
    formatter: (value: boolean) => (value ? "Archived" : "Active"),
    chipColor: (value: boolean) => (value ? "secondary" : "success"),
    required: true,
  },
  {
    title: "Updated",
    key: "updated_at",
    inputField: "none",
    formatter: formatDateTime,
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
