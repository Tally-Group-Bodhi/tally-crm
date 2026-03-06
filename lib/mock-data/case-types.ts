import type { CaseType } from "@/types/crm";

/**
 * Case types by group (CI Energy Retailer case types).
 * Used for the multi-level Case Type dropdown in New Case.
 */
export const CASE_TYPE_GROUPS: Record<string, string[]> = {
  "Billing & Invoicing": [
    "Invoice dispute - usage",
    "Invoice dispute - pricing/tariff",
    "Invoice dispute - pass-through charges",
    "Missing invoice",
    "Estimated read challenge",
    "Back-bill investigation",
    "Rebill request",
    "Credit note / adjustment request",
    "Tax / GST query",
    "Invoice delivery / eInvoicing issue",
    "Payment allocation issue",
    "Statement / account balance query",
  ],
  "Metering & Data Issues": [
    "Missing interval data",
    "Interval data correction request",
    "Data substitution / estimation correction",
    "Interval file rejection (MDFF)",
    "Meter fault investigation",
    "Meter test / accuracy test",
    "Meter change coordination",
    "CT/VT ratio error",
    "Multiplier / register configuration issue",
    "NMI/MIRN standing data correction",
    "Settlement-ready data issue",
  ],
  "Move-In / Move-Out & Account Changes": [
    "Site onboarding",
    "Move-in (supply start)",
    "Move-out (supply end)",
    "Change of tenancy",
    "Change of legal entity",
    "Site closure",
    "De-energisation request",
    "Re-energisation request",
    "Retailer transfer issue (churn)",
    "Market transfer objection",
    "Portfolio / multi-site maintenance",
  ],
  "Contract & Pricing": [
    "Contract variation request",
    "Renewal negotiation support",
    "Market offer vs contract mismatch",
    "Pricing error investigation",
    "Tariff mapping error",
    "Indexation / CPI application",
    "Pass-through configuration issue",
    "Load reforecast request",
    "Hedging discrepancy",
    "Demand charges query",
  ],
  "Credit & Collections": [
    "Payment extension request",
    "Payment plan request",
    "Security deposit review",
    "Bank guarantee processing",
    "Credit limit breach",
    "Collections hold / dispute hold",
    "Dishonour / failed payment",
    "Insolvency monitoring",
    "Settlement / write-off request",
  ],
  "Market & Compliance": [
    "MSATS standing data issue",
    "B2B transaction issue",
    "Market transfer objection",
    "Settlement reconciliation discrepancy",
    "Regulator complaint (AER/ESC)",
    "Energy ombudsman complaint",
    "Life support registration",
    "Audit / compliance evidence request",
  ],
  "Operational / Service Orders": [
    "Special read request",
    "Service order status query",
    "Energisation request",
    "Disconnection warning issued",
    "Disconnection request",
    "Reconnection request",
    "Embedded network coordination",
    "Demand reset request",
    "Site access / appointment scheduling",
  ],
  "Complex Investigation / Root Cause": [
    "System pricing defect",
    "Tariff/rate configuration defect",
    "MDFF ingestion failure",
    "Settlement under/over recovery",
    "Network tariff update not applied",
    "Bulk impact incident (multiple customers)",
    "Root cause analysis (RCA)",
  ],
  "Relationship / Account Management": [
    "Executive escalation",
    "Quarterly review action tracking",
    "Sustainability / ESG data request",
    "GreenPower / LGC query",
    "Load optimisation advisory",
    "Key account service issue",
  ],
};

/** Ordered list of group names for the dropdown */
export const CASE_GROUP_NAMES = Object.keys(CASE_TYPE_GROUPS);

/** Map Case Type (string) -> Case Group, for looking up group from selected type */
export const CASE_TYPE_TO_GROUP: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [group, types] of Object.entries(CASE_TYPE_GROUPS)) {
    for (const t of types) out[t] = group;
  }
  return out;
})();

/** Map Case Group -> high-level CaseType for API */
export const CASE_GROUP_TO_TYPE: Record<string, CaseType> = {
  "Billing & Invoicing": "Enquiry",
  "Metering & Data Issues": "Enquiry",
  "Move-In / Move-Out & Account Changes": "Onboarding",
  "Contract & Pricing": "Enquiry",
  "Credit & Collections": "Dunning",
  "Market & Compliance": "Complaint",
  "Operational / Service Orders": "Enquiry",
  "Complex Investigation / Root Cause": "Enquiry",
  "Relationship / Account Management": "Enquiry",
};

/** One type within a group (label only) */
export interface CaseTypeInGroup {
  label: string;
}

/** Shape for editable case group (used by Case Classification context and Settings) */
export interface CaseGroupItem {
  id: string;
  name: string;
  types: CaseTypeInGroup[];
  caseClass: CaseType;
}

/** Build initial case groups array from static CASE_TYPE_GROUPS / CASE_GROUP_TO_TYPE */
export function getInitialCaseGroups(): CaseGroupItem[] {
  return Object.keys(CASE_TYPE_GROUPS).map((name, index) => {
    const labels = CASE_TYPE_GROUPS[name] ?? [];
    return {
      id: `cg-${index + 1}`,
      name,
      types: labels.map((label) => ({ label })),
      caseClass: CASE_GROUP_TO_TYPE[name] ?? "Enquiry",
    };
  });
}
