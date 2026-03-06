"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/Button/Button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { mockAccounts, mockOrgs } from "@/lib/mock-data/accounts";
import { CASE_TYPE_GROUPS, CASE_GROUP_TO_TYPE, CASE_TYPE_TO_GROUP } from "@/lib/mock-data/case-types";
import { useCaseClassification } from "@/lib/case-classification-context";
import { generateCaseNumber } from "@/lib/case-number";
import type { CaseItem, CasePriority, CaseStatus, CaseType } from "@/types/crm";

const CASE_PRIORITIES: CasePriority[] = ["Critical", "High", "Medium", "Low"];

const priorityColors: Record<CasePriority, string> = {
  Critical: "bg-[#C40000]",
  High: "bg-[#C53B00]",
  Medium: "bg-yellow-500",
  Low: "bg-gray-400",
};

const CASE_ORIGINS = ["Phone", "Email", "Web", "Chat", "Social Media"] as const;

const originIcons: Record<(typeof CASE_ORIGINS)[number], string> = {
  Phone: "phone",
  Email: "mail",
  Web: "language",
  Chat: "chat",
  "Social Media": "share",
};

const OWNER_OPTIONS = ["John Smith", "Daniel Cooper", "Unassigned"];
/** Default to logged-in user; in this app that's John Smith (could come from auth/session later) */
const DEFAULT_OWNER = "John Smith";

/** SLA policy options for New Case (aligned with Settings > SLA Policies). */
const SLA_OPTIONS = [
  "Complaint — Resolution",
  "Complaint — Acknowledgement",
  "Life Support — Acknowledgement",
  "General Enquiry — Resolution",
  "EWR — Initial Response",
  "General Enquiry — Acknowledgement",
];
const CASE_STATUSES: CaseStatus[] = ["New", "In Progress", "Pending", "Resolved", "Closed"];

const statusColors: Record<CaseStatus, string> = {
  New: "bg-blue-500",
  "In Progress": "bg-[#0074C4]",
  Pending: "bg-[#C53B00]",
  Resolved: "bg-[#008000]",
  Closed: "bg-gray-400",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface NewCaseModalProps {
  onClose: () => void;
  onCreate: (newCase: CaseItem) => void;
  caseCount: number;
  /** When set (e.g. when using DB), submit creates the case via API and passes the returned case to onCreate */
  createViaApi?: (caseData: CaseItem) => Promise<CaseItem | null>;
  /** When provided, 3 recent cases for the selected org are shown in Case Information */
  cases?: CaseItem[];
}

/** Parse DD/MM/YYYY (en-AU) to timestamp for sorting */
function parseCreatedDate(s: string): number {
  const parts = s.trim().split("/");
  if (parts.length !== 3) return 0;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function NewCaseModal({ onClose, onCreate, caseCount, createViaApi, cases: allCases = [] }: NewCaseModalProps) {
  const caseClassification = useCaseClassification();
  const groupNames = React.useMemo(
    () => (caseClassification ? caseClassification.groups.map((g) => g.name) : Object.keys(CASE_TYPE_GROUPS)),
    [caseClassification]
  );
  const getTypeLabelsForGroup = React.useCallback(
    (groupName: string) => {
      if (caseClassification) return caseClassification.getTypeLabelsByGroupName(groupName);
      return CASE_TYPE_GROUPS[groupName] ?? [];
    },
    [caseClassification]
  );
  const getCaseClassForGroup = React.useCallback(
    (groupName: string) => {
      if (caseClassification) return caseClassification.getCaseClassByGroupName(groupName);
      return (CASE_GROUP_TO_TYPE[groupName] ?? "Enquiry") as CaseType;
    },
    [caseClassification]
  );
  const getGroupNameForType = React.useCallback(
    (typeName: string) => {
      if (caseClassification) {
        const g = caseClassification.groups.find((x) => x.types.some((t) => t.label === typeName));
        return g?.name ?? "";
      }
      return CASE_TYPE_TO_GROUP[typeName] ?? "";
    },
    [caseClassification]
  );

  const [contactName, setContactName] = React.useState("");
  const [contactId, setContactId] = React.useState("");
  const [accountId, setAccountId] = React.useState("");
  const [webEmail, setWebEmail] = React.useState("");
  const [status, setStatus] = React.useState<CaseStatus>("New");
  const [caseOrigin, setCaseOrigin] = React.useState("");
  const [caseGroup, setCaseGroup] = React.useState("");
  const [caseType, setCaseType] = React.useState("");
  const [priority, setPriority] = React.useState<CasePriority>("Medium");
  const [slaPolicy, setSlaPolicy] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [owner, setOwner] = React.useState(DEFAULT_OWNER);
  const [caseDocumentationFiles, setCaseDocumentationFiles] = React.useState<File[]>([]);
  const caseDocInputRef = React.useRef<HTMLInputElement>(null);

  const [orgId, setOrgId] = React.useState("");
  const [orgSearch, setOrgSearch] = React.useState("");
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);
  const orgInputRef = React.useRef<HTMLInputElement>(null);
  const orgContainerRef = React.useRef<HTMLDivElement>(null);

  const filteredOrgs = React.useMemo(() => {
    if (!orgSearch) return mockOrgs;
    const q = orgSearch.toLowerCase();
    return mockOrgs.filter((o) => o.name.toLowerCase().includes(q));
  }, [orgSearch]);

  const selectedOrg = mockOrgs.find((o) => o.id === orgId);

  const [accountSearch, setAccountSearch] = React.useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = React.useState(false);
  const accountInputRef = React.useRef<HTMLInputElement>(null);
  const accountContainerRef = React.useRef<HTMLDivElement>(null);

  const filteredAccounts = React.useMemo(() => {
    let list = mockAccounts;
    if (orgId) list = list.filter((a) => a.orgId === orgId);
    if (!accountSearch) return list;
    const q = accountSearch.toLowerCase();
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q)
    );
  }, [orgId, accountSearch]);

  const selectedAccount = mockAccounts.find((a) => a.id === accountId);

  const availableContacts = React.useMemo(() => {
    if (!accountId) return [];
    const acc = mockAccounts.find((a) => a.id === accountId);
    return acc?.contacts ?? [];
  }, [accountId]);

  const recentCasesForOrg = React.useMemo(() => {
    if (!orgId || allCases.length === 0) return [];
    const accountIdsForOrg = new Set(mockAccounts.filter((a) => a.orgId === orgId).map((a) => a.id));
    return allCases
      .filter((c) => accountIdsForOrg.has(c.accountId))
      .sort((a, b) => parseCreatedDate(b.createdDate) - parseCreatedDate(a.createdDate))
      .slice(0, 3);
  }, [orgId, allCases]);

  const [contactDropdownOpen, setContactDropdownOpen] = React.useState(false);
  const contactDropdownRef = React.useRef<HTMLDivElement>(null);

  const [emailDropdownOpen, setEmailDropdownOpen] = React.useState(false);
  const emailDropdownRef = React.useRef<HTMLDivElement>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(false);
  const statusDropdownRef = React.useRef<HTMLDivElement>(null);
  const [originDropdownOpen, setOriginDropdownOpen] = React.useState(false);
  const originDropdownRef = React.useRef<HTMLDivElement>(null);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = React.useState(false);
  const priorityDropdownRef = React.useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        orgContainerRef.current &&
        !orgContainerRef.current.contains(e.target as Node)
      ) {
        setOrgDropdownOpen(false);
      }
      if (
        accountContainerRef.current &&
        !accountContainerRef.current.contains(e.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
      if (
        contactDropdownRef.current &&
        !contactDropdownRef.current.contains(e.target as Node)
      ) {
        setContactDropdownOpen(false);
      }
      if (
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(e.target as Node)
      ) {
        setEmailDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        originDropdownRef.current &&
        !originDropdownRef.current.contains(e.target as Node)
      ) {
        setOriginDropdownOpen(false);
      }
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(e.target as Node)
      ) {
        setPriorityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveAndNewRef = React.useRef(false);

  const resetForm = () => {
    setContactName("");
    setContactId("");
    setAccountId("");
    setOrgId("");
    setAccountSearch("");
    setOrgSearch("");
    setWebEmail("");
    setStatus("New");
    setCaseOrigin("");
    setCaseGroup("");
    setCaseType("");
    setPriority("Medium");
    setSlaPolicy("");
    setSubject("");
    setDescription("");
    setOwner(DEFAULT_OWNER);
    setCaseDocumentationFiles([]);
  };

  const buildCase = (): CaseItem => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return {
      id: `case-${String(caseCount + 1).padStart(3, "0")}`,
      caseNumber: generateCaseNumber(selectedAccount?.name ?? "Unknown Account", caseCount + 1847),
      accountId: accountId || "acc-001",
      accountName: selectedAccount?.name ?? "Unknown Account",
      type: (getCaseClassForGroup(caseGroup) || (caseType && getCaseClassForGroup(getGroupNameForType(caseType))) || "Enquiry") as CaseType,
      subType: caseType || "General Enquiry",
      status,
      priority,
      slaStatus: "On Track",
      slaDeadline: "",
      slaTimeRemaining: "4d 0h",
      ...(slaPolicy && { slaPolicy }),
      owner,
      team: "Large Market Support",
      createdDate: dateStr,
      updatedDate: dateStr,
      description,
      resolution: "",
      communications: [],
      activities: [],
      attachments: caseDocumentationFiles.map((file, i) => ({
        id: `att-${Date.now()}-${i}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: formatFileSize(file.size),
        uploadedBy: owner,
        uploadedDate: new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "2-digit", year: "numeric" }),
      })),
      relatedCases: [],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (caseOrigin === "Phone") {
      if (!caseType.trim()) {
        setSubmitError("Case Type is required for Phone cases.");
        return;
      }
    }
    const built = buildCase();
    if (createViaApi) {
      setSubmitting(true);
      createViaApi(built)
        .then((created) => {
          if (created) {
            onCreate(created);
            if (!saveAndNewRef.current) onClose();
            else {
              resetForm();
              saveAndNewRef.current = false;
            }
          } else {
            setSubmitError("Failed to create case. Please try again.");
          }
        })
        .catch(() => {
          setSubmitError("Failed to create case. Check that the database is configured and try again.");
        })
        .finally(() => setSubmitting(false));
    } else {
      onCreate(built);
      if (saveAndNewRef.current) {
        resetForm();
        saveAndNewRef.current = false;
      } else {
        onClose();
      }
    }
  };

  const formInput =
    "h-10 w-full rounded-density-md border border-border bg-white px-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const formLabel = "text-sm font-medium text-gray-900 dark:text-gray-100";
  const sectionHeading =
    "col-span-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400";
  const sectionHeadingWithDivider =
    "col-span-2 pt-4 pb-1.5 mt-1 border-b border-border mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:border-gray-700 dark:text-gray-400";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-case-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 dark:border-gray-700">
          <h2
            id="new-case-modal-title"
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            New Case
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className={sectionHeadingWithDivider}>Case Information</div>

              <div className="relative space-y-1.5" ref={orgContainerRef}>
                <label className={formLabel}>Org name</label>
                <div className="relative">
                  <input
                    ref={orgInputRef}
                    type="text"
                    className={formInput}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={selectedOrg ? selectedOrg.name : orgSearch}
                    onChange={(e) => {
                      setOrgId("");
                      setOrgSearch(e.target.value);
                      setOrgDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (selectedOrg) {
                        setOrgSearch(selectedOrg.name);
                        setOrgId("");
                      }
                      setOrgDropdownOpen(true);
                    }}
                    placeholder="Search orgs..."
                  />
                  <Icon
                    name="search"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {orgDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {filteredOrgs.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No orgs found
                      </div>
                    ) : (
                      filteredOrgs.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setOrgId(o.id);
                            setOrgSearch("");
                            setAccountId("");
                            setAccountSearch("");
                            setContactId("");
                            setContactName("");
                            setWebEmail("");
                            setOrgDropdownOpen(false);
                          }}
                        >
                          <Icon name="business" size={14} className="text-muted-foreground" />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{o.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative space-y-1.5" ref={accountContainerRef}>
                <label className={formLabel}>
                  Account Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={accountInputRef}
                    type="text"
                    className={formInput}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={selectedAccount ? selectedAccount.name : accountSearch}
                    onChange={(e) => {
                      setAccountId("");
                      setAccountSearch(e.target.value);
                      setAccountDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (selectedAccount) {
                        setAccountSearch(selectedAccount.name);
                        setAccountId("");
                      }
                      setAccountDropdownOpen(true);
                    }}
                    placeholder="Search Accounts..."
                    required
                  />
                  <Icon
                    name="search"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
                {accountDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {filteredAccounts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No accounts found
                      </div>
                    ) : (
                      filteredAccounts.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setAccountId(a.id);
                            setAccountSearch("");
                            setOrgId(a.orgId);
                            setOrgSearch("");
                            setContactId("");
                            setContactName("");
                            setWebEmail("");
                            setAccountDropdownOpen(false);
                          }}
                        >
                          <Icon name="domain" size={14} className="text-muted-foreground" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{a.accountNumber}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative space-y-1.5" ref={contactDropdownRef}>
                <label className={formLabel}>Contact Name</label>
                <div className="relative">
                  <button
                    type="button"
                    className={cn(formInput, "flex items-center justify-between text-left cursor-pointer")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setContactDropdownOpen((o) => !o)}
                  >
                    <span className={!contactName ? "text-muted-foreground" : ""}>
                      {contactName || "Select contact"}
                    </span>
                    <Icon name="expand_more" size={16} className="text-muted-foreground shrink-0" />
                  </button>
                </div>
                {contactDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {availableContacts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {accountId ? "No contacts for this account" : "Select an account first"}
                      </div>
                    ) : (
                      availableContacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setContactId(c.id);
                            setContactName(c.name);
                            setWebEmail(c.email);
                            setContactDropdownOpen(false);
                          }}
                        >
                          <Icon name="person" size={14} className="text-muted-foreground" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="relative space-y-1.5" ref={emailDropdownRef}>
                <label className={formLabel}>Email</label>
                <div className="relative">
                  <button
                    type="button"
                    className={cn(formInput, "flex items-center justify-between text-left cursor-pointer")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setEmailDropdownOpen((o) => !o)}
                  >
                    <span className={!webEmail ? "text-muted-foreground" : ""}>
                      {webEmail || "Select email"}
                    </span>
                    <Icon name="expand_more" size={16} className="text-muted-foreground shrink-0" />
                  </button>
                </div>
                {emailDropdownOpen && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {availableContacts.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {accountId ? "No contacts for this account" : "Select an account first"}
                      </div>
                    ) : (
                      availableContacts.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setContactId(c.id);
                            setContactName(c.name);
                            setWebEmail(c.email);
                            setEmailDropdownOpen(false);
                          }}
                        >
                          <Icon name="mail" size={14} className="text-muted-foreground" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className={formLabel}>Case Owner</label>
                <div className="relative">
                  <select
                    className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  >
                    {OWNER_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              {orgId && (
                <div className="col-span-2 space-y-1.5">
                  <label className={formLabel}>Recent cases for this org</label>
                  <ul className="rounded-md border border-border bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30">
                    {recentCasesForOrg.length === 0 ? (
                      <li className="px-3 py-2.5 text-sm text-muted-foreground">
                        No recent cases for this organisation
                      </li>
                    ) : (
                      recentCasesForOrg.map((c) => (
                        <li key={c.id} className="border-b border-border last:border-b-0 dark:border-gray-700">
                          <Link
                            href={`/crm/cases/${c.id}`}
                            className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="font-medium text-[#2C365D] dark:text-[#7B9FD0]">{c.caseNumber}</span>
                            <span className="truncate text-muted-foreground max-w-[200px]" title={c.description}>
                              {c.description ? `${c.description.slice(0, 50)}${c.description.length > 50 ? "…" : ""}` : c.subType}
                            </span>
                            <span className="shrink-0 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                              {c.createdDate}
                            </span>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}

              <div className={sectionHeadingWithDivider}>Additional Information</div>

              <div className="relative space-y-1" ref={statusDropdownRef}>
                <label className={formLabel}>Status <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    className={cn(formInput, "flex cursor-pointer items-center gap-2 text-left")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setStatusDropdownOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={statusDropdownOpen}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", statusColors[status])} />
                    <span>{status}</span>
                    <Icon
                      name="expand_more"
                      size={16}
                      className="ml-auto text-muted-foreground shrink-0"
                    />
                  </button>
                  {statusDropdownOpen && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                      role="listbox"
                    >
                      {CASE_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="option"
                          aria-selected={status === s}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setStatus(s);
                            setStatusDropdownOpen(false);
                          }}
                        >
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", statusColors[s])} />
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="relative space-y-1" ref={originDropdownRef}>
                <label className={formLabel}>Source <span className="text-red-500">*</span></label>
                <div className="relative">
                  <button
                    type="button"
                    className={cn(formInput, "flex cursor-pointer items-center gap-2 text-left")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setOriginDropdownOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={originDropdownOpen}
                  >
                    {caseOrigin ? (
                      <>
                        <Icon name={originIcons[caseOrigin as (typeof CASE_ORIGINS)[number]]} size={16} className="text-muted-foreground shrink-0" />
                        <span>{caseOrigin}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">--None--</span>
                    )}
                    <Icon
                      name="expand_more"
                      size={16}
                      className="ml-auto text-muted-foreground shrink-0"
                    />
                  </button>
                  {originDropdownOpen && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                      role="listbox"
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!caseOrigin}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                        onClick={() => {
                          setCaseOrigin("");
                          setOriginDropdownOpen(false);
                        }}
                      >
                        <span className="w-4 shrink-0" aria-hidden />
                        <span>--None--</span>
                      </button>
                      {CASE_ORIGINS.map((o) => (
                        <button
                          key={o}
                          type="button"
                          role="option"
                          aria-selected={caseOrigin === o}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setCaseOrigin(o);
                            setOriginDropdownOpen(false);
                          }}
                        >
                          <Icon name={originIcons[o]} size={16} className="text-muted-foreground shrink-0" />
                          <span>{o}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className={formLabel}>Case Group</label>
                <div className="relative">
                  <select
                    className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={caseGroup}
                    onChange={(e) => {
                      const nextGroup = e.target.value;
                      setCaseGroup(nextGroup);
                      const typesInGroup = getTypeLabelsForGroup(nextGroup);
                      if (caseType && !typesInGroup.includes(caseType)) {
                        setCaseType("");
                      }
                    }}
                  >
                    <option value="">--Select case group--</option>
                    {groupNames.map((groupName) => (
                      <option key={groupName} value={groupName}>
                        {groupName}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={formLabel}>
                  Case Type{caseOrigin === "Phone" && <span className="text-red-500"> *</span>}
                </label>
                <div className="relative">
                  <select
                    className={cn(
                      formInput,
                      "cursor-pointer appearance-none pr-9",
                      !caseGroup && "cursor-not-allowed opacity-60"
                    )}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={caseType}
                    disabled={!caseGroup}
                    onChange={(e) => setCaseType(e.target.value)}
                  >
                    <option value="">
                      {caseGroup ? "--Select case type--" : "Select case group first"}
                    </option>
                    {getTypeLabelsForGroup(caseGroup).map((typeName) => (
                      <option key={typeName} value={typeName}>
                        {typeName}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              <div className="relative space-y-1" ref={priorityDropdownRef}>
                <label className={formLabel}>Priority</label>
                <div className="relative">
                  <button
                    type="button"
                    className={cn(formInput, "flex cursor-pointer items-center gap-2 text-left")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    onClick={() => setPriorityDropdownOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={priorityDropdownOpen}
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityColors[priority])} />
                    <span>{priority}</span>
                    <Icon
                      name="expand_more"
                      size={16}
                      className="ml-auto text-muted-foreground shrink-0"
                    />
                  </button>
                  {priorityDropdownOpen && (
                    <div
                      className="absolute left-0 top-full z-10 mt-1 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                      role="listbox"
                    >
                      {CASE_PRIORITIES.map((p) => (
                        <button
                          key={p}
                          type="button"
                          role="option"
                          aria-selected={priority === p}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => {
                            setPriority(p);
                            setPriorityDropdownOpen(false);
                          }}
                        >
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityColors[p])} />
                          <span>{p}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className={formLabel}>SLA</label>
                <div className="relative">
                  <select
                    className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={slaPolicy}
                    onChange={(e) => setSlaPolicy(e.target.value)}
                  >
                    <option value="">--Select SLA--</option>
                    {SLA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className={formLabel}>Case Documentation</label>
                <input
                  ref={caseDocInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const chosen = e.target.files;
                    if (chosen?.length) {
                      setCaseDocumentationFiles((prev) => [...prev, ...Array.from(chosen)]);
                      e.target.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => caseDocInputRef.current?.click()}
                  className={cn(
                    formInput,
                    "flex cursor-pointer items-center gap-2 border-dashed text-left text-muted-foreground hover:border-[#2C365D] hover:bg-gray-50/50 hover:text-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-gray-300"
                  )}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  <Icon name="upload" size={20} className="shrink-0" />
                  <span>Choose files from device</span>
                </button>
                {caseDocumentationFiles.length > 0 && (
                  <ul className="mt-2 space-y-1.5 rounded-md border border-border bg-gray-50/50 py-2 px-3 dark:border-gray-700 dark:bg-gray-800/30">
                    {caseDocumentationFiles.map((file, index) => (
                      <li
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="truncate text-gray-700 dark:text-gray-300" title={file.name}>
                          {file.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setCaseDocumentationFiles((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                          aria-label={`Remove ${file.name}`}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className={sectionHeadingWithDivider}>Description</div>

              <div className="col-span-2 space-y-1.5">
                <label className={formLabel}>Subject</label>
                <input
                  type="text"
                  className={formInput}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of the case"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className={formLabel}>Description</label>
                <textarea
                  className={cn(formInput, "h-24 resize-none py-2")}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the case..."
                />
              </div>
            </div>
          </div>

          {submitError && (
            <p className="px-6 py-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {submitError}
            </p>
          )}
          <div className="flex justify-end gap-3 border-t border-border px-6 py-3 dark:border-gray-700">
            <Button variant="outline" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="outline"
              size="md"
              type="submit"
              disabled={submitting}
              onClick={() => {
                saveAndNewRef.current = true;
              }}
            >
              Save &amp; New
            </Button>
            <Button
              size="md"
              type="submit"
              disabled={submitting}
              onClick={() => {
                saveAndNewRef.current = false;
              }}
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
