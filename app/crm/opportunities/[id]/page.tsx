"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  OPPORTUNITIES,
  OPPORTUNITY_DETAILS,
  OPPORTUNITY_STAGES,
  type OpportunityDetail,
  type OpportunityRecord,
} from "@/lib/mock-data/colleague-opportunities";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${value}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const STATUS_BADGE_VARIANT: Record<
  string,
  "warning" | "info" | "success" | "error" | "outline"
> = {
  Lead: "warning",
  Open: "info",
  Won: "success",
  Lost: "error",
  Deferred: "outline",
};

const stageColors: Record<string, string> = {
  Initial: "bg-gray-400",
  Qualification: "bg-[#0074C4]",
  Proposal: "bg-[#C53B00]",
  Contract: "bg-[#008000]",
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

// Mock data for activity & documents
const MOCK_ACTIVITIES = [
  { type: "call", text: "Follow-up call with procurement", time: "2 hours ago" },
  { type: "email", text: "Sent contract draft to legal", time: "1 day ago" },
  { type: "meeting", text: "Discovery meeting with Sarah Mitchell", time: "3 days ago" },
  { type: "note", text: "Updated pricing based on volume discount", time: "5 days ago" },
];

const MOCK_STAGE_HISTORY: { stage: (typeof OPPORTUNITY_STAGES)[number]; date: string; note: string }[] = [
  { stage: "Initial", date: "2025-01-15", note: "Opportunity created" },
  { stage: "Qualification", date: "2025-02-01", note: "Discovery call completed" },
  { stage: "Proposal", date: "2025-02-15", note: "Proposal sent" },
  { stage: "Contract", date: "2025-03-01", note: "Contract in review" },
];

const MOCK_CONTRACTS = [
  { title: "Master Service Agreement v2.pdf", meta: "Uploaded Mar 1, 2025" },
  { title: "Pricing Schedule.xlsx", meta: "Uploaded Feb 28, 2025" },
];

const ACTIVITY_ICON: Record<string, { name: string; bg: string }> = {
  call: { name: "call", bg: "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/20 dark:text-[#7c8cb8]" },
  email: { name: "mail", bg: "bg-blue-50 text-[#0074C4] dark:bg-blue-950/30 dark:text-blue-400" },
  meeting: { name: "videocam", bg: "bg-green-50 text-[#008000] dark:bg-green-950/30 dark:text-green-400" },
  note: { name: "note", bg: "bg-purple-50 text-[#8B5CF6] dark:bg-purple-950/30 dark:text-purple-400" },
};

function getDetailForOpp(
  opportunityId: string
): OpportunityDetail & { accountCreationBlocked?: boolean } {
  const stored = OPPORTUNITY_DETAILS[opportunityId];
  if (stored) return stored;

  const fromList = OPPORTUNITIES.find((o) => o.id === opportunityId);
  if (fromList) {
    const statusMap: Record<OpportunityRecord["status"], OpportunityDetail["status"]> = {
      lead: "Lead",
      open: "Open",
      won: "Won",
      lost: "Lost",
      deferred: "Deferred",
    };
    return {
      id: fromList.id,
      name: fromList.name,
      owner: fromList.owner,
      status: statusMap[fromList.status],
      stage: fromList.stage,
      value: fromList.value,
      startDate: fromList.startDate,
      contractsSigned: "No",
      accountCreationBlocked: true,
    };
  }

  return (
    OPPORTUNITY_DETAILS["OPP-2025-0034"] ?? {
      id: "OPP-2025-0034",
      name: "Veolia Energy - Multi-site rollout",
      owner: "Sarah Mitchell",
      status: "Open",
      stage: "Qualification",
      value: 1200000,
      startDate: "2025-03-01",
      contractsSigned: "No",
      accountCreationBlocked: true,
    }
  );
}

export default function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: opportunityId } = React.use(params);
  const detail = getDetailForOpp(opportunityId);
  const badgeVariant = STATUS_BADGE_VARIANT[detail.status] ?? "info";
  const [activeTab, setActiveTab] = React.useState("details");

  const currentStageIndex = OPPORTUNITY_STAGES.indexOf(detail.stage);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        {/* Breadcrumbs */}
        <nav className="mb-density-md flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/crm/cases" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Cases
          </Link>
          <Icon name="chevron_right" size={14} />
          <Link href="/crm/opportunities" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
            Opportunities
          </Link>
          <Icon name="chevron_right" size={14} />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {detail.name}
          </span>
        </nav>

        {/* Header */}
        <div className="mb-density-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-density-sm">
                <h1
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{
                    fontSize: "var(--tally-font-size-xl)",
                    lineHeight: "var(--tally-line-height-tight)",
                  }}
                >
                  {detail.name}
                </h1>
                <Badge variant={badgeVariant}>{detail.status}</Badge>
              </div>
              <p
                className="mt-1 text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                {detail.id} · {detail.owner}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" className="gap-1.5">
                <Icon name="description" size="var(--tally-icon-size-sm)" />
                Generate Contract
              </Button>
              <Button size="md" className="gap-1.5">
                <Icon name="swap_horiz" size="var(--tally-icon-size-sm)" />
                Change Stage
              </Button>
            </div>
          </div>

          {/* Stage progress stepper */}
          <div className="mt-density-lg rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-1">
              {OPPORTUNITY_STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const isLast = index === OPPORTUNITY_STAGES.length - 1;

                return (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                          isCompleted && "border-[#008000] bg-[#008000] text-white",
                          isCurrent &&
                            cn(
                              "border-current text-white",
                              stageColors[stage]?.replace("bg-", "border-"),
                              stageColors[stage]
                            ),
                          !isCompleted &&
                            !isCurrent &&
                            "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
                        )}
                      >
                        {isCompleted ? (
                          <Icon name="check" size={14} />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={cn(
                          "max-w-[80px] text-center font-medium leading-tight",
                          isCurrent
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-400 dark:text-gray-500"
                        )}
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {stage}
                      </span>
                    </div>
                    {!isLast && (
                      <div
                        className={cn(
                          "mb-4 h-0.5 flex-1",
                          index < currentStageIndex
                            ? "bg-[#008000]"
                            : "bg-gray-200 dark:bg-gray-700"
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Value summary */}
            <div className="mt-density-lg flex items-center gap-density-xl border-t border-border pt-density-md dark:border-gray-700">
              <div>
                <p
                  className="uppercase text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  Deal Value
                </p>
                <p
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-lg)" }}
                >
                  {formatCurrency(detail.value)}
                </p>
              </div>
              <div>
                <p
                  className="uppercase text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  Stage
                </p>
                <p
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-lg)" }}
                >
                  {detail.stage}
                </p>
              </div>
              <div>
                <p
                  className="uppercase text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  Expected Start
                </p>
                <p
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-lg)" }}
                >
                  {formatDate(detail.startDate)}
                </p>
              </div>
              <div>
                <p
                  className="uppercase text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  Contracts Signed
                </p>
                <p
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-lg)" }}
                >
                  {detail.contractsSigned}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Warning banner */}
        {detail.accountCreationBlocked && (
          <div className="mb-density-lg flex items-center gap-density-sm rounded-density-md border border-amber-200 bg-amber-50 px-density-lg py-density-md dark:border-amber-900 dark:bg-amber-950/30">
            <Icon
              name="warning"
              size="var(--tally-icon-size-md)"
              className="text-amber-600 dark:text-amber-400"
            />
            <p
              style={{ fontSize: "var(--tally-font-size-sm)" }}
              className="text-amber-800 dark:text-amber-300"
            >
              Account creation is blocked until contracts are confirmed signed.
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} variant="inline">
          <TabsList className="mb-4">
            <TabsTrigger value="details">
              Details
            </TabsTrigger>
            <TabsTrigger value="activity">
              Activity ({MOCK_ACTIVITIES.length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({MOCK_CONTRACTS.length})
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-0">
            <div className="grid grid-cols-1 gap-density-lg lg:grid-cols-2">
              {/* Opportunity Details */}
              <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <h3
                  className="mb-density-lg font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Opportunity Details
                </h3>
                <div className="grid grid-cols-2 gap-density-lg">
                  <DataField label="Opportunity ID" value={detail.id} />
                  <DataField label="Owner" value={detail.owner} />
                  <DataField label="Status" value={detail.status} />
                  <DataField label="Stage" value={detail.stage} />
                  <DataField label="Value" value={formatCurrency(detail.value)} />
                  <DataField label="Expected Start" value={formatDate(detail.startDate)} />
                  <DataField label="Contracts Signed" value={detail.contractsSigned} />
                </div>
              </div>

              {/* Account Creation */}
              <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <h3
                  className="mb-density-lg font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Account Creation
                </h3>
                <p
                  className="mb-density-md text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                >
                  {detail.accountCreationBlocked
                    ? "Blocked until contracts are signed. Once the contract status is confirmed, you can create the customer account."
                    : "Ready to create a customer account for this opportunity."}
                </p>
                <Button
                  fullWidth
                  disabled={!!detail.accountCreationBlocked}
                  className="gap-density-sm"
                >
                  <Icon name="person_add" size="var(--tally-icon-size-md)" />
                  Create Account
                </Button>
              </div>

              {/* Stage History */}
              <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <h3
                  className="mb-density-lg font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Stage History
                </h3>
                <div className="divide-y divide-border dark:divide-gray-700">
                  {MOCK_STAGE_HISTORY.map((item) => (
                    <div key={item.stage} className="flex items-center gap-3 py-density-sm">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Icon
                          name={
                            OPPORTUNITY_STAGES.indexOf(item.stage) <
                            currentStageIndex
                              ? "check_circle"
                              : item.stage === detail.stage
                                ? "radio_button_checked"
                                : "radio_button_unchecked"
                          }
                          size="var(--tally-icon-size-md)"
                          className={
                            OPPORTUNITY_STAGES.indexOf(item.stage) <
                            currentStageIndex
                              ? "text-[#008000]"
                              : item.stage === detail.stage
                                ? "text-[#0074C4]"
                                : "text-gray-400 dark:text-gray-500"
                          }
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-medium text-gray-900 dark:text-gray-100"
                          style={{ fontSize: "var(--tally-font-size-sm)" }}
                        >
                          {item.stage}
                        </p>
                        <p
                          className="text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {item.note} · {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance & Notes */}
              <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <h3
                  className="mb-density-lg font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Compliance &amp; Notes
                </h3>
                <p
                  className="leading-relaxed text-gray-700 dark:text-gray-300"
                  style={{
                    fontSize: "var(--tally-font-size-sm)",
                    lineHeight: "var(--tally-line-height-relaxed)",
                  }}
                >
                  Awaiting legal review of contract terms. Procurement team
                  approved budget allocation. Follow-up scheduled for next
                  week.
                </p>
                <Button variant="outline" size="sm" className="mt-density-lg gap-1.5">
                  <Icon name="edit" size="var(--tally-icon-size-sm)" />
                  Add Note
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
              <h3
                className="mb-density-lg font-bold text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Activity History
              </h3>
              {MOCK_ACTIVITIES.length > 0 ? (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute bottom-0 left-[15px] top-0 w-px bg-gray-200 dark:bg-gray-700" />

                  {MOCK_ACTIVITIES.map((act, idx) => {
                    const icon = ACTIVITY_ICON[act.type] ?? ACTIVITY_ICON.note;
                    return (
                      <div key={idx} className="relative pb-density-lg pl-10 last:pb-0">
                        {/* Timeline dot */}
                        <div
                          className={cn(
                            "absolute left-[6px] top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full",
                            icon.bg
                          )}
                        >
                          <Icon name={icon.name} size={12} />
                        </div>

                        {/* Content */}
                        <div>
                          <p
                            className="font-medium text-gray-900 dark:text-gray-100"
                            style={{ fontSize: "var(--tally-font-size-sm)" }}
                          >
                            {act.text}
                          </p>
                          <p
                            className="mt-0.5 text-muted-foreground"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {act.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p
                  className="py-8 text-center text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  No activity recorded.
                </p>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-0">
            <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-density-lg flex items-center justify-between">
                <h3
                  className="font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Contracts &amp; Documents
                </h3>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Icon name="upload" size="var(--tally-icon-size-md)" />
                  Add Document
                </Button>
              </div>
              {MOCK_CONTRACTS.length > 0 ? (
                <div className="divide-y divide-border dark:divide-gray-700">
                  {MOCK_CONTRACTS.map((doc) => (
                    <div
                      key={doc.title}
                      className="flex items-center justify-between py-density-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <Icon name="description" size="var(--tally-icon-size-md)" />
                        </div>
                        <div>
                          <p
                            className="font-medium text-gray-900 dark:text-gray-100"
                            style={{ fontSize: "var(--tally-font-size-sm)" }}
                          >
                            {doc.title}
                          </p>
                          <p
                            className="text-muted-foreground"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            {doc.meta}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Download">
                        <Icon name="download" size="var(--tally-icon-size-md)" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="py-8 text-center text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  No documents attached.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
