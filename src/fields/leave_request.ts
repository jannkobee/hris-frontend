import { ColumnConfig } from "@/types/types";
import { formatDateTime } from "@/utils/dateFormatter";
import { statusChipColor } from "@/utils/chipColors";

export const fields: ColumnConfig[] = [
  {
    title: "Employee",
    key: "employee.user.email",
    inputField: "select",
    selectKey: "employee_id",
    inputOptions: [],
    required: true,
  },
  {
    title: "Type",
    key: "leave_type.name",
    inputField: "select",
    selectKey: "leave_type_id",
    inputOptions: [],
    required: true,
    displayAs: "chip",
    chipColor: "secondary",
  },
  {
    title: "Start",
    key: "start_at",
    inputField: "datetime",
    required: true,
    formatter: formatDateTime,
  },
  {
    title: "End",
    key: "end_at",
    inputField: "datetime",
    required: true,
    formatter: formatDateTime,
  },
  {
    title: "Reason",
    key: "reason",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Supporting Documents",
    key: "attachments",
    inputField: "file",
    multiple: true,
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    required: false,
    formatter: (attachments: any[]) =>
      attachments?.length ? `${attachments.length} file(s)` : "None",
    displayAs: "chip",
    chipColor: "info",
  },
  {
    title: "Status",
    key: "status",
    displayAs: "chip" as const,
    inputField: "none",
    chipColor: statusChipColor,
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
