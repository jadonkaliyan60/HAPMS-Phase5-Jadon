// Calendar keys represent South African dates, independent of the browser time zone.
export function hospitalDate(instant = new Date()): string {
  return new Date(instant.getTime() + 120 * 60_000).toISOString().slice(0, 10);
}

export function calendarDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function hospitalTime(date: string, minutes: number): string {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
  const minute = String(minutes % 60).padStart(2, '0');
  return new Date(date + 'T' + hour + ':' + minute + ':00+02:00').toISOString();
}
