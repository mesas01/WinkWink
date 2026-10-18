/**
 * Google and Lovable sign-in go through Lovable's OAuth relay at `/~oauth/initiate`, which only
 * exists on Lovable hosting. On any other host (Vercel, localhost) that route is a 404, so the
 * buttons are hidden there instead of failing.
 */
const LOVABLE_HOSTS = /(\.lovable\.app|\.lovableproject\.com|(^|\.)lovable\.dev)$/i;

export function socialLoginAvailable(
  hostname: string = globalThis.location?.hostname ?? "",
): boolean {
  return LOVABLE_HOSTS.test(hostname);
}
