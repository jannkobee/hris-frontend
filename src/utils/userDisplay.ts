const cleanPart = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const part = value.trim();
  if (!part || ["null", "undefined"].includes(part.toLowerCase())) return "";
  return part;
};

const cleanFullName = (value: unknown): string =>
  cleanPart(value)
    .split(/\s+/)
    .filter((part) => !["null", "undefined"].includes(part.toLowerCase()))
    .join(" ");

export const userDisplayName = (user: any, fallback = "Teammate"): string => {
  if (!user) return fallback;

  const structuredName = [user.first_name, user.middle_name, user.last_name]
    .map(cleanPart)
    .filter(Boolean)
    .join(" ");

  return (
    structuredName ||
    cleanFullName(user.full_name) ||
    cleanFullName(user.name) ||
    cleanPart(user.email) ||
    fallback
  );
};

export const userInitials = (user: any, fallbackName = "Teammate"): string => {
  const words = userDisplayName(user, fallbackName).split(/\s+/).filter(Boolean);
  if (!words.length) return "?";

  const selected = words.length === 1 ? words : [words[0], words[words.length - 1]];
  return selected.map((word) => word[0]?.toUpperCase()).join("");
};
