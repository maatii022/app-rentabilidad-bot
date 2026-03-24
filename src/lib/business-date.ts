export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBusinessDate(now: Date = new Date()): string {
  const cut = new Date(now);
  cut.setHours(19, 0, 0, 0);

  if (now >= cut) {
    return formatLocalDate(now);
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return formatLocalDate(yesterday);
}