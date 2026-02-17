import axios from 'axios';
import { addDays } from './addDays';
import { createContact } from './createContact';
import { createDeal } from './createDeal';
import { ensureDealContact } from './ensureDealContact';
import { fetchContactByEmail } from './fetchContactByEmail';
import { formatDate } from './formatDate';
import { getToken } from './getToken';
import { updateContact } from './updateContact';
import { RdContactResponse, RdDealResponse, RdLeadPayload } from './types';

export async function createLeadInRdMarketing(payload: RdLeadPayload) {
  const token = await getToken();
  const pipelineId = payload.pipelineId ?? process.env.RD_PIPELINE_ID;
  const stageId = payload.stageId ?? process.env.RD_STAGE_ID;
  const ownerId = payload.ownerId ?? process.env.RD_OWNER_ID;

  const isValidId = (value?: string) => {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return !['id_da_pipeline', 'id_do_stage', 'pipeline_id', 'stage_id', 'undefined', 'null'].includes(normalized);
  };

  const shouldCreateDeal = isValidId(pipelineId) && isValidId(stageId);

  // Defaults para melhorar o card do negócio
  const enrichedPayload: RdLeadPayload = { ...payload };

  console.log('[RD] incoming payload', payload);

  if (enrichedPayload.rating == null) {
    const urg = (payload as any).urgenciaLead ?? (payload as any).urgencia;
    enrichedPayload.rating = urg === 'alta' ? 3 : urg === 'media' ? 2 : 1;
  }

  if (!enrichedPayload.expectedCloseDate) {
    enrichedPayload.expectedCloseDate = formatDate(addDays(new Date(), 14));
  }

  try {
    let contact: RdContactResponse | null = null;

    // Look up by email; create if missing, update if already exists
    contact = await fetchContactByEmail(enrichedPayload.email, token);

    if (!contact) {
      contact = await createContact(enrichedPayload, token);
    } else if (contact.id || contact.uuid) {
      const contactId = (contact as any).id ?? (contact as any).uuid;
      contact = await updateContact(contactId, enrichedPayload, token);
    }

    if (!contact) {
      throw new Error('RD Station nao retornou contato (criacao ou busca falhou).');
    }

    const contactId = (contact as any).id ?? (contact as any).uuid;

    if (!contactId) {
      throw new Error('RD Station nao retornou identificador do contato.');
    }

    let deal: RdDealResponse | null = null;

    if (shouldCreateDeal) {
      deal = await createDeal(contactId, enrichedPayload, token, pipelineId as string, stageId as string, ownerId);

      // Se por algum motivo o contato não veio associado, força a associação
      const dealId = (deal as any)?.id ?? (deal as any)?.uuid;
      const hasContact =
        (deal as any)?.contact_id === contactId ||
        ((deal as any)?.contact_ids ?? []).includes(contactId);

      if (dealId && !hasContact) {
        deal = await ensureDealContact(dealId as string, contactId, token);
      }
    }

    return {
      success: true,
      contact,
      deal
    };
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        }
      : (error as Error).message;

    console.error('[RD_STATION_LEAD_ERROR]', JSON.stringify(message, null, 2));

    return {
      success: false,
      error: message
    };
  }
}
