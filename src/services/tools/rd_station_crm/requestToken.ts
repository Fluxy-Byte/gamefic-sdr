import axios from 'axios';
import { RD_API_BASE } from './constants';
import { RdTokenResponse } from './types';

export type GrantType = 'authorization_code' | 'refresh_token';

export async function requestToken(grantType: GrantType, body: URLSearchParams): Promise<RdTokenResponse> {
  body.set('grant_type', grantType);

  const url = `${RD_API_BASE}/oauth2/token`;

  const { data } = await axios.post<RdTokenResponse>(url, body.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    }
  });

  return data;
}
