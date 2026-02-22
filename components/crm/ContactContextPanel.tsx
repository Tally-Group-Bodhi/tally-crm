"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Button from "@/components/Button/Button";
import { Icon } from "@/components/ui/icon";
import { getOrgById } from "@/lib/mock-data/accounts";
import type { Account, Contact } from "@/types/crm";

interface ContactContextPanelProps {
  contact: Contact;
  account: Account;
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
        {value ?? "—"}
      </span>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Note", icon: "edit" as const },
  { label: "Email", icon: "mail" as const },
  { label: "Call", icon: "call" as const },
  { label: "Task", icon: "assignment" as const },
  { label: "Meeting", icon: "event" as const },
] as const;

export default function ContactContextPanel({
  contact,
  account,
  className,
}: ContactContextPanelProps) {
  const initials = contact.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <aside
      className={cn(
        "flex min-h-0 w-52 min-w-0 shrink-0 flex-col border-r border-border bg-white dark:border-gray-800 dark:bg-gray-950 sm:w-64 md:w-72",
        className
      )}
    >
      {/* Header — avatar + name + email, Edit button */}
      <div className="flex items-start gap-3 border-b border-border px-density-md py-density-md dark:border-gray-800">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2C365D] font-bold text-white"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="font-bold text-gray-900 dark:text-gray-100 break-words"
            style={{ fontSize: "var(--tally-font-size-base)", lineHeight: "var(--tally-line-height-tight)" }}
          >
            {contact.name}
          </p>
          <p
            className="text-muted-foreground break-words"
            title={contact.email}
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            {contact.email || "—"}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1 px-2" style={{ fontSize: "var(--tally-font-size-xs)" }}>
          <Icon name="edit" size={14} />
          Edit
        </Button>
      </div>

      {/* Quick actions — separate section */}
      <div className="border-b border-border px-density-md py-density-sm dark:border-gray-800">
        <div className="flex w-full justify-between">
          {QUICK_ACTIONS.map(({ label, icon }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-0.5 rounded-density-sm p-1.5 text-muted-foreground transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100"
              title={label}
            >
              <Icon name={icon} size={18} />
              <span style={{ fontSize: "var(--tally-font-size-xs)" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Org — single full-width border below only (above = Quick actions' border-b) */}
      <div className="border-b border-border dark:border-gray-800">
        <div className="px-density-md py-density-md">
          <span
            className="font-medium uppercase tracking-wide text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
          >
            Org
          </span>
          {(() => {
            const org = getOrgById(account.orgId);
            return org ? (
              <Link
                href="/crm/customer/orgs"
                className="mt-1 block truncate font-medium text-[#006180] hover:underline dark:text-[#80E0FF]"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                {org.name}
              </Link>
            ) : (
              <p
                className="mt-1 truncate text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                —
              </p>
            );
          })()}
        </div>
      </div>

      {/* Contact details — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-density-md py-density-sm">
        <div className="flex flex-col gap-density-sm pl-0 pr-1">
          <DataRow label="Role" value={contact.role} />
          <DataRow label="Email" value={contact.email} />
          <DataRow label="Phone number" value={contact.phone} />
          <DataRow label="Preferred channels" value={contact.preferredChannels} />
          <DataRow label="Create date" value={contact.createDate} />
        </div>
      </div>
    </aside>
  );
}
