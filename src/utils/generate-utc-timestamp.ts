export const toUtcTimestamp = (
  date: string,
  time: string,
  localTimezoneOffset: number
): number => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  const localTimestamp = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

  return localTimestamp + localTimezoneOffset * 60 * 1000;
}