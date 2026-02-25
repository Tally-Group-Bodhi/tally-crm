"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import Badge from "@/components/Badge/Badge";
import type { Communication } from "@/types/crm";

interface CommunicationTimelineProps {
  communications: Communication[];
  className?: string;
  /** Controlled expand state; when provided with onExpandedIdsChange, component is controlled */
  expandedIds?: Set<string>;
  onExpandedIdsChange?: (ids: Set<string>) => void;
  /** Current case number — used to distinguish "this case" vs cross-case comms */
  currentCaseNumber?: string;
}

const directionConfig = {
  Inbound: { icon: "call_received", label: "Inbound" },
  Outbound: { icon: "call_made", label: "Outbound" },
  Internal: { icon: "forum", label: "Internal" },
};

const typeIcons: Record<string, string> = {
  Email: "mail",
  Phone: "phone",
  Note: "edit_note",
  System: "settings",
};

const typeLoggedLabel: Record<string, string> = {
  Email: "Logged Email",
  Phone: "Logged Call",
  Note: "Logged Note",
  System: "Logged",
};

function formatTimestampDisplay(ts: string): string {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return ts;
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
  }).format(d);
}

function parseTimestamp(ts: string): number {
  const d = new Date(ts);
  if (Number.isFinite(d.getTime())) return d.getTime();
  const parts = ts.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (parts) {
    return new Date(
      +parts[3], +parts[2] - 1, +parts[1], +parts[4], +parts[5]
    ).getTime();
  }
  return 0;
}

interface ThreadGroup {
  threadId: string;
  subject: string;
  communications: Communication[];
  latestTimestamp: number;
}

type TimelineEntry =
  | { kind: "thread"; group: ThreadGroup }
  | { kind: "standalone"; comm: Communication };

function CommCard({
  comm,
  isExpanded,
  onToggle,
  currentCaseNumber,
  isThreaded,
  isLast,
}: {
  comm: Communication;
  isExpanded: boolean;
  onToggle: () => void;
  currentCaseNumber?: string;
  isThreaded?: boolean;
  isLast?: boolean;
}) {
  const dirConfig = directionConfig[comm.direction];
  const isFromOtherCase =
    currentCaseNumber && comm.sourceCaseNumber && comm.sourceCaseNumber !== currentCaseNumber;

  return (
    <div className={cn("min-w-0 max-w-full", isThreaded ? "relative" : "pb-4 last:pb-0")}>
      {isThreaded && (
        <div className="absolute left-0 top-0 bottom-0 flex w-5 flex-col items-center">
          <div
            className={cn(
              "w-px bg-[#006180]/25 dark:bg-[#0091BF]/30",
              isLast ? "h-4" : "h-full"
            )}
          />
        </div>
      )}
      <div className={cn("min-w-0 max-w-full overflow-hidden rounded-lg border border-border bg-white dark:border-gray-700 dark:bg-gray-900", isThreaded && "ml-7")}>
        {/* Header */}
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-col gap-1 px-5 py-2.5 text-left"
        >
          <div className="flex w-full items-center gap-2">
            <div className="flex shrink-0 items-center text-muted-foreground">
              <Icon name={typeIcons[comm.type] ?? "mail"} size={20} />
            </div>
            <span className="text-[11px] text-muted-foreground">
              {typeLoggedLabel[comm.type] ?? "Logged"} by {comm.loggedBy ?? "—"}
            </span>
            {isFromOtherCase && comm.sourceCaseId && (
              <Link
                href={`/crm/cases/${comm.sourceCaseId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-sm border border-[#006180]/20 bg-[#006180]/5 px-1.5 py-0 text-[10px] font-medium text-[#006180] hover:bg-[#006180]/10 dark:border-[#0091BF]/25 dark:bg-[#0091BF]/10 dark:text-[#80E0FF] dark:hover:bg-[#0091BF]/20"
              >
                <Icon name="account_tree" size={10} className="shrink-0" />
                {comm.sourceCaseNumber}
              </Link>
            )}
          </div>
          <div className="flex w-full items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {comm.subject}
                </span>
                <Badge
                  variant={
                    comm.direction === "Inbound"
                      ? "info"
                      : comm.direction === "Outbound"
                        ? "success"
                        : "outline"
                  }
                  className="shrink-0 text-[10px] px-1.5 py-0"
                >
                  {dirConfig.label}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {comm.direction === "Inbound" ? "From" : "To"}:{" "}
                {comm.direction === "Inbound" ? comm.from : comm.to}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">
                {formatTimestampDisplay(comm.timestamp)}
              </span>
              <Icon
                name={isExpanded ? "expand_less" : "expand_more"}
                size={18}
                className="text-gray-400"
              />
            </div>
          </div>
        </button>

        {/* Expanded body */}
        {isExpanded && (
          <div className="min-w-0 max-w-full overflow-x-hidden border-t border-border px-5 py-3 dark:border-gray-700">
              {/* Metadata */}
              <div className="mb-3 space-y-0.5 text-[11px] text-muted-foreground">
                <p>
                  <span className="font-medium">From:</span> {comm.from}
                </p>
                <p>
                  <span className="font-medium">To:</span> {comm.to}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {formatTimestampDisplay(comm.timestamp)}
                </p>
                {isFromOtherCase && (
                  <p>
                    <span className="font-medium">Case:</span>{" "}
                    <Link
                      href={`/crm/cases/${comm.sourceCaseId}`}
                      className="text-[#006180] hover:underline dark:text-[#80E0FF]"
                    >
                      {comm.sourceCaseNumber}
                    </Link>
                  </p>
                )}
              </div>

              {comm.type === "Note" && /<[a-zA-Z]/.test(comm.body) ? (
                <div
                  className="comm-note-body text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: comm.body }}
                />
              ) : (
                <div className="comm-note-body whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {comm.body}
                </div>
              )}

              {comm.attachments.length > 0 && (
                <div className="mt-3 border-t border-border pt-3 dark:border-gray-700">
                  <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Attachments
                  </p>
                  {comm.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-gray-50 px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <Icon name="attach_file" size={14} />
                      {att.name}
                      <span className="text-muted-foreground">
                        ({att.size})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default function CommunicationTimeline({
  communications,
  className,
  expandedIds: controlledExpandedIds,
  onExpandedIdsChange,
  currentCaseNumber,
}: CommunicationTimelineProps) {
  const [internalExpandedIds, setInternalExpandedIds] = React.useState<Set<string>>(
    new Set(communications.length > 0 ? [communications[0].id] : [])
  );
  const isControlled = controlledExpandedIds !== undefined && onExpandedIdsChange != null;
  const expandedIds = isControlled ? controlledExpandedIds : internalExpandedIds;

  const [collapsedThreads, setCollapsedThreads] = React.useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    if (isControlled && onExpandedIdsChange) {
      onExpandedIdsChange(next);
    } else {
      setInternalExpandedIds(next);
    }
  };

  const toggleThread = (threadId: string) => {
    setCollapsedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  };

  const entries = React.useMemo<TimelineEntry[]>(() => {
    const threadMap = new Map<string, Communication[]>();
    const standalone: Communication[] = [];

    for (const comm of communications) {
      if (comm.threadId) {
        const arr = threadMap.get(comm.threadId);
        if (arr) arr.push(comm);
        else threadMap.set(comm.threadId, [comm]);
      } else {
        standalone.push(comm);
      }
    }

    const result: TimelineEntry[] = [];

    for (const [threadId, comms] of threadMap) {
      if (comms.length === 1) {
        standalone.push(comms[0]);
        continue;
      }
      const sorted = comms.sort((a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp));
      const latestTs = Math.max(...sorted.map((c) => parseTimestamp(c.timestamp)));
      result.push({
        kind: "thread",
        group: {
          threadId,
          subject: sorted[0].subject.replace(/^RE:\s*/i, ""),
          communications: sorted,
          latestTimestamp: latestTs,
        },
      });
    }

    for (const comm of standalone) {
      result.push({ kind: "standalone", comm });
    }

    result.sort((a, b) => {
      const tsA = a.kind === "thread" ? a.group.latestTimestamp : parseTimestamp(a.comm.timestamp);
      const tsB = b.kind === "thread" ? b.group.latestTimestamp : parseTimestamp(b.comm.timestamp);
      return tsB - tsA;
    });

    return result;
  }, [communications]);

  const hasCrossCase = communications.some((c) => c.sourceCaseNumber && c.sourceCaseNumber !== currentCaseNumber);

  return (
    <div className={cn("min-w-0 w-full max-w-full overflow-hidden space-y-1", className)}>
      {entries.map((entry) => {
        if (entry.kind === "standalone") {
          return (
            <CommCard
              key={entry.comm.id}
              comm={entry.comm}
              isExpanded={expandedIds.has(entry.comm.id)}
              onToggle={() => toggleExpanded(entry.comm.id)}
              currentCaseNumber={currentCaseNumber}
            />
          );
        }

        const { group } = entry;
        const isThreadCollapsed = collapsedThreads.has(group.threadId);
        const crossCaseCount = hasCrossCase
          ? group.communications.filter(
              (c) => c.sourceCaseNumber && c.sourceCaseNumber !== currentCaseNumber
            ).length
          : 0;

        return (
          <div key={group.threadId} className="pb-4 last:pb-0">
            {/* Thread header */}
            <button
              type="button"
              onClick={() => toggleThread(group.threadId)}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-[#006180]/15 bg-[#006180]/[0.03] px-4 py-2 text-left transition-colors hover:bg-[#006180]/[0.06] dark:border-[#0091BF]/20 dark:bg-[#0091BF]/[0.04] dark:hover:bg-[#0091BF]/[0.08]"
            >
              <Icon
                name="forum"
                size={16}
                className="shrink-0 text-[#006180] dark:text-[#80E0FF]"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {group.subject}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {group.communications.length} emails
              </span>
              {crossCaseCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-sm border border-[#006180]/20 bg-[#006180]/5 px-1.5 py-0 text-[10px] font-medium text-[#006180] dark:border-[#0091BF]/25 dark:bg-[#0091BF]/10 dark:text-[#80E0FF]">
                  <Icon name="account_tree" size={10} className="shrink-0" />
                  {crossCaseCount} from linked case
                </span>
              )}
              <Icon
                name={isThreadCollapsed ? "expand_more" : "expand_less"}
                size={18}
                className="shrink-0 text-gray-400"
              />
            </button>

            {/* Thread communications */}
            {!isThreadCollapsed && (
              <div className="space-y-1.5 pl-1">
                {group.communications.map((comm, idx) => (
                  <CommCard
                    key={comm.id}
                    comm={comm}
                    isExpanded={expandedIds.has(comm.id)}
                    onToggle={() => toggleExpanded(comm.id)}
                    currentCaseNumber={currentCaseNumber}
                    isThreaded
                    isLast={idx === group.communications.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
