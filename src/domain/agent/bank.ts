export interface BankAccountKey {
  bank: string;
  last4: string;
}

const LAST4 = /(\d{4})\s*$/;

/** Splits "Chase ****4321" into a comparable key: lowercase bank name plus the last four digits. */
export function parseBankAccount(raw: string | null): BankAccountKey | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d*\s]/g, " ").trim();
  const match = LAST4.exec(digits);
  if (!match?.[1]) return null;
  const bank = raw
    .replace(/[*\d#-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return { bank, last4: match[1] };
}

/** True only when both bank and last four digits match. Unparseable input never matches. */
export function sameBankAccount(a: string | null, b: string | null): boolean {
  const left = parseBankAccount(a);
  const right = parseBankAccount(b);
  if (!left || !right) return false;
  return left.last4 === right.last4 && left.bank === right.bank;
}
