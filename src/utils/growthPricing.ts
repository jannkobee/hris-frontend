// Upcoming PH marketing estimate only; not a checkout quote or billing authority.
export function estimateGrowthPricing(
  value: string | number,
  allowance = 10,
  rate = 19,
) {
  const employees = Number(value);
  if (!Number.isSafeInteger(employees) || employees < 1 || employees > 100000) {
    return null;
  }
  const billableEmployees = Math.max(0, employees - allowance);
  return {
    employees,
    billableEmployees,
    monthlyPesos: billableEmployees * rate,
  };
}

export function formatPhp(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}
