import { formatValue } from "../helpers";
import { Alias } from "./misc";

export type LocaleCode = string & Alias;

export interface Locale {
  name: string;
  code: string;
  thousandsSeparator: string;
  decimalSeparator: string;
  dateFormat: string;
  timeFormat: string;
}

export const DEFAULT_LOCALES: Locale[] = [
  {
    name: "United States",
    code: "en-US",
    thousandsSeparator: ",",
    decimalSeparator: ".",
    dateFormat: "mm/dd/yyyy",
    timeFormat: "hh:mm:ss",
  },
  {
    name: "France",
    code: "fr-FR",
    thousandsSeparator: " ",
    decimalSeparator: ",",
    dateFormat: "dd/mm/yyyy",
    timeFormat: "hh:mm:ss",
  },
];
export const DEFAULT_LOCALE: Locale = DEFAULT_LOCALES[0];

export function isValidLocale(locale: any): locale is Locale {
  if (
    !(
      locale &&
      typeof locale === "object" &&
      typeof locale.name === "string" &&
      typeof locale.code === "string" &&
      typeof locale.thousandsSeparator === "string" &&
      typeof locale.decimalSeparator === "string" &&
      typeof locale.dateFormat === "string" &&
      typeof locale.timeFormat === "string"
    )
  ) {
    return false;
  }

  try {
    formatValue(1, { locale, format: "#,##0.00" });
    formatValue(1, { locale, format: locale.dateFormat });
    formatValue(1, { locale, format: locale.timeFormat });
  } catch {
    return false;
  }
  return true;
}
