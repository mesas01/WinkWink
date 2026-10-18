/** Demo access code typed by the visitor. Session-only; storage can be unavailable (private mode). */
const KEY = "winkwink-demo-code";

export function readAccessCode(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveAccessCode(code: string): void {
  try {
    if (code.trim()) sessionStorage.setItem(KEY, code.trim());
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage blocked: the code is simply not remembered */
  }
}
