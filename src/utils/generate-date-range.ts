export const generateDateRange = (start: string, end: string): string[] => {
  const result: string[] = [];

  let current = new Date(start + "T00:00:00Z");
  const endDate = new Date(end + "T00:00:00Z");

  if (current > endDate) {
    throw new Error("Start date must be before or equal to end date");
  }

  while (current <= endDate) {
    result.push(current.toISOString().slice(0, 10));

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return result;
}
