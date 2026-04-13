const BUSINESS_TIME_ZONE = "Atlantic/Canary";
const CUT_HOUR = 19;
const CUT_MINUTE = 0;

function getPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function formatPartsDate(parts: { year: number; month: number; day: number }) {
  const year = String(parts.year);
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToIsoDate(isoDate: string, diffDays: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + diffDays);

  const nextYear = utcDate.getUTCFullYear();
  const nextMonth = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(utcDate.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function formatLocalDate(date: Date, timeZone = BUSINESS_TIME_ZONE): string {
  const parts = getPartsInTimeZone(date, timeZone);
  return formatPartsDate(parts);
}

export function getBusinessDate(now: Date = new Date()): string {
  const parts = getPartsInTimeZone(now, BUSINESS_TIME_ZONE);
  const todayInBusinessZone = formatPartsDate(parts);

  const afterCut =
    parts.hour > CUT_HOUR ||
    (parts.hour === CUT_HOUR && parts.minute >= CUT_MINUTE);

  if (afterCut) {
    return todayInBusinessZone;
  }

  return addDaysToIsoDate(todayInBusinessZone, -1);
}