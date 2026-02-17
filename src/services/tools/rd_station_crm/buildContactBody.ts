import { RdLeadPayload } from './types';

export function buildContactBody(payload: RdLeadPayload) {
  const contact: Record<string, unknown> = {
    name: payload.name ?? payload.email,
    job_title: payload.jobTitle,
    emails: [{ email: payload.email }]
  };

  if (payload.phone) {
    contact.phones = [{ phone: payload.phone, type: 'mobile' }];
  }

  if (payload.customFields) {
    contact.custom_fields = payload.customFields;
  }

  if (payload.legalBases?.length) {
    contact.legal_bases = payload.legalBases;
  }

  return { data: contact };
}
