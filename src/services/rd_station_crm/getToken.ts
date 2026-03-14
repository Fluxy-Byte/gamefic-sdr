import { fetchTokenFromCrm } from './fetchTokenFromCrm';
import { isTokenExpired } from './isTokenExpired';

const TOKEN_PLACEHOLDERS = new Set(['token_aqui', 'undefined', 'null']);

function isUsableAccessToken(value?: string | null): value is string {
  if (!value) return false;
  return !TOKEN_PLACEHOLDERS.has(value.trim().toLowerCase());
}

export async function getToken(): Promise<string> {
  const storedTokens = await fetchTokenFromCrm();
  const storedAccessToken = storedTokens?.access_token ?? storedTokens?.token;

  if (!isUsableAccessToken(storedAccessToken)) {
    throw new Error(
      'Access token da RD Station nao encontrado no CRM (GET /api/v1/rdcrm).'
    );
  }

  if (isTokenExpired(storedTokens?.expires_at)) {
    throw new Error(
      'Access token da RD Station expirado no CRM. A rotina de refresh deve renovar o token antes do uso.'
    );
  }

  return storedAccessToken;
}

