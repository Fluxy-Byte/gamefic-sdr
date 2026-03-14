import axios from 'axios';
import { callWithLog } from './callWithLog';
import { fetchTokenFromCrm } from './fetchTokenFromCrm';
import { formatExpiresAt, isTokenExpired } from './isTokenExpired';
import { persistTokenToCrm } from './persistTokenToCrm';
import { requestToken } from './requestToken';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;
const INVALID_CLIENT_RETRY_DELAY_MS = 10 * 60 * 1000;
const TOKEN_PLACEHOLDERS = new Set(['refresh_token_aqui', 'undefined', 'null']);

let refreshTimer: NodeJS.Timeout | null = null;
let routineStarted = false;
let refreshInFlight = false;

function cleanSecret(value?: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().replace(/^['"]|['"]$/g, '');
  return cleaned || null;
}

function hasUsableRefreshToken(value?: string | null): value is string {
  const cleaned = cleanSecret(value);
  if (!cleaned) return false;
  return !TOKEN_PLACEHOLDERS.has(cleaned.toLowerCase());
}

function parseExpiryMs(expiresAt?: string | number | null): number | null {
  if (expiresAt == null) return null;
  const parsed = typeof expiresAt === 'number' ? expiresAt : new Date(expiresAt).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function clearScheduledRefresh() {
  if (!refreshTimer) return;
  clearTimeout(refreshTimer);
  refreshTimer = null;
}

function scheduleRefresh(delayMs: number, reason: string) {
  clearScheduledRefresh();

  const normalizedDelay = Math.max(0, delayMs);
  const eta = new Date(Date.now() + normalizedDelay).toISOString();

  console.log('[RD_STATION] Proximo refresh de token agendado', {
    reason,
    delay_ms: normalizedDelay,
    eta
  });

  refreshTimer = setTimeout(() => {
    void runScheduledRefresh(reason);
  }, normalizedDelay);

  refreshTimer.unref?.();
}

async function refreshAccessToken(refreshTokenValue: string) {
  const clientId = cleanSecret(process.env.RD_CLIENT_ID);
  const clientSecret = cleanSecret(process.env.RD_CLIENT_SECRET);
  const refreshToken = cleanSecret(refreshTokenValue);

  if (!clientId || !clientSecret) {
    throw new Error(
      'Credenciais da RD Station ausentes. Configure RD_CLIENT_ID e RD_CLIENT_SECRET no ambiente.'
    );
  }

  if (!refreshToken) {
    throw new Error('Refresh token da RD Station ausente/invalido.');
  }

  const refreshBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  });

  const data = await callWithLog('token_refresh_routine', refreshBody, () =>
    requestToken('refresh_token', refreshBody)
  );

  const token = data.access_token ?? data.token;
  if (!token) {
    throw new Error('RD Station nao retornou access_token no refresh da rotina.');
  }

  await persistTokenToCrm({
    access_token: token,
    refresh_token: data.refresh_token ?? refreshToken,
    token_type: data.token_type,
    expires_in: data.expires_in,
    expires_at: formatExpiresAt(data.expires_in)
  });
}

async function scheduleFromCurrentTokenState() {
  const storedTokens = await fetchTokenFromCrm();
  const refreshToken = cleanSecret(storedTokens?.refresh_token);

  if (!hasUsableRefreshToken(refreshToken)) {
    console.warn('[RD_STATION] Refresh token indisponivel no banco. Nova tentativa sera feita em breve.');
    scheduleRefresh(RETRY_DELAY_MS, 'refresh_token_unavailable');
    return;
  }

  const expiresAtMs = parseExpiryMs(storedTokens?.expires_at);
  if (!expiresAtMs) {
    scheduleRefresh(0, 'missing_expires_at');
    return;
  }

  const delayMs = expiresAtMs - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
  scheduleRefresh(delayMs, 'expires_at_minus_5min');
}

async function runScheduledRefresh(trigger: string) {
  if (refreshInFlight) return;
  refreshInFlight = true;

  try {
    const storedTokens = await fetchTokenFromCrm();
    const refreshToken = cleanSecret(storedTokens?.refresh_token);

    if (!hasUsableRefreshToken(refreshToken)) {
      scheduleRefresh(RETRY_DELAY_MS, 'refresh_token_unavailable');
      return;
    }

    console.log('[RD_STATION] Executando refresh de token via rotina automatica', {
      trigger
    });

    await refreshAccessToken(refreshToken);

    const updatedTokens = await fetchTokenFromCrm();
    if (isTokenExpired(updatedTokens?.expires_at)) {
      scheduleRefresh(RETRY_DELAY_MS, 'token_still_expired');
      return;
    }
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    const errorCode = axios.isAxiosError(error) ? (error.response?.data as any)?.error : undefined;

    console.error('[RD_STATION] Falha na rotina de refresh de token', {
      trigger,
      status,
      error: errorCode,
      message: (error as Error)?.message ?? error
    });

    if (status === 400 && errorCode === 'invalid_client') {
      scheduleRefresh(INVALID_CLIENT_RETRY_DELAY_MS, 'invalid_client');
      return;
    }

    scheduleRefresh(RETRY_DELAY_MS, 'refresh_failed');
    return;
  } finally {
    refreshInFlight = false;
  }

  await scheduleFromCurrentTokenState();
}

export async function refreshRdTokenNow() {
  if (refreshInFlight) {
    throw new Error('Refresh de token ja esta em andamento.');
  }

  refreshInFlight = true;

  try {
    const storedTokens = await fetchTokenFromCrm();
    const refreshToken = cleanSecret(storedTokens?.refresh_token);

    if (!hasUsableRefreshToken(refreshToken)) {
      throw new Error('Refresh token indisponivel no banco para teste manual.');
    }

    await refreshAccessToken(refreshToken);

    const updatedTokens = await fetchTokenFromCrm();
    if (isTokenExpired(updatedTokens?.expires_at)) {
      throw new Error('Refresh manual concluiu sem atualizar expires_at de forma valida.');
    }

    await scheduleFromCurrentTokenState();

    return {
      expires_at: updatedTokens?.expires_at,
      token_type: updatedTokens?.token_type,
      expires_in: updatedTokens?.expires_in
    };
  } finally {
    refreshInFlight = false;
  }
}

export async function startRdTokenRefreshRoutine() {
  if (routineStarted) return;
  routineStarted = true;
  await scheduleFromCurrentTokenState();
}

export function stopRdTokenRefreshRoutine() {
  routineStarted = false;
  clearScheduledRefresh();
}
