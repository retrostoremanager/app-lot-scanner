// Mirrors retrostoremanager/lot-scanner's specs/001-lot-scan-review/contracts/lot-scan-api.md

export type ItemState = 'pending' | 'accepted' | 'corrected' | 'excluded' | 'unidentified';
export type SessionStatus = 'processing' | 'in_review' | 'confirmed' | 'discarded' | 'failed';

export interface ScannedItem {
  itemId: string;
  state: ItemState;
  suggestedTitle: string | null;
  suggestedPlatform: string | null;
  suggestedVariant: string | null;
  suggestedPrice: number | null;
  confidence: number | null;
  finalCatalogGameId: string | null;
  finalTitle: string | null;
  finalPlatform: string | null;
  finalVariant: string | null;
  finalPrice: number | null;
  manuallyEntered: boolean;
}

export interface LotScanSession {
  sessionId: string;
  status: SessionStatus;
  errorMessage: string | null;
  items: ScannedItem[];
}

export interface CreateScanResponse {
  sessionId: string;
  status: SessionStatus;
}

export interface PatchItemRequest {
  state?: ItemState;
  finalCatalogGameId?: string | null;
  finalTitle?: string | null;
  finalPlatform?: string | null;
  finalVariant?: string | null;
  finalPrice?: number | null;
}

export interface ConfirmResponse {
  sessionId: string;
  status: SessionStatus;
  confirmedAt: string;
  items: ScannedItem[];
}

export interface DiscardResponse {
  sessionId: string;
  status: SessionStatus;
}

export interface CatalogCandidate {
  gameId: number;
  title: string;
  system: string | null;
  variant: string | null;
  looseMedianCents: number | null;
  completeMedianCents: number | null;
}

// Low-confidence visual threshold -- matches fn-lot-scanner's AnthropicOptions default
// (research.md #6). Tunable without a spec/plan change.
export const LOW_CONFIDENCE_THRESHOLD = 0.7;
