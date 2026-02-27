"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import SLAIndicator from "@/components/crm/SLAIndicator";
import StatusProgressBar from "@/components/crm/StatusProgressBar";
import CommunicationTimeline from "@/components/crm/CommunicationTimeline";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import DocumentAttachments from "@/components/crm/DocumentAttachments";
import CloseCaseModal from "@/components/crm/CloseCaseModal";
import NotePanel from "@/components/crm/NotePanel";
import CallLogPanel from "@/components/crm/CallLogPanel";
import EmailPanel from "@/components/crm/EmailPanel";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog/Dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog/AlertDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu/DropdownMenu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/Popover/Popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/Sheet/Sheet";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Table/Table";
import { getCaseByCaseNumber, getCaseById } from "@/lib/mock-data/cases";
import { getAccountById, getOrgById, getAccountsByOrgId } from "@/lib/mock-data/accounts";
import type { Account, Activity, CaseItem, CasePriority, CaseStatus, Communication, Contact } from "@/types/crm";

const priorityVariant: Record<CasePriority, "error" | "warning" | "info" | "outline" | "yellow"> = {
  Critical: "error",
  High: "warning",
  Medium: "yellow",
  Low: "outline",
};

function RelatedCaseStatusBadge({ status }: { status: CaseStatus }) {
  const config: Record<
    string,
    { variant: "default" | "info" | "warning" | "success" | "outline"; dot?: string }
  > = {
    New: { variant: "outline", dot: "bg-blue-500" },
    "In Progress": { variant: "info" },
    Pending: { variant: "warning" },
    Resolved: { variant: "success" },
    Closed: { variant: "default" },
  };
  const c = config[status] ?? config["New"];
  return (
    <Badge variant={c.variant} className="gap-1">
      {c.dot && <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c.dot)} />}
      {status}
    </Badge>
  );
}

const STATUS_ICONS: Record<CaseStatus, string> = {
  New: "add_circle",
  "In Progress": "pending",
  Pending: "hourglass_top",
  Resolved: "task_alt",
  Closed: "check_circle",
};

const VISIBLE_CONTACTS_LIMIT = 10;

function DataField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span
        className="font-medium uppercase tracking-wide text-muted-foreground"
        style={{ fontSize: "var(--tally-font-size-xs)" }}
      >
        {label}
      </span>
      <span
        className="text-gray-900 dark:text-gray-100"
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/* ─── Scrollable case tabs ──────────────────────────────────────────── */

interface CaseDetailContentProps {
  caseItem: CaseItem;
  account: Account;
  showBreadcrumbs?: boolean;
  /** When true, show an "Open in full page" control next to Assign (e.g. in tab view) */
  showOpenInFullPage?: boolean;
  /** When set, used for Related tab and allows linking (from overrides store) */
  relatedCaseNumbers?: string[];
  /** Callback to open the link-case modal */
  onOpenLinkModal?: () => void;
  /** Callback to open the note panel */
  onOpenNotePanel?: () => void;
  /** Callback to open the call log panel */
  onOpenCallLogPanel?: () => void;
  /** Callback to open the email panel */
  onOpenEmailPanel?: () => void;
  /** When set (e.g. DB mode), updates are persisted via API */
  onUpdateCase?: (payload: Partial<CaseItem>) => void | Promise<void>;
  /** When set (e.g. DB mode), show Delete button and call this on confirm */
  onDeleteCase?: () => void | Promise<void>;
  /** When set (e.g. DB mode), resolve related case numbers to CaseItem for links */
  relatedCasesMap?: Map<string, CaseItem>;
  /** Note panel open state (controlled by parent) */
  notePanelOpen?: boolean;
  /** Close the note panel */
  onCloseNotePanel?: () => void;
  /** Call log panel open state (controlled by parent) */
  callLogPanelOpen?: boolean;
  /** Close the call log panel */
  onCloseCallLogPanel?: () => void;
  /** Email panel open state (controlled by parent) */
  emailPanelOpen?: boolean;
  /** Close the email panel */
  onCloseEmailPanel?: () => void;
  /** When set (e.g. tab view), note/call/email panels are portaled into this container */
  portalContainerRef?: React.RefObject<HTMLElement | null>;
}

export default function CaseDetailContent({
  caseItem,
  account,
  showBreadcrumbs = true,
  showOpenInFullPage = false,
  relatedCaseNumbers: relatedCaseNumbersProp,
  onOpenLinkModal,
  onOpenNotePanel,
  onOpenCallLogPanel,
  onOpenEmailPanel,
  onUpdateCase,
  onDeleteCase,
  relatedCasesMap,
  notePanelOpen = false,
  onCloseNotePanel,
  callLogPanelOpen = false,
  onCloseCallLogPanel,
  emailPanelOpen = false,
  onCloseEmailPanel,
  portalContainerRef,
}: CaseDetailContentProps) {
  const handleNotePanelOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onCloseNotePanel?.();
    },
    [onCloseNotePanel]
  );
  const handleCallLogPanelOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onCloseCallLogPanel?.();
    },
    [onCloseCallLogPanel]
  );
  const handleEmailPanelOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) onCloseEmailPanel?.();
    },
    [onCloseEmailPanel]
  );
  const resolveCase = React.useCallback(
    (caseNum: string) => relatedCasesMap?.get(caseNum) ?? getCaseByCaseNumber(caseNum),
    [relatedCasesMap]
  );
  const relatedCaseNumbers = relatedCaseNumbersProp ?? caseItem.relatedCases;
  const [activeTab, setActiveTab] = React.useState("request");
  const [updating, setUpdating] = React.useState(false);
  const [communicationsExpandedIds, setCommunicationsExpandedIds] = React.useState<Set<string>>(new Set());
  const [communicationsSearchQuery, setCommunicationsSearchQuery] = React.useState("");
  type CommFilterTab = "all" | "notes" | "emails" | "calls";
  const [communicationsFilterTab, setCommunicationsFilterTab] = React.useState<CommFilterTab>("all");
  const [closeCaseModalOpen, setCloseCaseModalOpen] = React.useState(false);
  const [assignPopoverOpen, setAssignPopoverOpen] = React.useState(false);
  const [pendingStatusChange, setPendingStatusChange] = React.useState<CaseStatus | null>(null);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  const [expandedContactId, setExpandedContactId] = React.useState<string | null>(null);
  const [contactsEditMode, setContactsEditMode] = React.useState(false);
  const [localContacts, setLocalContacts] = React.useState<Contact[]>(() => account.contacts);
  const [addContactOpen, setAddContactOpen] = React.useState(false);
  const [editingContactId, setEditingContactId] = React.useState<string | null>(null);
  const [contactEditDraft, setContactEditDraft] = React.useState<Contact | null>(null);
  const [relatedCasesEditMode, setRelatedCasesEditMode] = React.useState(false);
  const [localRelatedCaseNumbers, setLocalRelatedCaseNumbers] = React.useState<string[]>(() => relatedCaseNumbers);
  const [contactToRemove, setContactToRemove] = React.useState<Contact | null>(null);
  const [relatedCaseToRemove, setRelatedCaseToRemove] = React.useState<string | null>(null);
  const [contactsViewAllOpen, setContactsViewAllOpen] = React.useState(false);
  const expandedContactRef = React.useRef<HTMLDivElement>(null);
  const [isEditingDescription, setIsEditingDescription] = React.useState(false);
  const [draftDescription, setDraftDescription] = React.useState("");
  const [showFullThread, setShowFullThread] = React.useState(true);

  React.useEffect(() => {
    setLocalContacts(account.contacts);
  }, [account.contacts, account.id]);

  React.useEffect(() => {
    if (expandedContactId && expandedContactRef.current) {
      expandedContactRef.current.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [expandedContactId]);

  React.useEffect(() => {
    setLocalRelatedCaseNumbers(relatedCaseNumbers);
  }, [relatedCaseNumbers, caseItem.id]);

  const linkedCases = React.useMemo(() => {
    const cases: CaseItem[] = [];
    if (caseItem.parentCaseId && caseItem.parentCaseNumber) {
      const parent = resolveCase(caseItem.parentCaseNumber);
      if (parent) cases.push(parent);
    }
    if (caseItem.childCaseIds) {
      for (const childId of caseItem.childCaseIds) {
        if (cases.some((c) => c.id === childId)) continue;
        if (relatedCasesMap) {
          for (const c of relatedCasesMap.values()) {
            if (c.id === childId) { cases.push(c); break; }
          }
        }
        if (!cases.some((c) => c.id === childId)) {
          const found = getCaseById(childId);
          if (found) cases.push(found);
        }
      }
    }
    return cases;
  }, [caseItem.parentCaseId, caseItem.parentCaseNumber, caseItem.childCaseIds, relatedCasesMap, resolveCase]);

  const hasLinkedComms = linkedCases.some((c) => c.communications.length > 0);

  const mergedCommunications = React.useMemo<Communication[]>(() => {
    const thisComms: Communication[] = caseItem.communications.map((c) => ({
      ...c,
      sourceCaseId: c.sourceCaseId ?? caseItem.id,
      sourceCaseNumber: c.sourceCaseNumber ?? caseItem.caseNumber,
    }));

    if (!showFullThread || linkedCases.length === 0) return thisComms;

    const linkedComms: Communication[] = linkedCases.flatMap((linked) =>
      linked.communications.map((c) => ({
        ...c,
        sourceCaseId: c.sourceCaseId ?? linked.id,
        sourceCaseNumber: c.sourceCaseNumber ?? linked.caseNumber,
      }))
    );

    const seen = new Set(thisComms.map((c) => c.id));
    const deduped = linkedComms.filter((c) => !seen.has(c.id));

    return [...thisComms, ...deduped];
  }, [caseItem.communications, caseItem.id, caseItem.caseNumber, showFullThread, linkedCases]);

  const commCounts = React.useMemo(() => {
    let notes = 0, emails = 0, calls = 0;
    for (const c of mergedCommunications) {
      if (c.type === "Note") notes++;
      else if (c.type === "Email") emails++;
      else if (c.type === "Phone") calls++;
    }
    return { all: mergedCommunications.length, notes, emails, calls };
  }, [mergedCommunications]);

  const filteredCommunications = React.useMemo(() => {
    let list = mergedCommunications;
    if (communicationsFilterTab !== "all") {
      const typeByTab: Record<Exclude<CommFilterTab, "all">, Communication["type"]> = {
        notes: "Note",
        emails: "Email",
        calls: "Phone",
      };
      const tabType = typeByTab[communicationsFilterTab];
      list = list.filter((c) => c.type === tabType);
    }
    if (communicationsSearchQuery.trim()) {
      const q = communicationsSearchQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.body.toLowerCase().includes(q) ||
          c.from.toLowerCase().includes(q) ||
          c.to.toLowerCase().includes(q)
      );
    }
    return list;
  }, [
    mergedCommunications,
    communicationsFilterTab,
    communicationsSearchQuery,
  ]);

  const CURRENT_USER = "John Smith";
  const TEAM_MEMBERS = ["John Smith", "Daniel Cooper"];
  const isUnassigned = caseItem.owner === "Unassigned";

  const handleAssign = React.useCallback(
    (assignee: string) => {
      if (!onUpdateCase) return;
      setAssignPopoverOpen(false);
      setUpdating(true);
      const now = new Date();
      const timestamp = now.toLocaleString("en-AU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const assignActivity: Activity = {
        id: `act-assign-${Date.now()}`,
        type: "Assignment",
        description: `Case assigned to ${assignee}`,
        user: CURRENT_USER,
        timestamp,
      };
      const payload: Partial<CaseItem> = {
        owner: assignee,
        activities: [assignActivity, ...(caseItem.activities ?? [])],
      };
      if (caseItem.status === "New") {
        payload.status = "In Progress";
      }
      Promise.resolve(onUpdateCase(payload)).finally(() => setUpdating(false));
    },
    [onUpdateCase, caseItem.activities, caseItem.status]
  );

  return (
    <div className="min-w-0 w-full p-density-xl">
      <div className="mx-auto w-full min-w-0 max-w-[1400px]">
      {showBreadcrumbs && (
        <>
          <Link
            href="/crm/cases"
            className="mb-density-sm flex w-fit items-center gap-1.5 text-muted-foreground transition-colors hover:text-gray-900 dark:hover:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            <Icon name="arrow_back" size={18} className="shrink-0" />
            <span>Back</span>
          </Link>
          <nav
            className="mb-density-md flex items-center gap-1.5 text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            <Link href="/crm/cases" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Cases
            </Link>
            <Icon name="chevron_right" size={14} />
            <span
              className="font-medium text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {caseItem.caseNumber}
            </span>
          </nav>
        </>
      )}

      {/* Header */}
      <div className="mb-density-sm">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1
                className="font-bold text-gray-900 dark:text-gray-100"
                style={{
                  fontSize: "var(--tally-font-size-xl)",
                  lineHeight: "var(--tally-line-height-tight)",
                }}
              >
                {caseItem.caseNumber}
              </h1>
              <Badge
                variant={priorityVariant[caseItem.priority]}
                style={{ fontSize: "var(--tally-font-size-xs)" }}
              >
                {caseItem.priority}
              </Badge>
              <Badge
                variant="outline"
                style={{ fontSize: "var(--tally-font-size-xs)" }}
              >
                {caseItem.type}
              </Badge>
              {caseItem.parentCaseNumber && (
                <Link
                  href={`/crm/cases/${caseItem.parentCaseId}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[#006180]/20 bg-[#006180]/5 px-2 py-0.5 text-[#006180] transition-colors hover:bg-[#006180]/10 dark:border-[#0091BF]/25 dark:bg-[#0091BF]/10 dark:text-[#80E0FF] dark:hover:bg-[#0091BF]/20"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  <Icon name="subdirectory_arrow_right" size={13} className="shrink-0" />
                  <span>Parent: {caseItem.parentCaseNumber}</span>
                </Link>
              )}
            </div>
            <p
              className="mt-1 text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {caseItem.subType} · {caseItem.accountName}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <Button
              variant="outline"
              size="md"
              className="gap-1.5"
              onClick={() => window.open("https://tallysolutions.com", "_blank")}
            >
              <svg width="12" height="16" viewBox="0 0 12 27" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                <path d="M0 1.49839C0 0.67085 0.656 0 1.465 0H9.646C10.455 0 11.111 0.67085 11.111 1.49839V2.48323L6.392 5.75386C5.944 6.06377 5.678 6.57326 5.678 7.11734C5.678 7.66141 5.944 8.1709 6.392 8.48081L11.111 11.7514V14.283L6.392 17.5537C5.944 17.8636 5.678 18.3731 5.678 18.9171C5.678 19.4612 5.944 19.9707 6.392 20.2806L11.111 23.5512V24.7234C11.111 25.5509 10.455 26.2218 9.646 26.2218H1.465C0.656 26.2218 0 25.5509 0 24.7234V1.49839Z" fill="#00C1FF"/>
              </svg>
              Open Billing
            </Button>
            <Popover open={assignPopoverOpen} onOpenChange={setAssignPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="md" className="gap-1.5" disabled={!onUpdateCase || updating}>
                  <Icon name="person_add" size="var(--tally-icon-size-sm)" />
                  {isUnassigned ? "Assign" : "Reassign"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[220px] p-1">
                <button
                  type="button"
                  onClick={() => handleAssign(CURRENT_USER)}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm font-medium text-[#006180] hover:bg-[#E6F7FF] dark:text-[#80E0FF] dark:hover:bg-[#006180]/20"
                >
                  <Icon name="person" size={16} className="shrink-0" />
                  Assign to me
                </button>
                <div className="my-1 border-t border-border dark:border-gray-700" />
                <p className="px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Team members</p>
                {TEAM_MEMBERS.filter((m) => m !== caseItem.owner).map((member) => (
                  <button
                    key={member}
                    type="button"
                    onClick={() => handleAssign(member)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800",
                      member === CURRENT_USER && "font-medium"
                    )}
                  >
                    <Icon name="person" size={16} className="shrink-0 text-muted-foreground" />
                    {member}
                    {member === CURRENT_USER && <span className="ml-auto text-xs text-muted-foreground">(you)</span>}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="md"
              className="gap-1.5"
              onClick={() => setCloseCaseModalOpen(true)}
            >
              <Icon name="lock" size="var(--tally-icon-size-sm)" />
              Close Case
            </Button>
            {showOpenInFullPage && (
              <Link
                href={`/crm/cases/${caseItem.id}`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                aria-label="Open case in full page"
                title="Open in full page"
              >
                <Icon name="open_in_new" size={20} />
              </Link>
            )}
          </div>
        </div>

        {/* Status bar and SLA */}
        <div className="mt-4 flex min-w-0 flex-col items-stretch justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900 xl:flex-row xl:items-center">
          <StatusProgressBar
            currentStatus={caseItem.status}
            className="min-w-0 w-full flex-1 xl:min-w-0"
            onStatusChange={
              onUpdateCase
                ? (newStatus) => {
                    if (newStatus === "Closed") {
                      setCloseCaseModalOpen(true);
                    } else {
                      setPendingStatusChange(newStatus);
                    }
                  }
                : undefined
            }
          />
          <div className="flex w-full shrink-0 items-center justify-end gap-4 border-t border-border pt-4 dark:border-gray-700 xl:w-auto xl:justify-end xl:border-t-0 xl:border-l xl:pt-0 xl:pl-4">
            <div className="text-right">
              <p
                className="font-medium uppercase tracking-wide text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-xs)" }}
              >
                SLA Deadline
              </p>
              <p
                className="font-medium text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                {caseItem.slaDeadline}
              </p>
            </div>
            <SLAIndicator
              status={caseItem.slaStatus}
              timeRemaining={caseItem.slaTimeRemaining}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} variant="inline">
        <TabsList className="mb-4 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="request" style={{ fontSize: "var(--tally-font-size-sm)" }}>
            Request Information
          </TabsTrigger>
          <TabsTrigger value="communications" style={{ fontSize: "var(--tally-font-size-sm)" }}>
            Communications ({caseItem.communications.length})
          </TabsTrigger>
          <TabsTrigger value="related" style={{ fontSize: "var(--tally-font-size-sm)" }}>
            Related
          </TabsTrigger>
          <TabsTrigger value="history" style={{ fontSize: "var(--tally-font-size-sm)" }}>
            History ({caseItem.activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="mt-0 w-full">
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3
                className="mb-4 font-bold text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Case Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Case Number" value={caseItem.caseNumber} />
                <DataField label="Type" value={caseItem.type} />
                <DataField label="Sub-Type" value={caseItem.subType} />
                <DataField
                  label="Priority"
                  value={
                    <Badge
                      variant={priorityVariant[caseItem.priority]}
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      {caseItem.priority}
                    </Badge>
                  }
                />
                <DataField label="Status" value={caseItem.status} />
                <DataField label="SLA Status" value={<SLAIndicator status={caseItem.slaStatus} />} />
                <DataField label="Created" value={caseItem.createdDate} />
                <DataField label="Last Updated" value={caseItem.updatedDate} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3
                className="mb-4 font-bold text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Assignment
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DataField label="Owner" value={caseItem.owner} />
                <DataField label="Team" value={caseItem.team} />
                <DataField label="SLA Deadline" value={caseItem.slaDeadline} />
                <DataField
                  label="Time Remaining"
                  value={
                    <span
                      className={cn(
                        "font-medium",
                        caseItem.slaStatus === "Breached" && "text-[#C40000]",
                        caseItem.slaStatus === "At Risk" && "text-[#C53B00]"
                      )}
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {caseItem.slaTimeRemaining}
                    </span>
                  }
                />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Description
                </h3>
                <div className="flex shrink-0 items-baseline gap-2">
                  {onUpdateCase && !isEditingDescription && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftDescription(caseItem.description);
                          setIsEditingDescription(true);
                        }}
                        className="inline-flex items-baseline underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8] leading-none py-0"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                        title="Edit description"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {onUpdateCase && isEditingDescription && (
                    <div className="flex items-baseline gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDescription(false);
                          setDraftDescription("");
                        }}
                        className="inline-flex items-baseline underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8] leading-none py-0"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                        title="Cancel editing"
                      >
                        Cancel
                      </button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const prevDescription = caseItem.description;
                          const newDescription = draftDescription.trim() || prevDescription;
                          const changed = newDescription !== prevDescription;
                          const nextHistory = changed
                            ? [
                                ...(caseItem.descriptionHistory ?? []),
                                { description: prevDescription, updatedAt: new Date().toISOString() },
                              ]
                            : (caseItem.descriptionHistory ?? []);
                          const descriptionActivity: Activity | undefined = changed
                            ? {
                                id: `act-desc-${Date.now()}`,
                                type: "Comment",
                                description: "Description updated",
                                user: caseItem.owner,
                                timestamp: new Date().toLocaleString("en-AU", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }),
                              }
                            : undefined;
                          Promise.resolve(
                            onUpdateCase({
                              description: newDescription,
                              ...(changed && { descriptionHistory: nextHistory }),
                              ...(descriptionActivity && {
                                activities: [descriptionActivity, ...(caseItem.activities ?? [])],
                              }),
                            })
                          ).then(() => {
                            setIsEditingDescription(false);
                            setDraftDescription("");
                          });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {isEditingDescription ? (
                <textarea
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  className="w-full min-h-[120px] rounded-density-md border border-border bg-white px-3 py-2 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  style={{
                    fontSize: "var(--tally-font-size-sm)",
                    lineHeight: "var(--tally-line-height-relaxed)",
                  }}
                  placeholder="Case description..."
                  autoFocus
                />
              ) : (
                <p
                  className="leading-relaxed text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: "var(--tally-font-size-sm)",
                    lineHeight: "var(--tally-line-height-relaxed)",
                  }}
                >
                  {caseItem.description || "—"}
                </p>
              )}
            </div>
            {caseItem.resolution && (
              <div className="rounded-lg border border-[#008000]/20 bg-[#008000]/5 p-4 lg:col-span-2 dark:border-green-800/30 dark:bg-green-950/20">
                <h3
                  className="mb-3 flex items-center gap-1.5 font-bold text-[#008000]"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  <Icon name="task_alt" size={16} />
                  Resolution
                </h3>
                <p
                  className="leading-relaxed text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: "var(--tally-font-size-sm)",
                    lineHeight: "var(--tally-line-height-relaxed)",
                  }}
                >
                  {caseItem.resolution}
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="communications" className="mt-0 min-w-0 w-full overflow-hidden">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <nav
              className="inline-flex items-center gap-1.5"
              aria-label="Filter communications by type"
              role="group"
            >
              {(
                [
                  { value: "all" as const, label: "All", icon: null, count: commCounts.all },
                  { value: "notes" as const, label: "Notes", icon: "subject" as const, count: commCounts.notes },
                  { value: "emails" as const, label: "Emails", icon: "mail" as const, count: commCounts.emails },
                  { value: "calls" as const, label: "Calls", icon: "call" as const, count: commCounts.calls },
                ] satisfies { value: CommFilterTab; label: string; icon: string | null; count: number }[]
              ).map(({ value, label, icon, count }) => {
                const active = communicationsFilterTab === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCommunicationsFilterTab(value)}
                    className={cn(
                      "inline-flex items-center gap-1 font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      active
                        ? "rounded-md border border-border bg-white px-2 py-1 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        : "px-2 py-1 text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                    aria-pressed={active}
                  >
                    {icon && <Icon name={icon} size={16} className="shrink-0 text-current" />}
                    {label}
                    {count > 0 && (
                      <span
                        className={cn(
                          "inline-flex min-w-[1.25rem] items-center justify-center px-0.5 text-xs font-semibold leading-5",
                          active
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            {/* Right: Actions, Search, User, Expand All */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="inline-flex h-8 items-center gap-2 rounded-md bg-[#006180] px-3 py-0 text-sm font-medium text-white transition-colors hover:bg-[#0091BF] dark:bg-[#0091BF] dark:hover:bg-[#00C1FF]"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Actions
                  <Icon name="expand_more" size={16} className="shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem
                    onClick={() => onOpenNotePanel?.()}
                    className="gap-2 text-left"
                  >
                    <Icon name="edit" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Note</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onOpenEmailPanel?.()}
                    className="gap-2 text-left"
                  >
                    <Icon name="mail" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onOpenCallLogPanel?.()}
                    className="gap-2 text-left"
                  >
                    <Icon name="call" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Call</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="event" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Meeting</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onOpenLinkModal?.()}
                    className="gap-2 text-left"
                  >
                    <Icon name="link" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Link case</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="attach_file" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Add attachment</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="event" size={16} className="shrink-0 text-muted-foreground" />
                    <span className="whitespace-nowrap">Schedule follow-up</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="print" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Print</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="file_download" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Export</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="pin" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Send Pin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-left">
                    <Icon name="send" size={16} className="shrink-0 text-muted-foreground" />
                    <span>Send Pin Email</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="relative flex h-8 w-44 min-w-0 items-stretch md:w-52">
                <Icon
                  name="search"
                  size={16}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  placeholder="Search communications..."
                  value={communicationsSearchQuery}
                  onChange={(e) => setCommunicationsSearchQuery(e.target.value)}
                  className={cn(
                    "min-h-0 w-full rounded-md border border-border bg-white pl-8 pr-2.5 text-sm text-gray-900 placeholder:text-muted-foreground [line-height:1.25rem]",
                    "focus:outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                  )}
                  style={{ fontSize: "var(--tally-font-size-sm)", height: "2rem" }}
                  aria-label="Search communications"
                />
              </div>
              {hasLinkedComms && (
                <button
                  type="button"
                  onClick={() => setShowFullThread((v) => !v)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
                    showFullThread
                      ? "border-[#006180]/30 bg-[#006180]/10 text-[#006180] hover:bg-[#006180]/15 dark:border-[#0091BF]/30 dark:bg-[#0091BF]/15 dark:text-[#80E0FF] dark:hover:bg-[#0091BF]/20"
                      : "border-border bg-white text-muted-foreground hover:bg-gray-50 hover:text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  )}
                  aria-pressed={showFullThread}
                >
                  <Icon name="account_tree" size={14} className="shrink-0" />
                  {showFullThread ? "Hide" : "Show"} Linked Cases
                </button>
              )}
              {filteredCommunications.length > 0 && (
                <button
                  type="button"
                  title={communicationsExpandedIds.size >= filteredCommunications.length && filteredCommunications.length > 0 ? "Collapse All" : "Expand All"}
                  onClick={() => {
                    const allIds = new Set(filteredCommunications.map((c) => c.id));
                    const allExpanded = allIds.size > 0 && communicationsExpandedIds.size >= allIds.size;
                    setCommunicationsExpandedIds(allExpanded ? new Set() : allIds);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#2C365D] transition-colors hover:bg-gray-100 dark:text-[#7c8cb8] dark:hover:bg-gray-800"
                >
                  <Icon
                    name={communicationsExpandedIds.size >= filteredCommunications.length ? "unfold_less" : "unfold_more"}
                    size={18}
                  />
                </button>
              )}
            </div>
          </div>
          <CommunicationTimeline
            communications={filteredCommunications}
            expandedIds={communicationsExpandedIds}
            onExpandedIdsChange={setCommunicationsExpandedIds}
            currentCaseNumber={caseItem.caseNumber}
          />
          {filteredCommunications.length === 0 && (
            <p
              className="py-8 text-center text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {caseItem.communications.length === 0
                ? "No communications recorded for this case."
                : "No communications match your filters."}
            </p>
          )}
        </TabsContent>

        <TabsContent value="related" className="mt-0 w-full">
          <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <DocumentAttachments
                attachments={caseItem.attachments}
                caseId={onUpdateCase ? caseItem.id : undefined}
                onUpload={
                  onUpdateCase
                    ? async (files: File[]) => {
                        const formData = new FormData();
                        files.forEach((f) => formData.append("files", f));
                        const res = await fetch(
                          `/api/cases/${caseItem.id}/attachments`,
                          { method: "POST", body: formData }
                        );
                        if (!res.ok) throw new Error("Upload failed");
                        const created = (await res.json()) as typeof caseItem.attachments;
                        await onUpdateCase({
                          attachments: [...(caseItem.attachments ?? []), ...created],
                        });
                      }
                    : undefined
                }
                onRemove={
                  onUpdateCase
                    ? (attachmentId: string) => {
                        onUpdateCase({
                          attachments: (caseItem.attachments ?? []).filter(
                            (a) => a.id !== attachmentId
                          ),
                        });
                      }
                    : undefined
                }
              />
            </div>
            <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Contacts ({localContacts.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setContactsEditMode((prev) => !prev)}
                    className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                    title={contactsEditMode ? "Done editing" : "Edit contacts"}
                  >
                    {contactsEditMode ? "Cancel" : "Edit"}
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                    onClick={() => setAddContactOpen(true)}
                  >
                    <Icon name="add" size={14} />
                    Add
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div
                  className={cn(
                    "divide-y divide-border dark:divide-gray-700",
                    localContacts.length > VISIBLE_CONTACTS_LIMIT && "max-h-[22rem] overflow-y-auto"
                  )}
                >
                {localContacts.map((contact: Contact) => {
                  const isExpanded = expandedContactId === contact.id;
                  const initials = contact.name
                    .split(/\s+/)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  const org = getOrgById(account.orgId);
                  const actionItems: { icon: string; label: string }[] = [
                    { icon: "mail", label: "Email" },
                    { icon: "call", label: "Call" },
                    { icon: "task_alt", label: "Task" },
                    { icon: "event", label: "Meeting" },
                  ];
                  const detailRows: { label: string; value: React.ReactNode }[] = [
                    {
                      label: "ORG",
                      value: org ? (
                        <Link
                          href={`/crm/customer/orgs/${account.orgId}`}
                          className="text-[#2C365D] underline hover:no-underline dark:text-blue-400"
                          style={{ fontSize: "var(--tally-font-size-sm)" }}
                        >
                          {org.name}
                        </Link>
                      ) : "—",
                    },
                    { label: "ROLE", value: contact.role || "—" },
                    { label: "EMAIL", value: contact.email || "—" },
                    { label: "PHONE NUMBER", value: contact.phone || "—" },
                    { label: "PREFERRED CHANNELS", value: contact.preferredChannels ?? "—" },
                    { label: "CREATE DATE", value: contact.createDate ?? "—" },
                  ];
                  return (
                    <div
                      key={contact.id}
                      ref={isExpanded ? expandedContactRef : undefined}
                      className="py-2.5 first:pt-0"
                    >
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedContactId(isExpanded ? null : contact.id)}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C365D] text-xs font-medium text-white dark:bg-[#3d4a6e]"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className="font-medium text-gray-900 dark:text-gray-100"
                                style={{ fontSize: "var(--tally-font-size-sm)" }}
                              >
                                {contact.name}
                              </p>
                              {contact.isPrimary && (
                                <Badge
                                  variant="default"
                                  className="px-1.5 py-0"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p
                              className="text-muted-foreground"
                              style={{ fontSize: "var(--tally-font-size-xs)" }}
                            >
                              {contact.role} · {contact.email}
                            </p>
                          </div>
                          <Icon
                            name={isExpanded ? "expand_less" : "expand_more"}
                            size={20}
                            className="shrink-0 text-muted-foreground"
                          />
                        </button>
                        {contactsEditMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContactToRemove(contact);
                            }}
                            className="shrink-0 underline text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                            title="Remove contact"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {isExpanded && (
                        <div
                          className="mt-3 rounded-lg border border-border bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Actions left, Edit right */}
                          <div className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-border px-density-md py-density-sm dark:border-gray-700">
                            <div className="flex flex-row items-center gap-1">
                              {actionItems.map(({ icon, label }) => (
                                <button
                                  key={label}
                                  type="button"
                                  className="flex flex-col items-center gap-0.5 rounded-density-md py-1 text-muted-foreground transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  <Icon name={icon} size={18} />
                                  <span>{label}</span>
                                </button>
                              ))}
                            </div>
                            {editingContactId === contact.id ? (
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  className="gap-1 border-[#2C365D] bg-[#2C365D] text-white hover:bg-[#3d4a6e] dark:border-[#7c8cb8] dark:bg-[#7c8cb8] dark:hover:bg-[#8c9cc8]"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                  onClick={() => {
                                    if (contactEditDraft) {
                                      setLocalContacts((prev) =>
                                        prev.map((c) => (c.id === editingContactId ? contactEditDraft : c))
                                      );
                                    }
                                    setEditingContactId(null);
                                    setContactEditDraft(null);
                                  }}
                                >
                                  <Icon name="check" size={12} />
                                  Save
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                  onClick={() => {
                                    setEditingContactId(null);
                                    setContactEditDraft(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-[#2C365D]/40 text-[#2C365D] hover:bg-[#2C365D]/5 hover:text-[#2C365D] dark:border-blue-400/50 dark:text-blue-400 dark:hover:bg-blue-400/10 dark:hover:text-blue-400"
                                style={{ fontSize: "var(--tally-font-size-xs)" }}
                                onClick={() => {
                                  setEditingContactId(contact.id);
                                  setContactEditDraft({ ...contact });
                                }}
                              >
                                <Icon name="edit" size={12} className="shrink-0" />
                                Edit
                              </Button>
                            )}
                          </div>
                          {/* Detail rows: editable when this contact is being edited */}
                          <div>
                            {editingContactId === contact.id && contactEditDraft ? (
                              <>
                                {/* ORG read-only */}
                                <div
                                  className="flex flex-col gap-0.5 border-b border-border px-density-md py-density-sm dark:border-gray-700"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  <span
                                    className="font-semibold uppercase tracking-wider text-muted-foreground"
                                    style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                                  >
                                    ORG
                                  </span>
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {org ? (
                                      <Link
                                        href={`/crm/customer/orgs/${account.orgId}`}
                                        className="text-[#2C365D] underline hover:no-underline dark:text-blue-400"
                                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                                      >
                                        {org.name}
                                      </Link>
                                    ) : "—"}
                                  </span>
                                </div>
                                {/* Editable: Name, Role, Email, Phone, Preferred Channels, Create Date */}
                                {[
                                  { key: "name" as const, label: "NAME" },
                                  { key: "role" as const, label: "ROLE" },
                                  { key: "email" as const, label: "EMAIL" },
                                  { key: "phone" as const, label: "PHONE NUMBER" },
                                  { key: "preferredChannels" as const, label: "PREFERRED CHANNELS" },
                                  { key: "createDate" as const, label: "CREATE DATE" },
                                ].map(({ key, label }) => (
                                  <div
                                    key={key}
                                    className="flex flex-col gap-0.5 border-b border-border px-density-md py-density-sm last:border-b-0 dark:border-gray-700"
                                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                                  >
                                    <span
                                      className="font-semibold uppercase tracking-wider text-muted-foreground"
                                      style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                                    >
                                      {label}
                                    </span>
                                    <Input
                                      value={contactEditDraft[key] ?? ""}
                                      onChange={(e) =>
                                        setContactEditDraft((prev) =>
                                          prev ? { ...prev, [key]: e.target.value } : null
                                        )
                                      }
                                      className="h-8 text-sm"
                                      placeholder={key === "preferredChannels" || key === "createDate" ? "—" : ""}
                                    />
                                  </div>
                                ))}
                              </>
                            ) : (
                              detailRows.map(({ label, value }) => (
                                <div
                                  key={label}
                                  className="flex flex-col gap-0.5 border-b border-border px-density-md py-density-sm last:border-b-0 dark:border-gray-700"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  <span
                                    className="font-semibold uppercase tracking-wider text-muted-foreground"
                                    style={{ fontSize: "10px", letterSpacing: "0.08em" }}
                                  >
                                    {label}
                                  </span>
                                  <span className="text-gray-900 dark:text-gray-100">{value}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
                {localContacts.length > VISIBLE_CONTACTS_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setContactsViewAllOpen(true)}
                    className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    View All
                  </button>
                )}
              </div>

              {/* Add contact dialog */}
              <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle style={{ fontSize: "var(--tally-font-size-base)" }}>
                      Add contact
                    </DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {(() => {
                      const localIds = new Set(localContacts.map((c) => c.id));
                      const orgAccounts = getAccountsByOrgId(account.orgId);
                      const withDedup = new Map<string, Contact>();
                      orgAccounts.forEach((acc) =>
                        acc.contacts.forEach((c) => {
                          if (!localIds.has(c.id)) withDedup.set(c.id, c);
                        })
                      );
                      const available = Array.from(withDedup.values());
                      if (available.length === 0) {
                        return (
                          <p
                            className="py-4 text-center text-muted-foreground"
                            style={{ fontSize: "var(--tally-font-size-sm)" }}
                          >
                            No other contacts in this organisation to add.
                          </p>
                        );
                      }
                      return (
                        <ul className="divide-y divide-border dark:divide-gray-700">
                          {available.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLocalContacts((prev) => [...prev, c]);
                                  setAddContactOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                style={{ fontSize: "var(--tally-font-size-sm)" }}
                              >
                                <div
                                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C365D] text-xs font-medium text-white dark:bg-[#3d4a6e]"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  {c.name
                                    .split(/\s+/)
                                    .map((s) => s[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {c.name}
                                  </p>
                                  <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                    {c.role} · {c.email}
                                  </p>
                                </div>
                                <Icon name="add" size={18} className="shrink-0 text-muted-foreground" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </DialogContent>
              </Dialog>

              {/* View All contacts dialog */}
              <Dialog open={contactsViewAllOpen} onOpenChange={setContactsViewAllOpen}>
                <DialogContent
                  className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DialogHeader className="border-b border-border px-4 py-3 dark:border-gray-700">
                    <DialogTitle style={{ fontSize: "var(--tally-font-size-base)" }}>
                      All contacts ({localContacts.length})
                    </DialogTitle>
                    <DialogClose />
                  </DialogHeader>
                  <div className="min-h-0 overflow-y-auto divide-y divide-border dark:divide-gray-700">
                    {localContacts.map((c: Contact) => {
                      const initials = c.name
                        .split(/\s+/)
                        .map((s) => s[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2);
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2C365D] text-xs font-medium text-white dark:bg-[#3d4a6e]"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p
                                className="font-medium text-gray-900 dark:text-gray-100"
                                style={{ fontSize: "var(--tally-font-size-sm)" }}
                              >
                                {c.name}
                              </p>
                              {c.isPrimary && (
                                <Badge
                                  variant="default"
                                  className="px-1.5 py-0"
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  Primary
                                </Badge>
                              )}
                            </div>
                            <p
                              className="text-muted-foreground"
                              style={{ fontSize: "var(--tally-font-size-xs)" }}
                            >
                              {c.role} · {c.email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-4 lg:col-span-2">
              {/* Parent Case */}
              {caseItem.parentCaseId && caseItem.parentCaseNumber && (() => {
                const parentCase = resolveCase(caseItem.parentCaseNumber);
                return (
                  <div className="rounded-lg border border-[#006180]/20 bg-[#006180]/5 p-4 dark:border-[#0091BF]/25 dark:bg-[#0091BF]/10">
                    <h3
                      className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      <Icon name="account_tree" size={16} className="text-[#006180] dark:text-[#80E0FF]" />
                      Parent Case
                    </h3>
                    {parentCase ? (
                      <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                        <Table dense>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Case #</TableHead>
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Account</TableHead>
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Type</TableHead>
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>SLA</TableHead>
                              <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Owner</TableHead>
                              <TableHead className="w-10" style={{ fontSize: "var(--tally-font-size-xs)" }} aria-label="Open">
                                <span className="sr-only">Open</span>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <Link
                                  href={`/crm/cases/${parentCase.id}`}
                                  className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                                >
                                  {parentCase.caseNumber}
                                </Link>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {parentCase.accountName}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" style={{ fontSize: "var(--tally-font-size-xs)" }}>{parentCase.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <RelatedCaseStatusBadge status={parentCase.status} />
                              </TableCell>
                              <TableCell>
                                <SLAIndicator status={parentCase.slaStatus} timeRemaining={parentCase.slaTimeRemaining} />
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {parentCase.owner}
                              </TableCell>
                              <TableCell className="w-10">
                                <Link
                                  href={`/crm/cases/${parentCase.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                                  title="Open in new window"
                                >
                                  <Icon name="open_in_new" size={18} />
                                </Link>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                        <Link href={`/crm/cases/${caseItem.parentCaseId}`} className="font-medium text-[#006180] underline hover:no-underline dark:text-[#80E0FF]">
                          {caseItem.parentCaseNumber}
                        </Link>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Child Cases */}
              {caseItem.childCaseIds && caseItem.childCaseIds.length > 0 && (() => {
                const childCases = caseItem.childCaseIds
                  .map((id) => {
                    if (relatedCasesMap) {
                      for (const c of relatedCasesMap.values()) { if (c.id === id) return c; }
                    }
                    return null;
                  })
                  .filter((c): c is CaseItem => c != null);

                if (childCases.length === 0) return null;

                return (
                  <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                    <h3
                      className="mb-3 flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      <Icon name="subdirectory_arrow_right" size={16} className="text-muted-foreground" />
                      Child Cases ({childCases.length})
                    </h3>
                    <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                      <Table dense>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Case #</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Type</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Priority</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>SLA</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Owner</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Created</TableHead>
                            <TableHead className="w-10" style={{ fontSize: "var(--tally-font-size-xs)" }} aria-label="Open">
                              <span className="sr-only">Open</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {childCases.map((child) => (
                            <TableRow key={child.id} className="group">
                              <TableCell>
                                <Link
                                  href={`/crm/cases/${child.id}`}
                                  className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                                >
                                  {child.caseNumber}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" style={{ fontSize: "var(--tally-font-size-xs)" }}>{child.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <RelatedCaseStatusBadge status={child.status} />
                              </TableCell>
                              <TableCell>
                                <Badge variant={priorityVariant[child.priority]} style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                  {child.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <SLAIndicator status={child.slaStatus} timeRemaining={child.slaTimeRemaining} />
                              </TableCell>
                              <TableCell className="text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {child.owner}
                              </TableCell>
                              <TableCell className="text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                {child.createdDate}
                              </TableCell>
                              <TableCell className="w-10">
                                <Link
                                  href={`/crm/cases/${child.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                                  title="Open in new window"
                                >
                                  <Icon name="open_in_new" size={18} />
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })()}

              {/* Related Cases (peer links — excludes parent/child) */}
              <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3
                    className="font-bold text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    Related Cases (
                    {
                      localRelatedCaseNumbers.filter((caseNum) => {
                        const c = resolveCase(caseNum);
                        return c && getAccountById(c.accountId)?.orgId === account.orgId;
                      }).length
                    }
                    )
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRelatedCasesEditMode((prev) => !prev)}
                      className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                      title={relatedCasesEditMode ? "Done editing" : "Edit related cases"}
                    >
                      {relatedCasesEditMode ? "Cancel" : "Edit"}
                    </button>
                    {onOpenLinkModal && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={onOpenLinkModal}>
                        <Icon name="link" size={14} />
                        Link case
                      </Button>
                    )}
                  </div>
                </div>
                {(() => {
                  const relatedSameOrg = localRelatedCaseNumbers.filter((caseNum) => {
                    const c = resolveCase(caseNum);
                    return c != null && getAccountById(c.accountId)?.orgId === account.orgId;
                  });
                  return relatedSameOrg.length > 0 ? (
                    <div className="overflow-hidden rounded-density-md border border-border dark:border-gray-700">
                      <Table dense>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Case #</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Account</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Type</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Status</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Priority</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>SLA</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Owner</TableHead>
                            <TableHead style={{ fontSize: "var(--tally-font-size-xs)" }}>Created</TableHead>
                            <TableHead className="w-10" style={{ fontSize: "var(--tally-font-size-xs)" }} aria-label="Open in new window">
                              <span className="sr-only">Open in new window</span>
                            </TableHead>
                            {relatedCasesEditMode && (
                              <TableHead className="w-20" aria-label="Remove from list">
                                <span className="sr-only">Remove</span>
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {relatedSameOrg.map((caseNum) => {
                            const linkedCase = resolveCase(caseNum);
                            if (!linkedCase) return null;
                            return (
                              <TableRow key={linkedCase.id} className="group">
                                <TableCell>
                                  <Link
                                    href={`/crm/cases/${linkedCase.id}`}
                                    className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                                  >
                                    {linkedCase.caseNumber}
                                  </Link>
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {linkedCase.accountName}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                    {linkedCase.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <RelatedCaseStatusBadge status={linkedCase.status} />
                                </TableCell>
                                <TableCell>
                                  <Badge variant={priorityVariant[linkedCase.priority]} style={{ fontSize: "var(--tally-font-size-xs)" }}>
                                    {linkedCase.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <SLAIndicator
                                    status={linkedCase.slaStatus}
                                    timeRemaining={linkedCase.slaTimeRemaining}
                                  />
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {linkedCase.owner}
                                </TableCell>
                                <TableCell className="text-gray-500 dark:text-gray-400" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                                  {linkedCase.createdDate}
                                </TableCell>
                                <TableCell className="w-10">
                                  <Link
                                    href={`/crm/cases/${linkedCase.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
                                    title="Open in new window"
                                    aria-label={`Open ${linkedCase.caseNumber} in new window`}
                                  >
                                    <Icon name="open_in_new" size={18} />
                                  </Link>
                                </TableCell>
                                {relatedCasesEditMode && (
                                  <TableCell className="w-20">
                                    <button
                                      type="button"
                                      onClick={() => setRelatedCaseToRemove(linkedCase.caseNumber)}
                                      className="underline text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                                      title="Remove from related cases"
                                    >
                                      Remove
                                    </button>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p
                      className="py-4 text-center text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {onOpenLinkModal
                        ? "No related cases. Use \"Link case\" to add one from the same organisation."
                        : "No related cases in the same organisation."}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 w-full">
          <div className="w-full rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <h3
              className="mb-4 font-bold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Activity History
            </h3>
            <ActivityTimeline activities={caseItem.activities} />
            {caseItem.activities.length === 0 && (
              <p
                className="py-8 text-center text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                No activity recorded for this case.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation when changing status via the progress bar (except Closed) */}
      <Dialog
        open={pendingStatusChange !== null}
        onOpenChange={(open) => !open && setPendingStatusChange(null)}
      >
        <DialogContent className="flex max-w-sm flex-col gap-3 p-4 sm:p-5">
          <DialogHeader className="space-y-0">
            <div className="flex items-center gap-3">
              {pendingStatusChange && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#2C365D] bg-[#2C365D] text-white dark:border-[#7c8cb8] dark:bg-[#2C365D]">
                  <Icon name={STATUS_ICONS[pendingStatusChange]} size={18} />
                </div>
              )}
              <DialogTitle className="text-base leading-tight">
                Change status to {pendingStatusChange}
              </DialogTitle>
            </div>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to change the case status?
          </p>
          <DialogFooter className="gap-2 pt-0">
            <Button
              variant="outline"
              onClick={() => setPendingStatusChange(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={updating}
              className="bg-[#006180] text-white hover:bg-[#0091BF] dark:bg-[#0091BF] dark:hover:bg-[#00C1FF]"
              onClick={() => {
                if (pendingStatusChange == null || !onUpdateCase) return;
                setUpdating(true);
                Promise.resolve(onUpdateCase({ status: pendingStatusChange })).finally(
                  () => {
                    setUpdating(false);
                    setPendingStatusChange(null);
                  }
                );
              }}
            >
              {updating ? "Updating…" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CloseCaseModal
        open={closeCaseModalOpen}
        onOpenChange={setCloseCaseModalOpen}
        caseItem={caseItem}
        account={account}
        currentUserName={CURRENT_USER}
        onCloseCase={(payload) => {
          if (onUpdateCase) {
            setUpdating(true);
            Promise.resolve(
              onUpdateCase({
                status: "Closed",
                resolution: `${payload.closeReason} · ${payload.resolutionType} (Closed at ${payload.closedAt.toLocaleString()} by ${payload.closedBy})`,
              })
            ).finally(() => setUpdating(false));
          }
        }}
      />

      <NotePanel
        open={notePanelOpen}
        onOpenChange={handleNotePanelOpenChange}
        caseItem={caseItem}
        onSave={
          onUpdateCase
            ? async ({ communication, activity }) => {
                await onUpdateCase({
                  communications: [...(caseItem.communications ?? []), communication],
                  activities: [activity, ...(caseItem.activities ?? [])],
                });
              }
            : undefined
        }
        portalContainer={portalContainerRef?.current}
      />

      <CallLogPanel
        open={callLogPanelOpen}
        onOpenChange={handleCallLogPanelOpenChange}
        caseItem={caseItem}
        onSave={
          onUpdateCase
            ? async ({ communication, activity }) => {
                await onUpdateCase({
                  communications: [...(caseItem.communications ?? []), communication],
                  activities: [activity, ...(caseItem.activities ?? [])],
                });
              }
            : undefined
        }
        portalContainer={portalContainerRef?.current}
      />

      <EmailPanel
        open={emailPanelOpen}
        onOpenChange={handleEmailPanelOpenChange}
        caseItem={caseItem}
        contacts={account.contacts}
        onSave={
          onUpdateCase
            ? async ({ communication, activity }) => {
                await onUpdateCase({
                  communications: [...(caseItem.communications ?? []), communication],
                  activities: [activity, ...(caseItem.activities ?? [])],
                });
              }
            : undefined
        }
        portalContainer={portalContainerRef?.current}
      />

      {/* Contact detail sheet (Related tab) */}
      <Sheet open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 border-l border-border bg-white p-0 dark:border-gray-700 dark:bg-gray-900 sm:!max-w-[600px]"
          style={{ maxWidth: "min(600px, 100vw)" }}
        >
          {selectedContact && (() => {
            const initials = selectedContact.name
              .split(/\s+/)
              .map((s) => s[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            const org = getOrgById(account.orgId);
            const actionItems: { icon: string; label: string }[] = [
              { icon: "edit_note", label: "Note" },
              { icon: "mail", label: "Email" },
              { icon: "call", label: "Call" },
              { icon: "task_alt", label: "Task" },
              { icon: "event", label: "Meeting" },
            ];
            const detailRows: { label: string; value: React.ReactNode }[] = [
              {
                label: "ORG",
                value: org ? (
                  <Link
                    href={`/crm/customer/orgs/${account.orgId}`}
                    className="text-[#2C365D] underline hover:no-underline dark:text-blue-400"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    {org.name}
                  </Link>
                ) : "—",
              },
              { label: "ROLE", value: selectedContact.role || "—" },
              { label: "EMAIL", value: selectedContact.email || "—" },
              { label: "PHONE NUMBER", value: selectedContact.phone || "—" },
              { label: "PREFERRED CHANNELS", value: selectedContact.preferredChannels ?? "—" },
              { label: "CREATE DATE", value: selectedContact.createDate ?? "—" },
            ];
            return (
              <>
                {/* Header: avatar, name, email, Edit + close */}
                <SheetHeader className="flex flex-row items-start justify-between gap-density-md border-b border-border px-density-lg py-density-md dark:border-gray-700">
                  <div className="flex min-w-0 flex-1 gap-density-md">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2C365D] text-sm font-medium text-white dark:bg-[#3d4a6e]"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <SheetTitle
                        className="font-bold text-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}
                      >
                        {selectedContact.name}
                      </SheetTitle>
                      <SheetDescription
                        className="mt-density-xs break-words text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-sm)", lineHeight: "var(--tally-line-height-normal)" }}
                      >
                        {selectedContact.email}
                      </SheetDescription>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-[#2C365D]/40 text-[#2C365D] hover:bg-[#2C365D]/5 dark:border-blue-400/50 dark:text-blue-400 dark:hover:bg-blue-400/10"
                    >
                      <Icon name="edit" size={14} />
                      Edit
                    </Button>
                    <SheetClose className="rounded-density-md p-density-sm hover:bg-gray-100 dark:hover:bg-gray-800" />
                  </div>
                </SheetHeader>

                {/* Action buttons: Note, Email, Call, Task, Meeting */}
                <div className="flex flex-row items-center justify-between gap-2 border-b border-border px-density-lg py-density-md dark:border-gray-700">
                  {actionItems.map(({ icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      className="flex flex-col items-center gap-1 rounded-density-md py-1 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      <Icon name={icon} size={22} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Contact details: ORG, ROLE, EMAIL, etc. */}
                <div className="flex-1 overflow-y-auto">
                  {detailRows.map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex flex-col gap-0.5 border-b border-border px-density-lg py-density-md dark:border-gray-700"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    >
                      <span
                        className="font-semibold uppercase tracking-wider text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)", letterSpacing: "0.08em" }}
                      >
                        {label}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">{value}</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Remove contact confirmation */}
      <AlertDialog
        open={contactToRemove != null}
        onOpenChange={(open) => !open && setContactToRemove(null)}
      >
        <AlertDialogContent
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove contact</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to remove{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {contactToRemove?.name}
              </strong>{" "}
              from this case.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (contactToRemove) {
                  setLocalContacts((prev) => prev.filter((c) => c.id !== contactToRemove.id));
                  if (expandedContactId === contactToRemove.id) setExpandedContactId(null);
                  setContactToRemove(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove related case confirmation */}
      <AlertDialog
        open={relatedCaseToRemove != null}
        onOpenChange={(open) => !open && setRelatedCaseToRemove(null)}
      >
        <AlertDialogContent
          className="max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Remove related case</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to remove{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                {relatedCaseToRemove}
              </strong>{" "}
              from this case. The link will be removed; the case itself is not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (relatedCaseToRemove) {
                  const newList = localRelatedCaseNumbers.filter((cn) => cn !== relatedCaseToRemove);
                  setLocalRelatedCaseNumbers(newList);
                  onUpdateCase?.({ relatedCases: newList });
                  setRelatedCaseToRemove(null);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
