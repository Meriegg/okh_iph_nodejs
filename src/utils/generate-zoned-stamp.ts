import { DateTime } from "luxon";

export const toZonedTimestamp = (
  date: string,
  time: string,
  timeZone: string
): number => {
  const [hour, minute, second = "0"] = time.split(":");

  const dt = DateTime.fromObject(
    {
      year: Number(date.slice(0, 4)),
      month: Number(date.slice(5, 7)),
      day: Number(date.slice(8, 10)),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
    },
    { zone: timeZone }
  );

  if (!dt.isValid) {
    throw new Error(dt.invalidExplanation ?? "Invalid date/time");
  }

  return dt.toMillis();
}