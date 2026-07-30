import { ColumnConfig } from "@/types/types";

export const fields: ColumnConfig[] = [
  {
    title: "Leave Type",
    key: "leave_type.name",
    inputField: "select",
    selectKey: "leave_type_id",
    inputOptions: [],
    required: true,
  },
  {
    title: "Name",
    key: "name",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Description",
    key: "description",
    inputField: "text",
    nullable: true,
    required: false,
  },
  {
    title: "Credit Amount",
    key: "credit_amount",
    inputField: "text",
    nullable: false,
    required: true,
  },
  {
    title: "Frequency",
    key: "frequency",
    inputField: "select",
    selectKey: "frequency",
    inputOptions: [
      { label: "Monthly", value: "monthly" },
      { label: "Quarterly", value: "quarterly" },
      { label: "Semi-Annually", value: "semi_annually" },
      { label: "Annually", value: "annually" },
      { label: "Custom", value: "custom" },
    ],
    required: false,
    onChange: (value: string) => {
      const runMonthsByFrequency: Record<string, number[]> = {
        monthly: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        quarterly: [1, 4, 7, 10],
        semi_annually: [1, 7],
        annually: [1],
      };

      // "custom" (or anything unrecognized) leaves run_months alone so the
      // admin can pick whatever combination they need.
      if (value in runMonthsByFrequency) {
        return { run_months: runMonthsByFrequency[value] };
      }
    },
  },
  {
    title: "Run Months",
    key: "run_months",
    inputField: "select",
    selectKey: "run_months",
    multiple: true,
    inputOptions: [
      { label: "January", value: 1 },
      { label: "February", value: 2 },
      { label: "March", value: 3 },
      { label: "April", value: 4 },
      { label: "May", value: 5 },
      { label: "June", value: 6 },
      { label: "July", value: 7 },
      { label: "August", value: 8 },
      { label: "September", value: 9 },
      { label: "October", value: 10 },
      { label: "November", value: 11 },
      { label: "December", value: 12 },
    ],
    required: true,
    formatter: (v: number[]) => {
      const names = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return Array.isArray(v) ? v.map((m) => names[m - 1]).join(", ") : "";
    },
  },
  {
    title: "Active",
    key: "is_active",
    inputField: "checkbox",
    displayAs: "chip" as const,
    formatter: (v: any) => (v ? "Yes" : "No"),
    chipColor: "success",
    nullable: false,
    required: false,
  },
  {
    title: "Actions",
    key: "action",
    sortable: false,
    inputField: "none",
    align: "center",
  },
];
