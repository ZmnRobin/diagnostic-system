// Pure flagging helpers for lab values vs reference ranges.
// No imports from @/ — safe to use from server and client components.

export type RangeEntryLike = {
  analyte: string;
  unit?: string;
  maleRef?: string;
  femaleRef?: string;
  generalRef?: string;
};

export type GenderLike = 'MALE' | 'FEMALE' | 'OTHER';

export type Flag = 'LOW' | 'NORMAL' | 'HIGH' | 'NIL';

export type ParsedRange =
  | { kind: 'empty' }
  | { kind: 'unknown'; raw: string }
  | { kind: 'range'; lo: number; hi: number }
  | { kind: 'lt'; hi: number }
  | { kind: 'gt'; lo: number };

export type ResultValueLike = {
  analyte: string;
  value: string;
  unit?: string;
};

export type ReportRow = {
  analyte: string;
  unit: string;
  value: string | null;
  reference: string;
  flag: Flag;
};

export function parseRangeString(raw: string | null | undefined): ParsedRange {
  if (raw == null) return { kind: 'empty' };
  const trimmed = raw.trim();
  if (trimmed === '') return { kind: 'empty' };

  // "<N" or "<= N"
  const lt = /^<\s*=?\s*(-?\d+(?:\.\d+)?)\s*$/.exec(trimmed);
  if (lt) {
    return { kind: 'lt', hi: Number(lt[1]) };
  }

  // ">N" or ">= N"
  const gt = /^>\s*=?\s*(-?\d+(?:\.\d+)?)\s*$/.exec(trimmed);
  if (gt) {
    return { kind: 'gt', lo: Number(gt[1]) };
  }

  // "lo - hi" or "lo-hi"
  const range = /^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/.exec(trimmed);
  if (range) {
    return { kind: 'range', lo: Number(range[1]), hi: Number(range[2]) };
  }

  return { kind: 'unknown', raw: trimmed };
}

export function pickRefForGender(range: RangeEntryLike, gender: GenderLike): string {
  if (gender === 'MALE' && range.maleRef && range.maleRef.trim() !== '') {
    return range.maleRef;
  }
  if (gender === 'FEMALE' && range.femaleRef && range.femaleRef.trim() !== '') {
    return range.femaleRef;
  }
  return range.generalRef ?? '';
}

export function toNumber(raw: string | null | undefined): number {
  if (raw == null) return Number.NaN;
  const cleaned = raw.trim().replace(/,/g, '');
  if (cleaned === '') return Number.NaN;
  return Number(cleaned);
}

export function evaluateFlag(
  rawValue: string | null | undefined,
  range: RangeEntryLike,
  gender: GenderLike,
): Flag {
  if (rawValue == null) return 'NIL';
  if (rawValue.trim() === '') return 'NIL';

  const refText = pickRefForGender(range, gender);
  if (refText.trim() === '') return 'NIL';

  const parsed = parseRangeString(refText);
  if (parsed.kind === 'empty' || parsed.kind === 'unknown') return 'NIL';

  const n = toNumber(rawValue);
  if (Number.isNaN(n)) return 'NIL';

  switch (parsed.kind) {
    case 'range':
      if (n < parsed.lo) return 'LOW';
      if (n > parsed.hi) return 'HIGH';
      return 'NORMAL';
    case 'lt':
      // Reference "<5": values strictly greater than 5 are HIGH; 5 itself is NORMAL.
      if (n > parsed.hi) return 'HIGH';
      return 'NORMAL';
    case 'gt':
      // Reference ">40": values strictly less than 40 are LOW; 40 itself is NORMAL.
      if (n < parsed.lo) return 'LOW';
      return 'NORMAL';
  }
}

function normalizeAnalyte(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function findValueForAnalyte(
  values: ResultValueLike[],
  analyte: string,
): ResultValueLike | null {
  const target = normalizeAnalyte(analyte);
  if (target === '') return null;

  // 1) exact match
  const exact = values.find((v) => normalizeAnalyte(v.analyte) === target);
  if (exact) return exact;

  // 2) unique substring match (either direction)
  const partial = values.filter((v) => {
    const n = normalizeAnalyte(v.analyte);
    return n !== '' && (n.includes(target) || target.includes(n));
  });
  if (partial.length === 1) return partial[0];

  return null;
}

export function flagRowsForReport(
  ranges: RangeEntryLike[],
  values: ResultValueLike[],
  gender: GenderLike,
): ReportRow[] {
  return ranges.map((r) => {
    const v = findValueForAnalyte(values, r.analyte);
    const refText = pickRefForGender(r, gender);
    return {
      analyte: r.analyte,
      unit: r.unit ?? '',
      value: v ? v.value : null,
      reference: refText,
      flag: v ? evaluateFlag(v.value, r, gender) : 'NIL',
    };
  });
}