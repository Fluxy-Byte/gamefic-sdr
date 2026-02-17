import axios from 'axios';
import { RDCRM_TOKEN_NAME, RDCRM_TOKEN_URL } from './constants';
import { RdCrmResponse, RdTokenResponse } from './types';

export async function fetchTokenFromCrm(): Promise<RdTokenResponse | null> {
  try {
    const url = `${RDCRM_TOKEN_URL}${RDCRM_TOKEN_NAME ? `?name=${encodeURIComponent(RDCRM_TOKEN_NAME)}` : ''}`;
    const { data } = await axios.get<RdCrmResponse>(url);
    if (data?.status && data.data) {
      return data.data;
    }
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    console.error('[RD_STATION] Falha ao buscar token salvo', status ?? error);
  }

  return null;
}
