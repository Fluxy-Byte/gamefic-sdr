import axios from 'axios';
import { RD_API_BASE } from './constants';
import { callWithLog } from './callWithLog';
import { authHeaders } from './authHeaders';
import { withRetry } from './withRetry';
import { RdDealResponse, RdLeadPayload } from './types';

export async function createDeal(
  contactId: string,
  payload: RdLeadPayload,
  token: string,
  pipelineId: string,
  stageId: string,
  ownerId?: string
): Promise<RdDealResponse> {
  const url = `${RD_API_BASE}/crm/v2/deals`;

  console.log('[RD] createDeal input', {
    contactId,
    pipelineId,
    stageId,
    ownerId,
    name: payload.dealName ?? payload.name ?? payload.email,
    amount: payload.amount,
    rating: payload.rating,
    expected_close_date: payload.expectedCloseDate,
    custom_fields: payload.customFields
  });

  const deal: Record<string, unknown> = {
    name: payload.dealName ?? payload.name ?? payload.email,
    contact_ids: [contactId],
    pipeline_id: pipelineId,
    stage_id: stageId,
    status: payload.status ?? 'ongoing',
    amount: payload.amount,
    rating: payload.rating,
    expected_close_date: payload.expectedCloseDate
  };

  if (ownerId) {
    deal.owner_id = ownerId;
  }

  if (payload.customFields) {
    deal.custom_fields = payload.customFields;
  }

  const body = { data: deal };

  console.log('[RD] createDeal payload', body);
  const { data } = await callWithLog('create_deal', body, () =>
    withRetry(() => axios.post(url, body, { headers: authHeaders(token) }))
  );
  const created = (data as any)?.data ?? data;
  console.log(
    '[RD] createDeal result',
    (created as any)?.id ?? (created as any)?.uuid,
    'contact_id',
    (created as any)?.contact_id ?? (created as any)?.contact_ids
  );
  return created;
}
