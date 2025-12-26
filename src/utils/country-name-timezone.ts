// @ts-expect-error Declaration file missing
import { getCode } from 'country-list';
import ct from "countries-and-timezones";

export const countryNameToTimezone = (countryName: string): string | null => {
  const code = getCode(countryName);
  if (!code) return null;

  const country = ct.getCountry(code);
  if (!country || country.timezones.length === 0) return null;

  return country.timezones[0];
}