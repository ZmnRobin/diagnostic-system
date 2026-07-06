import { format } from 'date-fns';

export function fmtDate(d: Date | string): string {
  return format(new Date(d), 'dd MMM yyyy');
}

export function fmtDateTime(d: Date | string): string {
  return format(new Date(d), 'dd MMM yyyy, hh:mm a');
}

export type Range = { from: Date; to: Date };

export function todayRange(): Range {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

export function monthRange(year = new Date().getFullYear(), month = new Date().getMonth()): Range {
  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

export function dayRange(date: Date): Range {
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);
  return { from, to };
}