const EXPIRY_SAFETY_SECONDS = 300; // 5 min de folga

export function isTokenExpired(expiresAt?: string | number | null): boolean {
  if (expiresAt == null) return false;
  const expiryMs =
    typeof expiresAt === 'number'
      ? expiresAt
      : new Date(expiresAt).getTime();
  if (Number.isNaN(expiryMs)) return false;
  const now = Date.now();
  return expiryMs <= now + EXPIRY_SAFETY_SECONDS * 1000;
}

export function computeExpiresAt(expiresIn?: number): number {
  const ttl = (expiresIn ?? 7200) * 1000;
  return Date.now() + ttl;
}

export function formatExpiresAt(expiresIn?: number): string {
  const ms = computeExpiresAt(expiresIn);
  const iso = new Date(ms).toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  return iso;
}
