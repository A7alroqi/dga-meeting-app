import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar";

dayjs.extend(relativeTime);
dayjs.locale("ar");

const arGregorian = new Intl.DateTimeFormat("ar", {
  calendar: "gregory",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDateAr(value: string | Date | null | undefined): string {
  if (!value) return "";
  return arGregorian.format(new Date(value));
}

export function formatDateTimeAr(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  const datePart = arGregorian.format(d);
  const timePart = new Intl.DateTimeFormat("ar", {
    calendar: "gregory",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${datePart} - ${timePart}`;
}

export function formatRelativeAr(value: string | Date | null | undefined): string {
  if (!value) return "";
  return dayjs(value).fromNow();
}
