export type ReconciliationStatus = 'clean' | 'expl' | 'brk';
export type FeedStatus = 'live' | 'stale' | 'manual';

export interface BankAccount {
  id: string;
  entity: string;
  project: string;
  bank: string;
  accountNumber: string;
  feed: FeedStatus;
  bankBalance: number;
  statementBalance: number;
  reconciliationDate: string;
  bookBalance: number;
  variance: number;
  status: ReconciliationStatus;
  fundsInTransit: number;
}

export interface AccountGroup {
  entity: string;
  project: string;
  accounts: BankAccount[];
}


// alert.model.ts

/**
 * The raw alert shape returned by the backend API (after decryption).
 */
export interface AlertApiResponse {
  Id: string;
  Kind: AlertKind;
  Headline: string;
  Detail: string;
  Meta: string;
  AccountId: string;
  RaisedAt: string;        // ISO date string
  Acknowledged: boolean;
}

/**
 * Alert categories as returned by the API.
 */
export type AlertKind = 'break' | 'feed' | 'control' | 'info';

/**
 * UI display types that drive styling in the template.
 */
export type AlertDisplayType = 'break' | 'warn' | 'info';

/**
 * The mapped, view-ready alert used by the component template.
 */
export interface Alert {
  id: string;
  type: AlertDisplayType;
  kind: AlertKind;
  title: string;
  description: string;
  meta: string;
  accountId: string;
  raisedAt: string;
  acknowledged: boolean;
}

/**
 * Optional: filter chip definition for the toolbar.
 */
export interface AlertFilter {
  label: string;
  value: AlertKind | 'all';
  count?: number;
}