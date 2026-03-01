import axios from 'axios';
import { RD_API_BASE } from './constants';
import { callWithLog } from './callWithLog';
import { authHeaders } from './authHeaders';
import { withRetry } from './withRetry';
import { buildContactBody } from './buildContactBody';
import { RdContactResponse, RdLeadPayload } from './types';

export async function updateContact(contactId: string, payload: RdLeadPayload, token: string): Promise<RdContactResponse> {
  const body = buildContactBody(payload);
  const url = `${RD_API_BASE}/crm/v2/contacts/${contactId}`;
  console.log('[RD] updateContact payload', { contactId, body });
  const { data } = await callWithLog('update_contact', { contactId, ...body }, () =>
    withRetry(() => axios.put(url, body, { headers: authHeaders(token) }))
  );
  const contact = (data as any)?.data ?? data;
  console.log('[RD] updateContact result', (contact as any)?.id ?? (contact as any)?.uuid);
  return contact;
}
