"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  getOpportunityById,
  mockOpportunities,
  formatCurrency,
} from "@/lib/mock-data/pipeline";
import { getAccountById } from "@/lib/mock-data/accounts";
import AccountContextPanel from "@/components/crm/AccountContextPanel";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import DocumentAttachments from "@/components/crm/DocumentAttachments";
import type { PipelineStage, Contact, Quote } from "@/types/crm";

const stageColors: Record<PipelineStage, string> = {
  Leads: "bg-gray-400",
  Qualification: "bg-[#0074C4]",
  Proposal: "bg-[#C53B00]",
  Negotiation: "bg-[#8B5CF6]",
  "Closed Won": "bg-[#008000]",
  "Closed Lost": "bg-[#C40000]",
};

const STAGES: PipelineStage[] = [
  "Leads",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

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
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {value || "—"}
      </span>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const oppId = params.id as string;

  const opportunity = getOpportunityById(oppId) ?? mockOpportunities[0];
  const account = getAccountById(opportunity.accountId);
  const [activeTab, setActiveTab] = React.useState("details");

  if (!account) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  const currentStageIndex = STAGES.indexOf(opportunity.stage);

  return (
    <>
      <AccountContextPanel account={account} />

      <div className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] p-density-xl">
          {/* Breadcrumbs */}
          <nav className="mb-density-md flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/crm/cases" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Cases
            </Link>
            <Icon name="chevron_right" size={14} />
            <Link href="/crm/pipeline" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Pipeline
            </Link>
            <Icon name="chevron_right" size={14} />
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {opportunity.name}
            </span>
          </nav>

          {/* Header */}
          <div className="mb-density-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {opportunity.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {opportunity.accountName} · {opportunity.energyType}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Icon name="edit" size={16} />
                  Edit
                </Button>
              </div>
            </div>

            {/* Stage progress */}
            <div className="mt-4 rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex items-center gap-1">
                {STAGES.map((stage, index) => {
                  const isCompleted = index < currentStageIndex;
                  const isCurrent = index === currentStageIndex;
                  const isLast = index === STAGES.length - 1;

                  return (
                    <React.Fragment key={stage}>
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                            isCompleted &&
                              "border-[#008000] bg-[#008000] text-white",
                            isCurrent &&
                              cn(
                                "border-current text-white",
                                stageColors[stage].replace("bg-", "border-"),
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
                            "max-w-[80px] text-center text-[9px] font-medium leading-tight",
                            isCurrent
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-400 dark:text-gray-500"
                          )}
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
              <div className="mt-4 flex items-center gap-6 border-t border-border pt-3 dark:border-gray-700">
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Deal Value
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(opportunity.value)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Probability
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {opportunity.probability}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Weighted Value
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(
                      opportunity.value * (opportunity.probability / 100)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase text-muted-foreground">
                    Expected Close
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {opportunity.expectedCloseDate}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 h-10 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <TabsTrigger
                value="details"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="quotes"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
              >
                Quotes ({opportunity.linkedQuotes.length})
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
              >
                Activity ({opportunity.activities.length})
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
              >
                Files ({opportunity.attachments.length})
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-0">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    Opportunity Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DataField label="Owner" value={opportunity.owner} />
                    <DataField label="Stage" value={opportunity.stage} />
                    <DataField
                      label="Energy Type"
                      value={opportunity.energyType}
                    />
                    <DataField
                      label="Annual Volume"
                      value={opportunity.annualVolume}
                    />
                    <DataField
                      label="Contract Term"
                      value={opportunity.contractTerm}
                    />
                    <DataField
                      label="Competition"
                      value={opportunity.competition}
                    />
                    <DataField
                      label="Created"
                      value={opportunity.createdDate}
                    />
                    <DataField
                      label="Last Updated"
                      value={opportunity.updatedDate}
                    />
                  </div>
                </div>

                {/* DocuSign */}
                <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                    Contract Status
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DataField
                      label="DocuSign Status"
                      value={
                        <Badge
                          variant={
                            opportunity.docuSignStatus === "Completed" ||
                            opportunity.docuSignStatus === "Signed"
                              ? "success"
                              : opportunity.docuSignStatus === "Not Started"
                                ? "outline"
                                : "info"
                          }
                          className="text-[10px]"
                        >
                          {opportunity.docuSignStatus}
                        </Badge>
                      }
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">
                    Description
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {opportunity.description}
                  </p>
                </div>

                {/* Contacts */}
                <div className="rounded-lg border border-border bg-white p-4 lg:col-span-2 dark:border-gray-700 dark:bg-gray-900">
                  <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Contacts ({opportunity.contacts.length})
                  </h3>
                  <div className="divide-y divide-border dark:divide-gray-700">
                    {opportunity.contacts.map((contact: Contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <Icon name="person" size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {contact.name}
                            </p>
                            {contact.isPrimary && (
                              <Badge
                                variant="default"
                                className="text-[9px] px-1.5 py-0"
                              >
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {contact.role} · {contact.email} · {contact.phone}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes" className="mt-0">
              <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    Linked Quotes
                  </h3>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Icon name="add" size={16} />
                    New Quote
                  </Button>
                </div>
                {opportunity.linkedQuotes.length > 0 ? (
                  <div className="divide-y divide-border dark:divide-gray-700">
                    {opportunity.linkedQuotes.map((quote: Quote) => (
                      <div
                        key={quote.id}
                        className="flex items-center justify-between py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {quote.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Created {quote.createdDate} · Expires{" "}
                            {quote.expiryDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(quote.value)}
                          </span>
                          <Badge
                            variant={
                              quote.status === "Accepted"
                                ? "success"
                                : quote.status === "Rejected"
                                  ? "error"
                                  : quote.status === "Expired"
                                    ? "warning"
                                    : "outline"
                            }
                            className="text-[10px]"
                          >
                            {quote.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No quotes linked to this opportunity.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0">
              <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="mb-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                  Activity History
                </h3>
                <ActivityTimeline activities={opportunity.activities} />
                {opportunity.activities.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No activity recorded.
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-0">
              <div className="rounded-lg border border-border bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <DocumentAttachments attachments={opportunity.attachments} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
