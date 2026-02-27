"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import Badge from "@/components/Badge/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/DropdownMenu/DropdownMenu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/Collapsible/Collapsible";
import SLAIndicator from "@/components/crm/SLAIndicator";
import { getCaseByCaseNumber } from "@/lib/mock-data/cases";
import { getAccountById } from "@/lib/mock-data/accounts";
import type { Account, CaseItem } from "@/types/crm";

interface AccountContextPanelProps {
  account: Account;
  /** Case numbers of manually linked cases to show in Linked Cases section */
  linkedCaseNumbers?: string[];
  /** When set, show "Link case" button and allow adding links */
  currentCaseId?: string;
  /** Callback to open the link-case modal */
  onOpenLinkModal?: () => void;
  /** Callback to open the note panel */
  onOpenNotePanel?: () => void;
  /** Callback to open the call log panel */
  onOpenCallLogPanel?: () => void;
  /** Callback to open the email panel */
  onOpenEmailPanel?: () => void;
  /** When set (e.g. DB mode), resolve case numbers to CaseItem for links */
  relatedCasesMap?: Map<string, CaseItem>;
  /** Called when the Note quick action is clicked */
  onOpenNote?: () => void;
  className?: string;
}

function DataRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <span
        className="shrink-0 text-muted-foreground"
        style={{ fontSize: "var(--tally-font-size-xs)" }}
      >
        {label}
      </span>
      <span
        className="text-right text-gray-900 dark:text-gray-100"
        style={{ fontSize: "var(--tally-font-size-xs)" }}
      >
        {value}
      </span>
    </div>
  );
}

function BoolRow({
  label,
  value,
  className,
}: {
  label: string;
  value: boolean | undefined;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <span
        className="shrink-0 text-muted-foreground"
        style={{ fontSize: "var(--tally-font-size-xs)" }}
      >
        {label}
      </span>
      <span
        className="text-gray-900 dark:text-gray-100"
        style={{ fontSize: "var(--tally-font-size-xs)" }}
      >
        {value === true ? (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
            <Icon name="check" size={14} className="inline-block" />
            <span>Active</span>
          </span>
        ) : (
          <Icon name="radio_button_unchecked" size={14} className="inline-block text-muted-foreground" />
        )}
      </span>
    </div>
  );
}

export default function AccountContextPanel({
  account,
  linkedCaseNumbers = [],
  currentCaseId,
  onOpenLinkModal,
  onOpenNotePanel,
  onOpenCallLogPanel,
  onOpenEmailPanel,
  relatedCasesMap,
  onOpenNote,
  className,
}: AccountContextPanelProps) {
  const [accountDetailsOpen, setAccountDetailsOpen] = React.useState(true);
  const [accountBalanceOpen, setAccountBalanceOpen] = React.useState(false);
  const [primaryContactOpen, setPrimaryContactOpen] = React.useState(true);
  const [contactDetailsExpanded, setContactDetailsExpanded] = React.useState(false);
  const [linkedCasesOpen, setLinkedCasesOpen] = React.useState(false);
  const [supplyDetailsOpen, setSupplyDetailsOpen] = React.useState(false);
  const resolveCase = (caseNum: string) => relatedCasesMap?.get(caseNum) ?? getCaseByCaseNumber(caseNum);
  const accountTypeVariant =
    account.type === "Industrial"
      ? "default"
      : account.type === "Commercial"
        ? "info"
        : "secondary";

  const QUICK_ACTIONS = [
    { label: "Note", icon: "edit" as const },
    { label: "Email", icon: "mail" as const },
    { label: "Call", icon: "call" as const },
  ] as const;

  const sectionTriggerClass =
    "flex items-center justify-between gap-2 rounded-density-sm py-density-sm text-left font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300";
  const sectionTriggerChevronClass =
    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full -m-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors";
  const sectionDividerClass = "border-t border-gray-200 dark:border-gray-800/60";

  return (
    <aside
      className={cn(
        "flex min-h-0 w-72 shrink-0 flex-col rounded-xl border border-border bg-white dark:border-gray-800 dark:bg-gray-950",
        className
      )}
    >
      {/* Header — account name and badges */}
      <div className="flex flex-col gap-density-sm px-density-md pt-density-md pb-density-xs">
        <div className="flex flex-col gap-1.5">
          <p
            className="font-bold text-gray-900 dark:text-gray-100 break-words"
            style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}
          >
            {account.name}
          </p>
          <p
            className="text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            {account.accountNumber}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={accountTypeVariant}
              className="px-1.5 py-0"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              {account.type}
            </Badge>
            <Badge
              variant={account.status === "Active" ? "success" : "error"}
              className="px-1.5 py-0"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              {account.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick actions — Note, Email, Call */}
      <div className="border-b border-border px-density-md py-density-sm dark:border-gray-800">
        <div className="flex w-full items-center gap-2">
          {QUICK_ACTIONS.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              onClick={
                label === "Note"
                  ? onOpenNotePanel
                  : label === "Email"
                    ? onOpenEmailPanel
                    : label === "Call"
                      ? onOpenCallLogPanel
                      : undefined
              }
              className="flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              <Icon name={icon} size={15} />
              <span>{label}</span>
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center justify-center rounded-md border border-border bg-white p-1.5 text-muted-foreground transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              aria-label="More options"
            >
              <Icon name="more_horiz" size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem]">
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
        </div>
      </div>

      {/* Content — scrollable when taller than panel */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-density-md py-density-sm">
        <div className="flex flex-col gap-density-md">
          {/* Account details */}
          <Collapsible
            open={accountDetailsOpen}
            onOpenChange={setAccountDetailsOpen}
            className="flex flex-col"
          >
            <CollapsibleTrigger className={sectionTriggerClass} style={{ fontSize: "var(--tally-font-size-xs)" }}>
              <span className="flex items-center gap-2">
                <Icon name="badge" size={16} className="shrink-0 text-muted-foreground" />
                <span>Account details</span>
              </span>
              <span className={sectionTriggerChevronClass}>
                <Icon
                  name="expand_more"
                  size={16}
                  className={cn("transition-transform", accountDetailsOpen && "rotate-180")}
                />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 pt-density-sm">
                  <DataRow
                    label="Legal name"
                    value={account.legalBusinessName ?? "—"}
                  />
                  <DataRow
                    label="Parent account"
                    value={
                      account.parentAccountId != null ? (
                        <Link
                          href={`/crm/customer/accounts/${account.parentAccountId}`}
                          className="text-[#2C365D] underline hover:no-underline dark:text-[#7c8cb8]"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {account.parentAccountName ?? account.parentAccountId}
                        </Link>
                      ) : (
                        account.parentAccountName ?? "—"
                      )
                    }
                  />
                  <DataRow label="Customer type" value={account.customerType ?? "—"} />
                  <DataRow label="Account status" value={account.accountStatus ?? "—"} />
                  <BoolRow label="Closed" value={account.isClosed} />
                  <BoolRow label="Sync status" value={account.accountSyncStatus} />
                  <BoolRow label="Consolidate to parent" value={account.consolidateToParent} />
                  <BoolRow label="Direct debit" value={account.isDirectDebit} />
                  <DataRow label="Terms" value={account.terms ?? "—"} />
                  <DataRow
                    label="Service ref"
                    value={account.serviceReferenceNumber ?? "—"}
                  />
                  <BoolRow label="Life support" value={account.lifeSupport} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className={sectionDividerClass} />

            {/* Primary Contact */}
            <Collapsible
              open={primaryContactOpen}
              onOpenChange={setPrimaryContactOpen}
              className="flex flex-col"
            >
              <CollapsibleTrigger className={sectionTriggerClass} style={{ fontSize: "var(--tally-font-size-xs)" }}>
                <span className="flex items-center gap-2">
                  <Icon name="person" size={16} className="shrink-0 text-muted-foreground" />
                  <span>Primary Contact</span>
                </span>
                <span className={sectionTriggerChevronClass}>
                  <Icon
                    name="expand_more"
                    size={16}
                    className={cn("transition-transform", primaryContactOpen && "rotate-180")}
                  />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <button
                  type="button"
                  onClick={() => setContactDetailsExpanded((v) => !v)}
                  className="w-full cursor-pointer rounded-density-md border border-border bg-gray-50 p-density-sm text-left transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-medium text-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {account.primaryContact.name}
                      </p>
                      <p
                        className="text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {account.primaryContact.role}
                      </p>
                    </div>
                    <Icon
                      name="expand_more"
                      size={14}
                      className={cn(
                        "shrink-0 text-muted-foreground transition-transform",
                        contactDetailsExpanded && "rotate-180"
                      )}
                    />
                  </div>
                  {contactDetailsExpanded && (
                    <div className="mt-1.5 space-y-0.5">
                      <div
                        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        <Icon name="mail" size={12} className="shrink-0" />
                        <span className="truncate">{account.primaryContact.email}</span>
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        <Icon name="phone" size={12} className="shrink-0" />
                        {account.primaryContact.phone}
                      </div>
                    </div>
                  )}
                </button>
              </CollapsibleContent>
            </Collapsible>

            <div className={sectionDividerClass} />

            {/* Supply details */}
            <Collapsible
              open={supplyDetailsOpen}
              onOpenChange={setSupplyDetailsOpen}
              className="flex flex-col"
            >
              <CollapsibleTrigger className={sectionTriggerClass} style={{ fontSize: "var(--tally-font-size-xs)" }}>
                <span className="flex items-center gap-2">
                  <Icon name="bolt" size={16} className="shrink-0 text-muted-foreground" />
                  <span>Supply details</span>
                </span>
                <span className={sectionTriggerChevronClass}>
                  <Icon
                    name="expand_more"
                    size={16}
                    className={cn("transition-transform", supplyDetailsOpen && "rotate-180")}
                  />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 pt-density-sm">
                  <div className="space-y-1.5">
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      NMI{account.nmis.length > 1 ? "s" : ""}
                    </span>
                    {account.nmis.map((nmi) => (
                      <div
                        key={nmi}
                        className="flex items-center gap-1.5 rounded bg-gray-50 px-2 py-1 font-mono text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        <Icon
                          name="electric_meter"
                          size={14}
                          className="shrink-0 text-gray-400"
                        />
                        <span className="truncate">{nmi}</span>
                      </div>
                    ))}
                  </div>
                  <DataRow label="Energy type" value={account.energyType} />
                  <DataRow label="Address" value={account.address} />
                  <DataRow
                    label="Annual consumption"
                    value={account.annualConsumption}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

          <div className={sectionDividerClass} />

          {/* Account balance */}
          <Collapsible
            open={accountBalanceOpen}
            onOpenChange={setAccountBalanceOpen}
            className="flex flex-col"
          >
            <CollapsibleTrigger className={sectionTriggerClass} style={{ fontSize: "var(--tally-font-size-xs)" }}>
              <span className="flex items-center gap-2">
                <Icon name="account_balance" size={16} className="shrink-0 text-muted-foreground" />
                <span>Account balance</span>
              </span>
              <span className={sectionTriggerChevronClass}>
                <Icon
                  name="expand_more"
                  size={16}
                  className={cn("transition-transform", accountBalanceOpen && "rotate-180")}
                />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 pt-density-sm">
                <DataRow
                  label="Account balance"
                  value={
                    <span
                      className={cn(
                        "font-semibold",
                        account.accountBalance.startsWith("-")
                          ? "text-[#C40000]"
                          : "text-[#008000]"
                      )}
                    >
                      {account.accountBalance}
                    </span>
                  }
                />
                <DataRow
                  label="Last payment"
                  value={`${account.lastPaymentAmount} · ${account.lastPaymentDate}`}
                />
                <DataRow
                  label="Contract end"
                  value={account.contractEndDate}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Linked Cases — only show when same-org cases or link action */}
          {(linkedCaseNumbers.length > 0 || onOpenLinkModal) && (
            <>
              <div className={sectionDividerClass} />
              <Collapsible
                open={linkedCasesOpen}
                onOpenChange={setLinkedCasesOpen}
                className="flex flex-col"
              >
<CollapsibleTrigger className={sectionTriggerClass} style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    <span className="flex items-center gap-2">
                      <Icon name="folder" size={16} className="shrink-0 text-muted-foreground" />
                      <span>Linked Cases</span>
                    </span>
                    <span className={sectionTriggerChevronClass}>
                      <Icon
                        name="expand_more"
                        size={16}
                        className={cn("transition-transform", linkedCasesOpen && "rotate-180")}
                      />
                    </span>
                  </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 pt-density-sm">
                    {onOpenLinkModal && (
                      <button
                        type="button"
                        onClick={onOpenLinkModal}
                        className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        + Link case
                      </button>
                    )}
                    {(() => {
                      const linkedCasesSameOrg = linkedCaseNumbers
                        .map((caseNum) => resolveCase(caseNum))
                        .filter((c): c is NonNullable<typeof c> => c != null)
                        .filter((linkedCase) => getAccountById(linkedCase.accountId)?.orgId === account.orgId);
                      if (linkedCasesSameOrg.length === 0 && !onOpenLinkModal) return null;
                      if (linkedCasesSameOrg.length === 0) {
                        return (
                          <p
                            className="text-muted-foreground"
                            style={{ fontSize: "var(--tally-font-size-xs)" }}
                          >
                            No linked cases. Use &quot;Link case&quot; to add one.
                          </p>
                        );
                      }
                      return (
                        <ul className="space-y-2">
                          {linkedCasesSameOrg.map((linkedCase) => (
                            <li key={linkedCase.id}>
                              <Link
                                href={`/crm/cases/${linkedCase.id}`}
                                className="block w-full rounded-density-md border border-border bg-gray-50/80 px-density-sm py-density-sm text-left transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className="truncate font-medium text-gray-900 dark:text-gray-100"
                                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                                  >
                                    {linkedCase.caseNumber}
                                  </span>
                                </div>
                                <p
                                  className="mt-0.5 truncate text-muted-foreground"
                                  title={linkedCase.accountName}
                                  style={{ fontSize: "var(--tally-font-size-xs)" }}
                                >
                                  {linkedCase.accountName}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between gap-2">
                                  <span
                                    className="truncate text-muted-foreground"
                                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                                  >
                                    {linkedCase.status}
                                  </span>
                                  <SLAIndicator
                                    status={linkedCase.slaStatus}
                                    size="sm"
                                    showIcon={false}
                                    className="shrink-0"
                                  />
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
