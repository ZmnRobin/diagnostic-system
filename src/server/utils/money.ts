// Decimal/string money helpers. Accept any numeric-ish input including Prisma Decimal.
// Prisma 7's Decimal is not directly string-assignable, so we stringify defensively.

export function toDecimal(value: unknown): string {
  return Number(value).toFixed(2);
}

export function formatMoney(value: unknown, currency = 'PKR'): string {
  let n: number;
  if (typeof value === 'number') n = value;
  else if (typeof value === 'string') n = parseFloat(value);
  else if (value && typeof (value as { toString?: () => string }).toString === 'function')
    n = parseFloat(String(value));
  else n = NaN;
  if (!Number.isFinite(n)) return `${currency} 0.00`;
  return `${currency} ${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function sumMoney(values: ReadonlyArray<unknown>): number {
  let acc = 0;
  for (const v of values) {
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    if (Number.isFinite(n)) acc += n;
  }
  return acc;
}