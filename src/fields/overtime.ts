import { ColumnConfig } from "@/types/types";
import { formatDate, formatTime } from "@/utils/dateFormatter";
import { statusChipColor } from "@/utils/chipColors";

export const fields: ColumnConfig[] = [
  {
    title: "Employee",
    key: "employee",
    inputField: "select",
    selectKey: "employee_id",
    inputOptions: [],
    required: true,
    formatter: (employee: any) =>
      `${employee?.user?.first_name ?? ""} ${
        employee?.user?.last_name ?? ""
      }`.trim() ||
      employee?.employee_no ||
      "",
  },
  {
    title: "Date",
    key: "date",
    inputField: "date",
    required: true,
    formatter: formatDate,
  },
  {
    title: "Time Start",
    key: "time_start",
    inputField: "time",
    required: true,
    formatter: formatTime,
  },
  {
    title: "Time End",
    key: "time_end",
    inputField: "time",
    required: true,
    formatter: formatTime,
  },
  {
    title: "Hours",
    key: "hours",
    inputField: "text",
    required: true,
  },
  {
    title: "Reason",
    key: "reason",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Status",
    key: "status",
    inputField: "select",
    selectKey: "status",
    inputOptions: [
      { label: "Pending", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "Rejected", value: "rejected" },
    ],
    displayAs: "chip" as const,
    chipColor: statusChipColor,
    // Statuses only change via the Approve/Reject row actions, not the edit form.
    readOnly: true,
    required: false,
  },
  {
    title: "Approved By",
    key: "approver",
    inputField: "none",
    formatter: (approver: any) =>
      approver
        ? `${approver.first_name ?? ""} ${approver.last_name ?? ""}`.trim()
        : "—",
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
