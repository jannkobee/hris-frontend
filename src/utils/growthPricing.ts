// Upcoming PH marketing estimate only; not a checkout quote or billing authority.
export function estimateGrowthPricing(
  value: string | number,
  allowance = 10,
  rate = 19,
  minimum = 0,
) {
  const employees = Number(value);
  if (!Number.isSafeInteger(employees) || employees < 1 || employees > 100000) {
    return null;
  }
  const billableEmployees = Math.max(minimum, employees - allowance);
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
