const EXPIRY_SAFETY_SECONDS = 300; // 5 min de folga

export function isTokenExpired(expiresAt?: string | number | null): boolean {
  // Se não há informação de expiração, assuma expirado para forçar refresh/renovação
  if (expiresAt == null) return true;
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
  // ISO 8601 com 'T' e 'Z', sem milissegundos (ex: 2026-03-09T00:00:07Z)
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
