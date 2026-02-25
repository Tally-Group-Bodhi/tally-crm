// ────────────────────────────────────────────────────────────────────────────
// CRM Module — TypeScript Interfaces
// ────────────────────────────────────────────────────────────────────────────

/** Case types */
export type CaseType =
  | "Complaint"
  | "Enquiry"
  | "EWR"
  | "Onboarding"
  | "Dunning";

export type CasePriority = "Critical" | "High" | "Medium" | "Low";

export type CaseStatus =
  | "New"
  | "In Progress"
  | "Pending"
  | "Resolved"
  | "Closed";

export type SLAStatus = "On Track" | "At Risk" | "Breached";

export type AccountType = "Residential" | "Commercial" | "Industrial";

export type EnergyType = "Electricity" | "Gas" | "Dual Fuel";

// ── Site ───────────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
}

// ── Org (parent company) ──────────────────────────────────────────────────

export type OrgType = "Parent Company" | "Subsidiary" | "Division";

export interface Org {
  id: string;
  name: string;
  type?: OrgType;
  address?: string;
  abnAcn?: string;
}

// ── Account ─────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  orgId: string;
  name: string;
  accountNumber: string;
  type: AccountType;
  status: "Active" | "Suspended" | "Closed";
  sites: Site[];
  nmis: string[];
  energyType: EnergyType;
  primaryContact: Contact;
  contacts: Contact[];
  address: string;
  annualConsumption: string;
  accountBalance: string;
  lastPaymentDate: string;
  lastPaymentAmount: string;
  contractEndDate: string;
  /** Optional: other account IDs this account is linked to (e.g. shared sites, consolidated billing). */
  linkedAccountIds?: string[];
  /** Optional: legal or business name (display in context panel). */
  legalBusinessName?: string;
  /** Optional: parent account ID for link (context panel). */
  parentAccountId?: string;
  /** Optional: parent account display name. */
  parentAccountName?: string;
  /** Optional: customer type label (e.g. QLD Retail Customer). */
  customerType?: string;
  /** Optional: account status label (e.g. Billing) — distinct from status (Active/Suspended/Closed). */
  accountStatus?: string;
  /** Optional: whether the account is closed. */
  isClosed?: boolean;
  /** Optional: account sync status (e.g. synced). */
  accountSyncStatus?: boolean;
  /** Optional: consolidate to parent. */
  consolidateToParent?: boolean;
  /** Optional: is direct debit. */
  isDirectDebit?: boolean;
  /** Optional: terms (e.g. contract or tariff code). */
  terms?: string;
  /** Optional: service reference number. */
  serviceReferenceNumber?: string;
  /** Optional: life support registered. */
  lifeSupport?: boolean;
}

// ── Contact ─────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  /** Optional fields for contact info page */
  createDate?: string;
  preferredChannels?: string;
  favoriteContentTopics?: string;
  leadStatus?: string;
  lifecycleStage?: string;
  lastActivityDate?: string;
}

// ── Case ────────────────────────────────────────────────────────────────────

export interface CaseItem {
  id: string;
  caseNumber: string;
  accountId: string;
  accountName: string;
  type: CaseType;
  subType: string;
  status: CaseStatus;
  priority: CasePriority;
  slaStatus: SLAStatus;
  slaDeadline: string;
  slaTimeRemaining: string;
  owner: string;
  team: string;
  createdDate: string;
  updatedDate: string;
  description: string;
  resolution: string;
  communications: Communication[];
  activities: Activity[];
  attachments: Attachment[];
  relatedCases: string[];
  /** Parent case ID (self-referential) — set when this case was spawned from a closed parent */
  parentCaseId?: string;
  /** Parent case number for display (avoids extra lookup) */
  parentCaseNumber?: string;
  /** Child case IDs spawned from this case (e.g. post-closure replies) */
  childCaseIds?: string[];
  /** When status is Pending, reason for pending (used for Kanban filter) */
  pendingReason?: "Customer" | "3rd Party" | "On Hold";
  /** Edit log: previous description values when description is updated (saved with updatedAt) */
  descriptionHistory?: { description: string; updatedAt: string }[];
}

// ── Communication ───────────────────────────────────────────────────────────

export interface Communication {
  id: string;
  type: "Email" | "Phone" | "Note" | "System";
  direction: "Inbound" | "Outbound" | "Internal";
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  attachments: Attachment[];
  /** User who logged this communication (e.g. for "Logged Call by X") */
  loggedBy?: string;
  /** Email thread identifier for grouping related emails across cases */
  threadId?: string;
  /** Source case ID — used when merging communications across parent/child cases */
  sourceCaseId?: string;
  /** Source case number — display label when viewing cross-case communications */
  sourceCaseNumber?: string;
}

// ── Activity ────────────────────────────────────────────────────────────────

export interface Activity {
  id: string;
  type:
    | "Status Change"
    | "Assignment"
    | "Comment"
    | "Attachment"
    | "SLA Update"
    | "Created"
    | "Email Sent"
    | "Email Received"
    | "Note Added"
    | "Call Logged";
  description: string;
  user: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

// ── Attachment ───────────────────────────────────────────────────────────────

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  /** Server path for uploaded files (relative to uploads root); used for download */
  storagePath?: string;
}

// ── Pipeline / Opportunity ──────────────────────────────────────────────────

export type PipelineStage =
  | "Leads"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  accountName: string;
  stage: PipelineStage;
  value: number;
  probability: number;
  owner: string;
  expectedCloseDate: string;
  createdDate: string;
  updatedDate: string;
  description: string;
  competition: string;
  energyType: EnergyType;
  annualVolume: string;
  contractTerm: string;
  contacts: Contact[];
  activities: Activity[];
  attachments: Attachment[];
  docuSignStatus: "Not Started" | "Sent" | "Viewed" | "Signed" | "Completed";
  linkedQuotes: Quote[];
}

export interface Quote {
  id: string;
  name: string;
  value: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
  createdDate: string;
  expiryDate: string;
}

// ── Dashboard KPIs ──────────────────────────────────────────────────────────

export interface DashboardKPI {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
}
