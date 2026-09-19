import type { Timestamp } from 'firebase/firestore';

export type AppTab = 'donasi' | 'donatur' | 'admin';

export type DonationStatus = 'pending' | 'verified';

export type PaymentMethod = 'JP Post' | 'Yakesma' | 'Dompet Dhuafa' | 'Tunai' | string;

export interface DonationRecord {
  id: string;
  campaignId?: string;
  name: string;
  email?: string;
  amount: number;
  date: string;
  status: DonationStatus;
  loc?: string;
  phone?: string;
  isAnonymous?: boolean;
  proofUrl?: string;
  package?: string;
  paymentMethod?: PaymentMethod;
  remarks?: string;
  originalCurrency?: 'JPY' | 'IDR';
  originalAmount?: number;
}

export type EditableDonationRecord = Omit<DonationRecord, 'amount'> & {
  amount: number | string;
};

export const ZISWAF_CATEGORIES = [
  'Wakaf',
  'Sedekah',
  'Infaq',
  'Zakat',
  'Kemanusiaan',
  'Operasional & Dakwah',
  'Donasi Umum',
] as const;

export type ZiswafCategory = typeof ZISWAF_CATEGORIES[number] | string;

export type CampaignStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface CampaignDocument {
  id: string;
  title: string;
  shortName: string;
  status: CampaignStatus;
  category?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  order?: number;
  totalNeed: number;
  renovationNeed?: number;
  baseVerified: number;
  showDonaturTab: boolean;
  isClosed?: boolean;
  jpyToIdrRate?: number;
  spreadsheetId?: string;
  publicConfig?: Partial<PublicConfig>;
  totalVerifiedAmount: number;
  totalPendingAmount: number;
  lastUpdate: Timestamp | null;
  donationDeadline: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type CampaignSummary = Pick<
  CampaignDocument,
  'id' | 'title' | 'shortName' | 'status' | 'category' | 'imageUrl' | 'isFeatured' | 'order' | 'totalNeed' | 'baseVerified' | 'totalVerifiedAmount' | 'totalPendingAmount' | 'donationDeadline' | 'publicConfig'
>;

export interface GlobalStats {
  totalNeed: number;
  renovationNeed: number;
  baseVerified: number;
  showDonaturTab: boolean;
  isClosed?: boolean;
  jpyToIdrRate?: number;
  category?: string;
  imageUrl?: string;
  spreadsheetId?: string;
  publicConfig?: Partial<PublicConfig>;
  totalVerifiedAmount: number;
  totalPendingAmount: number;
  lastUpdate: Timestamp | null;
  donationDeadline: Timestamp | null;
}

export interface PublicLogo {
  src: string;
  alt: string;
  height?: number;
}

export interface DonationPackageConfig {
  id: string;
  label: string;
  priceJPY?: number;
  priceLabel: string;
  subtext?: string;
  badge?: string;
  min?: number;
  max?: number;
}

export interface BankAccountConfig {
  id: string;
  label: string;
  account: string;
  name: string;
  paymentMethod?: string;
}

export interface BankConfig {
  JP: BankAccountConfig[];
  ID: BankAccountConfig[];
}

export interface ContactLinksConfig {
  WHATSAPP: string;
  INSTAGRAM: string;
  EMAIL: string;
}

export interface CampaignPhaseConfig {
  id: string;
  label: string;
  shortLabel: string;
  targetJPY: number;
  shortfallLabel: string;
  completedLabel?: string;
  completedDate?: string;
  completionAnnouncement?: string;
  subtext?: string;
}

export interface ContactPersonConfig {
  id: string;
  name: string;
  region: string;
  phone: string;
  href?: string;
}

export interface PublicConfig {
  masjidName: string;
  shortName: string;
  campaignTitle: string;
  locationText: string;
  footerCredit: string;
  donorListTitle: string;
  donorListSubtitleDate: string;
  wakafHadith: string;
  cashPaymentText: string;
  donationClosedTitle: string;
  donationClosedText: string;
  category?: string;
  imageUrl?: string;
  programmeScopeTitle?: string;
  programmeScopeDescription?: string;
  logos: PublicLogo[];
  phases: CampaignPhaseConfig[];
  packages: DonationPackageConfig[];
  banks: BankConfig;
  contactLinks: ContactLinksConfig;
  uniqueCode: number;
  showNarahubung?: boolean;
  narahubung?: ContactPersonConfig[];
}

export type PhaseProgress = CampaignPhaseConfig & {
  index: number;
  previousTarget: number;
  funds: number;
  verifiedFunds: number;
  percentage: number;
  verifiedPercentage: number;
  pendingPercentage: number;
  shortfall: number;
  isComplete: boolean;
};
