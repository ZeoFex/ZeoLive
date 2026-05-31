export function buildDisplayName(parts: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}) {
  return [parts.firstName, parts.middleName?.trim() || null, parts.lastName]
    .filter(Boolean)
    .join(" ");
}

export function parseDateOfBirth(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date of birth");
  }
  return date;
}
