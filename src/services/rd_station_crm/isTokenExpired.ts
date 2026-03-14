const EXPIRY_SAFETY_SECONDS = 300; // 5 min de folga

export function isTokenExpired(expiresAt?: string | number | null): boolean {
  // Se nao ha informacao de expiracao, assuma expirado para forcar refresh/renovacao.
  if (expiresAt == null) return true;

  const expiryMs =
    typeof expiresAt === 'number'
      ? expiresAt
      : new Date(expiresAt).getTime();

  // Valor invalido de expiracao deve ser tratado como expirado por seguranca.
  if (Number.isNaN(expiryMs)) return true;

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
