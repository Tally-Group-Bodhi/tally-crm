"use client";

import React from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import { cn } from "@/lib/utils";
import type { Account, Contact } from "@/types/crm";

function DataHighlight({
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

interface ContactDetailContentProps {
  contact: Contact;
  account: Account;
  showBreadcrumbs?: boolean;
  isEditing?: boolean;
  onUpdateContact?: (updates: Partial<Contact>) => void;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

const ACTIVITY_COUNT = 5;

const formInput =
  "h-10 w-full rounded-density-md border border-border bg-white px-3 text-sm outline-none focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
const formLabel = "text-sm font-medium text-gray-900 dark:text-gray-100";

export default function ContactDetailContent({
  contact,
  account,
  showBreadcrumbs = true,
  isEditing = false,
  onUpdateContact,
  onSave,
  onCancel,
  onEdit,
}: ContactDetailContentProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const canEdit = Boolean(onSave && onCancel && onUpdateContact);

  return (
    <div className="min-w-0 w-full p-density-xl">
      <div className="mx-auto w-full min-w-0 max-w-[1400px]">
        {showBreadcrumbs && (
          <nav
            className="mb-density-md flex items-center gap-1.5 text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            <Link
              href="/crm/customer/contacts"
              className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
            >
              Contacts
            </Link>
            <Icon name="chevron_right" size={14} />
            <span
              className="font-medium text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {contact.name}
            </span>
          </nav>
        )}

        {/* Header */}
        <div className="mb-density-md flex items-start justify-between gap-4">
          <h1
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{
              fontSize: "var(--tally-font-size-xl)",
              lineHeight: "var(--tally-line-height-tight)",
            }}
          >
            {contact.name}
          </h1>
          {canEdit &&
            (isEditing ? (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="md" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="md" onClick={onSave}>
                  Save
                </Button>
              </div>
            ) : (
              <Button size="md" onClick={onEdit} className="shrink-0">
                <Icon name="edit" size={18} className="mr-1.5" />
                Edit
              </Button>
            ))}
        </div>

        {/* Contact information */}
        {canEdit && (
          <section className="mb-density-lg rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
            <h3
              className="mb-density-md font-bold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Contact information
            </h3>
            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={formLabel}>Name</label>
                  <input
                    type="text"
                    className={formInput}
                    value={contact.name}
                    onChange={(e) => onUpdateContact?.({ name: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={formLabel}>Role</label>
                  <input
                    type="text"
                    className={formInput}
                    value={contact.role}
                    onChange={(e) => onUpdateContact?.({ role: e.target.value })}
                    placeholder="e.g. Energy Manager"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={formLabel}>Email</label>
                  <input
                    type="email"
                    className={formInput}
                    value={contact.email}
                    onChange={(e) => onUpdateContact?.({ email: e.target.value })}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={formLabel}>Phone</label>
                  <input
                    type="tel"
                    className={formInput}
                    value={contact.phone}
                    onChange={(e) => onUpdateContact?.({ phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <input
                    type="checkbox"
                    id="contact-primary"
                    checked={contact.isPrimary}
                    onChange={(e) => onUpdateContact?.({ isPrimary: e.target.checked })}
                    className="h-4 w-4 rounded border-border"
                  />
                  <label htmlFor="contact-primary" className={formLabel}>
                    Primary contact for account
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-density-md sm:grid-cols-2">
                <DataHighlight label="Name" value={contact.name} />
                <DataHighlight label="Role" value={contact.role || "—"} />
                <DataHighlight label="Email" value={contact.email || "—"} />
                <DataHighlight label="Phone" value={contact.phone || "—"} />
                <DataHighlight label="Primary contact" value={contact.isPrimary ? "Yes" : "No"} />
                <div className={cn("flex flex-col gap-0.5", "sm:col-span-2")}>
                  <span
                    className="font-medium uppercase tracking-wide text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Account
                  </span>
                  <Link
                    href={`/crm/customer/accounts/${account.id}`}
                    className="text-[#006180] hover:underline dark:text-[#80E0FF]"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    {account.name}
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Small viewport: dropdown */}
          <div className="relative mb-density-md sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full cursor-pointer appearance-none rounded-density-md border border-border bg-gray-100 py-2.5 pl-3 pr-9 font-medium text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              <option value="overview">Overview</option>
              <option value="activities">Activities</option>
            </select>
            <Icon
              name="expand_more"
              size={20}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400"
            />
          </div>

          {/* Horizontal tabs */}
          <div className="mb-density-md">
            <TabsList className="hidden h-10 gap-1 rounded-density-md bg-gray-100 p-1 dark:bg-gray-800 sm:inline-flex">
              <TabsTrigger
                value="overview"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="activities"
                className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Activities
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview tab */}
          <TabsContent value="overview" className="mt-0 w-full">
            <div className="flex flex-col gap-density-lg">
              {/* Data highlights */}
              <section className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <h3
                  className="mb-density-md font-bold text-gray-900 dark:text-gray-100"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  Data highlights
                </h3>
                <div className="grid grid-cols-1 gap-density-md sm:grid-cols-2">
                  <DataHighlight label="Create date" value={contact.createDate} />
                  <DataHighlight label="Last activity date" value={contact.lastActivityDate} />
                </div>
              </section>

              {/* Recent activities */}
              <section className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-density-md flex flex-wrap items-center justify-between gap-3">
                  <h3
                    className="font-bold text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    Recent activities
                  </h3>
                </div>
                <div className="mb-density-md flex flex-wrap items-center gap-density-sm">
                  <div className="relative min-w-[180px] flex-1">
                    <Icon
                      name="search"
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="search"
                      placeholder="Search activities"
                      className="w-full rounded-density-md border border-border bg-gray-50 py-2 pl-9 pr-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    />
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-density-md border border-border bg-white px-density-md py-density-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    Filter by: {ACTIVITY_COUNT} activities
                    <Icon name="expand_more" size={16} />
                  </button>
                  <button
                    type="button"
                    className="rounded-density-md border border-border bg-white px-density-md py-density-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    All time so far
                  </button>
                </div>
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center rounded-density-md border border-dashed border-border py-12 dark:border-gray-700">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <Icon name="search" size={32} className="text-muted-foreground" />
                  </div>
                  <p
                    className="mt-4 font-medium text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    No activities.
                  </p>
                  <p
                    className="mt-1 text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    Activities for this contact will appear here.
                  </p>
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="mt-0 w-full">
            <div className="rounded-density-md border border-border bg-white p-density-lg dark:border-gray-700 dark:bg-gray-900">
              <h3
                className="font-bold text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Activities
              </h3>
              <p
                className="mt-density-sm text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Activity history for this contact.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
