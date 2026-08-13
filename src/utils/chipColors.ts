const normalize = (value: unknown): string =>
  String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

export const statusChipColor = (value: unknown): string => {
  const status = normalize(value);

  if (["active", "approved", "completed", "success", "paid", "yes"].includes(status)) return "success";
  if (["rejected", "cancelled", "failed", "inactive", "no"].includes(status)) return "error";
  if (["pending", "draft", "processed", "in_progress"].includes(status)) return "warning";
  if (["scheduled", "open"].includes(status)) return "info";

  return "primary";
};

export const booleanChipColor = (value: unknown): string =>
  value === true || value === 1 || value === "1" || normalize(value) === "yes"
    ? "success"
    : "default";

