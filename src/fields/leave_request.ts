import { ColumnConfig } from "@/types/types";

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
  },
  {
    title: "Start",
    key: "start_at",
    inputField: "datetime",
    required: true,
  },
  {
    title: "End",
    key: "end_at",
    inputField: "datetime",
    required: true,
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
  },
  {
    title: "Status",
    key: "status",
    displayAs: "chip" as const,
    inputField: "none",
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
