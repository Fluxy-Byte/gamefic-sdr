export type LegalBasisStatus = 'granted' | 'revoked' | 'denied' | string;

export type LegalBasisCategory = 'communications' | 'personalization' | 'sales' | string;

export type LegalBasisType = 'consent' | 'contract' | 'legitimate_interest' | string;

export interface RdLeadPayload {
  email: string;
  name?: string;
  phone?: string;
  companyName?: string;
  jobTitle?: string;
  tags?: string[];
  dealName?: string;
  amount?: number;
  pipelineId?: string;
  stageId?: string;
  ownerId?: string;
  customFields?: Record<string, unknown>;
  legalBases?: Array<{
    category: LegalBasisCategory;
    type: LegalBasisType;
    status: LegalBasisStatus;
  }>;
  status?: 'ongoing' | 'won' | 'lost';
  rating?: number; // 1-3 (pontos de qualificação do RD)
  expectedCloseDate?: string; // YYYY-MM-DD
}

export interface RdContactResponse {
  id?: string;
  uuid?: string;
  [key: string]: unknown;
}

export interface RdDealResponse {
  uuid?: string;
  id?: string | number;
  [key: string]: unknown;
}

export interface RdTokenResponse {
  access_token?: string;
  token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: string | number;
  [key: string]: unknown;
}

export interface RdCrmResponse {
  status?: boolean;
  data?: RdTokenResponse;
}
