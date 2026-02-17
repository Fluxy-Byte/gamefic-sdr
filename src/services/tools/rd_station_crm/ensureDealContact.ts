import axios from 'axios';
import { RD_API_BASE } from './constants';
import { callWithLog } from './callWithLog';
import { authHeaders } from './authHeaders';
import { withRetry } from './withRetry';
import { RdDealResponse } from './types';

export async function ensureDealContact(
  dealId: string,
  contactId: string,
  token: string
): Promise<RdDealResponse> {
  const url = `${RD_API_BASE}/crm/v2/deals/${dealId}`;
  const body = { data: { contact_ids: [contactId] } };
  console.log('[RD] ensureDealContact payload', body);
  const { data } = await callWithLog('ensure_deal_contact', { dealId, ...body }, () =>
    withRetry(() => axios.put(url, body, { headers: authHeaders(token) }))
  );
  const updated = (data as any)?.data ?? data;
  console.log(
    '[RD] ensureDealContact result',
    (updated as any)?.id ?? dealId,
    'contact_id',
    (updated as any)?.contact_id ?? (updated as any)?.contact_ids
  );
  return updated;
}
