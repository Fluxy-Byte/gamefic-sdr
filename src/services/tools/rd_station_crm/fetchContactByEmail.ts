import axios from 'axios';
import { RD_API_BASE } from './constants';
import { callWithLog } from './callWithLog';
import { authHeaders } from './authHeaders';
import { isNotFound } from './isNotFound';
import { withRetry } from './withRetry';
import { RdContactResponse } from './types';

export async function fetchContactByEmail(email: string, token: string): Promise<RdContactResponse | null> {
  try {
    const filter = encodeURIComponent(`email:"${email}"`);
    const url = `${RD_API_BASE}/crm/v2/contacts?filter=${filter}&limit=1`;
    console.log('[RD] fetchContactByEmail', url);
    const { data } = await callWithLog('fetch_contact', null, () =>
      withRetry(() => axios.get(url, { headers: authHeaders(token) }))
    );
    const contact = (data as any)?.data?.[0] ?? null;
    console.log('[RD] fetchContactByEmail result', contact?.id ?? contact?.uuid ?? 'not-found');
    return contact;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}
