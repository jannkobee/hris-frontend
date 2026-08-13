import { ColumnConfig } from "@/types/types";
import { formatDate } from "@/utils/dateFormatter";

const stripHtml = (value: string): string =>
  (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const excerpt = (value: string, length = 80): string => {
  const text = stripHtml(value);
  return text.length > length ? `${text.slice(0, length)}…` : text;
};

export const fields: ColumnConfig[] = [
  { title: "Title", key: "title", inputField: "text", required: true },
  {
    title: "Content",
    key: "content",
    inputField: "richtext",
    required: true,
    formatter: (value: string) => excerpt(value),
  },
  {
    title: "Publish Date",
    key: "published_at",
    inputField: "date",
    formatter: formatDate,
  },
  {
    title: "Active",
    key: "is_active",
    inputField: "checkbox",
    displayAs: "chip" as const,
    formatter: (value: boolean) => (value ? "Yes" : "No"),
    chipColor: "success",
    required: true,
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
