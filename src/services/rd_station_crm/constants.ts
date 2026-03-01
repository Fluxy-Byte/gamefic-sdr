export const RD_API_BASE = process.env.RD_API_BASE ?? 'https://api.rd.services';
export const RDCRM_API_BASE = (process.env.RDCRM_API_BASE ?? 'https://fluxe-orquestrador.egnehl.easypanel.host').replace(/\/$/, '');
export const RD_REDIRECT_URI = process.env.RD_REDIRECT_URI ?? 'https://fluxytechnologies.com.br';
export const RDCRM_TOKEN_NAME = process.env.RDCRM_TOKEN_NAME;
export const RDCRM_TOKEN_URL =
  process.env.RDCRM_TOKEN_URL ?? `${RDCRM_API_BASE}/api/v1/rdcrm`;

export const RETRYABLE_STATUS = [500, 502, 503, 504];
