import axios from 'axios';
import { RDCRM_TOKEN_NAME, RDCRM_TOKEN_URL } from './constants';
import { RdTokenResponse } from './types';
import { formatExpiresAt } from './isTokenExpired';

export async function persistTokenToCrm(payload: RdTokenResponse) {
  if (!payload.access_token) return;

  try {
    await axios.post(RDCRM_TOKEN_URL, {
      name: RDCRM_TOKEN_NAME,
      access_token: payload.access_token,
      token_type: payload.token_type ?? 'bearer',
      expires_in: payload.expires_in ?? 7200,
      refresh_token: payload.refresh_token,
      expires_at: payload.expires_at ?? formatExpiresAt(payload.expires_in)
    });
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('[RD_STATION] Falha ao atualizar token salvo', status ?? error);
  }
}
