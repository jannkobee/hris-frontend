const dateParts = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

export const dateKeyInTimeZone = (
  value: string | Date,
  timeZone: string,
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const parts = Object.fromEntries(
    dateParts(date, timeZone).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const timeInputInTimeZone = (
  value: string | Date,
  timeZone: string,
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map(({ type, value: part }) => [type, part]),
  );
  return `${parts.hour}:${parts.minute}`;
};

export const formatTimeInTimeZone = (
  value: string | Date,
  timeZone: string,
  locale?: string,
): string => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};
