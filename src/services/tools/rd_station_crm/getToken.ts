import { fetchTokenFromCrm } from './fetchTokenFromCrm';
import { persistTokenToCrm } from './persistTokenToCrm';
import { callWithLog } from './callWithLog';
import { requestToken } from './requestToken';
import { RdTokenResponse } from './types';
import { computeExpiresAt, formatExpiresAt, isTokenExpired } from './isTokenExpired';

export async function getToken(): Promise<string> {
  const storedTokens = await fetchTokenFromCrm();

  const staticToken = storedTokens?.access_token ?? process.env.RD_ACCESS_TOKEN ?? process.env.RD_API_TOKEN;
  const clientId = process.env.RD_CLIENT_ID;
  const clientSecret = process.env.RD_CLIENT_SECRET;
  const refreshToken = storedTokens?.refresh_token;
  const expiresAt = storedTokens?.expires_at;

  const hasStaticToken = staticToken && staticToken !== 'token_aqui';

  // Se há token salvo que ainda não expirou, usa direto
  if (storedTokens?.access_token && !isTokenExpired(expiresAt)) {
    return storedTokens.access_token;
  }

  // Prioriza token fixo quando nao ha refresh token
  if (hasStaticToken && (!refreshToken || refreshToken === 'refresh_token_aqui')) {
    return staticToken as string;
  }

  if (!clientId || !clientSecret) {
    if (hasStaticToken) {
      return staticToken as string;
    }
    throw new Error(
      'Credenciais da RD Station ausentes. Configure RD_ACCESS_TOKEN/RD_API_TOKEN ou RD_CLIENT_ID e RD_CLIENT_SECRET no ambiente.'
    );
  }

  let data: RdTokenResponse | null = null;

  // tenta sempre renovar se houver refresh token disponível
  if (refreshToken && refreshToken !== 'refresh_token_aqui') {
    const refreshBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    });

    try {
      console.log('[RD_STATION] Tentando refresh do token via refresh_token...');
      data = await callWithLog('token_refresh', refreshBody, () =>
        requestToken('refresh_token', refreshBody)
      );
      console.log('[RD_STATION] Refresh do token concluído com sucesso.', {
        token_type: data?.token_type ?? 'bearer',
        expires_in: data?.expires_in
      });
    } catch (error) {
      console.error('[RD_STATION] Falha ao renovar token via refresh_token', {
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data,
        message: (error as any)?.message ?? error
      });
      // segue para tentar via token estático
    }
  }

  if (!data) {
    // sem refresh token salvo: tenta token estático ou avisa
    if (hasStaticToken) {
      return staticToken as string;
    }
    throw new Error(
      'Refresh token não encontrado no CRM (GET /api/v1/rdcrm). Gere e salve um novo refresh_token antes de prosseguir.'
    );
  }

  const token = data?.access_token ?? data?.token;

  if (data?.access_token || data?.refresh_token) {
    await persistTokenToCrm({
      access_token: data.access_token ?? token,
      refresh_token: data.refresh_token ?? refreshToken,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: formatExpiresAt(data.expires_in)
    });
  }

  if (!token) {
    throw new Error('RD Station não retornou access_token na geração do token.');
  }

  return token;
}
