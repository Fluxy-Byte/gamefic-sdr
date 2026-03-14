import { callWithLog } from './callWithLog';
import { fetchTokenFromCrm } from './fetchTokenFromCrm';
import { formatExpiresAt, isTokenExpired } from './isTokenExpired';
import { persistTokenToCrm } from './persistTokenToCrm';
import { requestToken } from './requestToken';

const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;
const RETRY_DELAY_MS = 60 * 1000;
const TOKEN_PLACEHOLDERS = new Set(['refresh_token_aqui', 'undefined', 'null']);

let refreshTimer: NodeJS.Timeout | null = null;
let routineStarted = false;
let refreshInFlight = false;

function hasUsableRefreshToken(value?: string | null): value is string {
  if (!value) return false;
  return !TOKEN_PLACEHOLDERS.has(value.trim().toLowerCase());
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
    void runScheduledRefresh(`timer:${reason}`);
  }, normalizedDelay);

  refreshTimer.unref?.();
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = process.env.RD_CLIENT_ID;
  const clientSecret = process.env.RD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Credenciais da RD Station ausentes. Configure RD_CLIENT_ID e RD_CLIENT_SECRET no ambiente.'
    );
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
  const refreshToken = storedTokens?.refresh_token ?? process.env.RD_REFRESH_TOKEN;

  if (!hasUsableRefreshToken(refreshToken)) {
    console.warn('[RD_STATION] Refresh token indisponivel. Nova tentativa sera feita em breve.');
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
    const refreshToken = storedTokens?.refresh_token ?? process.env.RD_REFRESH_TOKEN;

    if (!hasUsableRefreshToken(refreshToken)) {
      scheduleRefresh(RETRY_DELAY_MS, `${trigger}:refresh_token_unavailable`);
      return;
    }

    console.log('[RD_STATION] Executando refresh de token via rotina automatica', {
      trigger
    });

    await refreshAccessToken(refreshToken);

    const updatedTokens = await fetchTokenFromCrm();
    if (isTokenExpired(updatedTokens?.expires_at)) {
      scheduleRefresh(RETRY_DELAY_MS, `${trigger}:token_still_expired`);
      return;
    }
  } catch (error) {
    console.error('[RD_STATION] Falha na rotina de refresh de token', {
      trigger,
      message: (error as Error)?.message ?? error
    });

    scheduleRefresh(RETRY_DELAY_MS, `${trigger}:refresh_failed`);
    return;
  } finally {
    refreshInFlight = false;
  }

  await scheduleFromCurrentTokenState();
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

