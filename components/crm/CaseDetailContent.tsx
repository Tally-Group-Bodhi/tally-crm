"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/Dialog/Dialog";
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
import { getCaseByCaseNumber } from "@/lib/mock-data/cases";
import { getAccountById } from "@/lib/mock-data/accounts";
import type { Account, CaseItem, CasePriority, CaseStatus, Communication, Contact } from "@/types/crm";

const priorityVariant: Record<CasePriority, "error" | "warning" | "info" | "outline" | "yellow"> = {
  Critical: "error",
  High: "warning",
  Medium: "yellow",
  Low: "outline",
};

const STATUS_ICONS: Record<CaseStatus, string> = {
  New: "add_circle",
  "In Progress": "pending",
  Pending: "hourglass_top",
  Resolved: "task_alt",
  Closed: "check_circle",
};

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
  /** When set (e.g. tab view), note/call panels are portaled into this container */
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
  onUpdateCase,
  onDeleteCase,
  relatedCasesMap,
  notePanelOpen = false,
  onCloseNotePanel,
  callLogPanelOpen = false,
  onCloseCallLogPanel,
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
  const resolveCase = (caseNum: string) => relatedCasesMap?.get(caseNum) ?? getCaseByCaseNumber(caseNum);
  const relatedCaseNumbers = relatedCaseNumbersProp ?? caseItem.relatedCases;
  const [activeTab, setActiveTab] = React.useState("request");
  const [updating, setUpdating] = React.useState(false);
  const [communicationsExpandedIds, setCommunicationsExpandedIds] = React.useState<Set<string>>(new Set());
  const [communicationsSearchQuery, setCommunicationsSearchQuery] = React.useState("");
  const [communicationsSelectedUsers, setCommunicationsSelectedUsers] = React.useState<Set<string>>(new Set());
  type CommFilterTab = "all" | "notes" | "emails" | "calls";
  const [communicationsFilterTab, setCommunicationsFilterTab] = React.useState<CommFilterTab>("all");
  const [closeCaseModalOpen, setCloseCaseModalOpen] = React.useState(false);
  const [pendingStatusChange, setPendingStatusChange] = React.useState<CaseStatus | null>(null);

  const COMM_UNASSIGNED_LABEL = "—";
  const communicationsUniqueUsers = React.useMemo(() => {
    const set = new Set<string>();
    caseItem.communications.forEach((c) => set.add(c.loggedBy?.trim() || COMM_UNASSIGNED_LABEL));
    return Array.from(set).sort((a, b) =>
      a === COMM_UNASSIGNED_LABEL ? 1 : b === COMM_UNASSIGNED_LABEL ? -1 : a.localeCompare(b)
    );
  }, [caseItem.communications]);
  const filteredCommunications = React.useMemo(() => {
    let list = caseItem.communications;
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
    if (communicationsSelectedUsers.size > 0) {
      list = list.filter((c) => {
        const user = c.loggedBy?.trim() || COMM_UNASSIGNED_LABEL;
        return communicationsSelectedUsers.has(user);
      });
    }
    return list;
  }, [
    caseItem.communications,
    communicationsFilterTab,
    communicationsSearchQuery,
    communicationsSelectedUsers,
  ]);
  const toggleCommUser = React.useCallback((user: string) => {
    setCommunicationsSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(user)) next.delete(user);
      else next.add(user);
      return next;
    });
  }, []);
  const clearCommUserFilter = React.useCallback(() => setCommunicationsSelectedUsers(new Set()), []);

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
      <div className="mb-density-xl">
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
            </div>
            <p
              className="mt-1 text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {caseItem.subType} · {caseItem.accountName}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <Button variant="outline" size="md" className="gap-1.5">
              <Icon name="person_add" size="var(--tally-icon-size-sm)" />
              Assign
            </Button>
            <Button
              variant="outline"
              size="md"
              className="gap-1.5"
              onClick={() => setCloseCaseModalOpen(true)}
            >
              <Icon name="lock" size="var(--tally-icon-size-sm)" />
              Close Case
            </Button>
            {onDeleteCase && (
              <Button
                variant="outline"
                size="md"
                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                disabled={updating}
                onClick={() => onDeleteCase()}
              >
                <Icon name="delete" size="var(--tally-icon-size-sm)" />
                Delete
              </Button>
            )}
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

        {/* Status bar and SLA — stack progress bar above SLA on small viewports */}
        <div className="mt-4 flex min-w-0 flex-col items-stretch justify-between gap-4 rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sm:flex-row sm:items-center">
          <StatusProgressBar
            currentStatus={caseItem.status}
            className="min-w-0 w-full flex-1 sm:min-w-0"
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
          <div className="flex w-full shrink-0 items-center justify-end gap-4 border-t border-border pt-4 dark:border-gray-700 sm:w-auto sm:justify-end sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Small viewport: dropdown */}
        <div className="mb-4 sm:hidden">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-lg border border-border bg-gray-100 py-2.5 pl-3 pr-9 font-medium text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              <option value="request">Request Information</option>
              <option value="communications">
                Communications ({caseItem.communications.length})
              </option>
              <option value="related">Related</option>
              <option value="history">History ({caseItem.activities.length})</option>
            </select>
            <Icon
              name="expand_more"
              size={20}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            />
          </div>
        </div>

        {/* Larger viewport: horizontal tabs */}
        <TabsList className="mb-4 hidden h-10 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 sm:inline-flex">
          <TabsTrigger
            value="request"
            className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            Request Information
          </TabsTrigger>
          <TabsTrigger
            value="communications"
            className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            Communications ({caseItem.communications.length})
          </TabsTrigger>
          <TabsTrigger
            value="related"
            className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            Related
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
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
              <h3
                className="mb-3 font-bold text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Description
              </h3>
              <p
                className="leading-relaxed text-gray-700 dark:text-gray-300"
                style={{
                  fontSize: "var(--tally-font-size-sm)",
                  lineHeight: "var(--tally-line-height-relaxed)",
                }}
              >
                {caseItem.description}
              </p>
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
            {/* Left: filter button group — compact, matches right-side controls and project tabs */}
            <nav
              className="inline-flex h-8 w-fit rounded-md border border-border bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800"
              aria-label="Filter communications by type"
              role="group"
            >
              {(
                [
                  { value: "all" as const, label: "All updates", icon: "list" as const },
                  { value: "notes" as const, label: "Notes", icon: "edit" as const },
                  { value: "emails" as const, label: "Emails", icon: "mail" as const },
                  { value: "calls" as const, label: "Call logs", icon: "call" as const },
                ] satisfies { value: CommFilterTab; label: string; icon: string }[]
              ).map(({ value, label, icon }, index) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCommunicationsFilterTab(value)}
                  className={cn(
                    "inline-flex h-full items-center justify-center gap-1.5 px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    index === 0 && "rounded-l-[5px]",
                    index === 3 && "rounded-r-[5px]",
                    index > 0 && "border-l border-border dark:border-gray-600",
                    communicationsFilterTab === value
                      ? "bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100"
                      : "text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                  aria-pressed={communicationsFilterTab === value}
                >
                  <Icon name={icon} size={16} className="shrink-0 text-current" />
                  {label}
                </button>
              ))}
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
                  <DropdownMenuItem className="gap-2 text-left">
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
              <div className="relative w-44 min-w-0 md:w-52">
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
                    "h-8 w-full rounded-md border border-border bg-white pl-8 pr-2.5 py-1.5 text-sm text-gray-900 placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
                  )}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                  aria-label="Search communications"
                />
              </div>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-sm text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
                    communicationsSelectedUsers.size > 0 && "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/10"
                  )}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  <Icon name="person" size={14} className="shrink-0 text-muted-foreground" />
                  <span>User</span>
                  {communicationsSelectedUsers.size > 0 && (
                    <span className="rounded bg-[#2C365D] px-1 py-0 text-[10px] text-white dark:bg-[#7c8cb8]">
                      {communicationsSelectedUsers.size}
                    </span>
                  )}
                  <Icon name="expand_more" size={14} className="shrink-0 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-2">
                  <div className="max-h-52 overflow-y-auto">
                    {communicationsUniqueUsers.map((user) => (
                      <label
                        key={user}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={communicationsSelectedUsers.has(user)}
                          onChange={() => toggleCommUser(user)}
                          className="h-3.5 w-3.5 rounded border-border text-[#2C365D] focus:ring-[#2C365D] dark:border-gray-600 dark:bg-gray-700"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{user}</span>
                      </label>
                    ))}
                  </div>
                  {communicationsSelectedUsers.size > 0 && (
                    <button
                      type="button"
                      onClick={clearCommUserFilter}
                      className="mt-2 w-full rounded py-1.5 text-center text-sm font-medium text-[#2C365D] hover:bg-gray-100 dark:text-[#7c8cb8] dark:hover:bg-gray-800"
                    >
                      Clear
                    </button>
                  )}
                </PopoverContent>
              </Popover>
              {filteredCommunications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allIds = new Set(filteredCommunications.map((c) => c.id));
                    const allExpanded = allIds.size > 0 && communicationsExpandedIds.size >= allIds.size;
                    setCommunicationsExpandedIds(allExpanded ? new Set() : allIds);
                  }}
                  className="inline-flex items-center gap-1.5 bg-transparent px-0 py-1 text-sm font-medium text-[#2C365D] transition-colors hover:underline dark:text-[#7c8cb8]"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  <Icon
                    name={communicationsExpandedIds.size >= filteredCommunications.length ? "unfold_less" : "unfold_more"}
                    size={16}
                    className="shrink-0"
                  />
                  {communicationsExpandedIds.size >= filteredCommunications.length && filteredCommunications.length > 0
                    ? "Collapse All"
                    : "Expand All"}
                </button>
              )}
            </div>
          </div>
          <CommunicationTimeline
            communications={filteredCommunications}
            expandedIds={communicationsExpandedIds}
            onExpandedIdsChange={setCommunicationsExpandedIds}
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
              <DocumentAttachments attachments={caseItem.attachments} />
            </div>
            <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <h3
                className="mb-3 font-medium text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Contacts ({account.contacts.length})
              </h3>
              <div className="divide-y divide-border dark:divide-gray-700">
                {account.contacts.map((contact: Contact) => (
                  <div key={contact.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <Icon name="person" size={16} />
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
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3
                  className="font-medium text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Related Cases (
                  {
                    relatedCaseNumbers.filter((caseNum) => {
                      const c = resolveCase(caseNum);
                      return c && getAccountById(c.accountId)?.orgId === account.orgId;
                    }).length
                  }
                  )
                </h3>
                {onOpenLinkModal && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={onOpenLinkModal}>
                    <Icon name="link" size={14} />
                    Link case
                  </Button>
                )}
              </div>
              {(() => {
                const relatedSameOrg = relatedCaseNumbers.filter((caseNum) => {
                  const c = resolveCase(caseNum);
                  return c != null && getAccountById(c.accountId)?.orgId === account.orgId;
                });
                return relatedSameOrg.length > 0 ? (
                  <div className="space-y-2">
                    {relatedSameOrg.map((caseNum) => {
                      const linkedCase = resolveCase(caseNum);
                      if (!linkedCase) return null;
                      return (
                        <Link
                          key={linkedCase.id}
                          href={`/crm/cases/${linkedCase.id}`}
                          className="flex items-center gap-2 rounded border border-border px-3 py-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60"
                        >
                          <Icon name="link" size={16} className="text-gray-400" />
                          <span
                            className="font-medium text-[#2C365D] dark:text-[#7c8cb8]"
                            style={{ fontSize: "var(--tally-font-size-sm)" }}
                          >
                            {linkedCase.caseNumber}
                          </span>
                        </Link>
                      );
                    })}
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
      </div>
    </div>
  );
}
