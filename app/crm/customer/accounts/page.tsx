"use client";

import React from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/Table/Table";
import Badge from "@/components/Badge/Badge";
import Button from "@/components/Button/Button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { mockAccounts, mockOrgs } from "@/lib/mock-data/accounts";
import type { Account, AccountType, Contact } from "@/types/crm";
const statusVariant: Record<string, "success" | "error" | "outline"> = {
  Active: "success",
  Suspended: "error",
  Closed: "outline",
};

const typeVariant: Record<string, "default" | "info" | "secondary"> = {
  Industrial: "default",
  Commercial: "info",
  Residential: "secondary",
};

/* ─── New Account Modal ─────────────────────────────────────────────────── */

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
];

const ACCOUNT_STATUSES = ["Active", "Suspended", "Closed"] as const;

function NewAccountModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (account: Account) => void;
}) {
  const [orgId, setOrgId] = React.useState("");
  const [name, setName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [type, setType] = React.useState<AccountType>("Commercial");
  const [status, setStatus] = React.useState<"Active" | "Suspended" | "Closed">("Active");
  const [address, setAddress] = React.useState("");

  const formInput =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const formLabel = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !orgId) return;
    const placeholderContact: Contact = {
      id: `con-placeholder-${Date.now()}`,
      name: "",
      role: "",
      email: "",
      phone: "",
      isPrimary: true,
    };
    const account: Account = {
      id: `acc-new-${Date.now()}`,
      orgId,
      name: name.trim(),
      accountNumber: accountNumber.trim(),
      type,
      status,
      sites: [],
      nmis: [],
      energyType: "Electricity",
      primaryContact: placeholderContact,
      contacts: [],
      address: address.trim(),
      annualConsumption: "",
      accountBalance: "",
      lastPaymentDate: "",
      lastPaymentAmount: "",
      contractEndDate: "",
    };
    onAdd(account);
    setOrgId("");
    setName("");
    setAccountNumber("");
    setType("Commercial");
    setStatus("Active");
    setAddress("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-account-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-xl border border-border bg-card shadow-xl dark:border-gray-700 dark:bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6 dark:border-gray-700">
          <div className="space-y-1.5">
            <h2
              id="new-account-modal-title"
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Add New Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter account details below
            </p>
          </div>
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
          <div className="space-y-4 px-6 py-6">
            <div className="space-y-1.5">
              <label className={formLabel}>
                Org <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  required
                >
                  <option value="">Select org</option>
                  {mockOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
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

            <div className="space-y-1.5">
              <label className={formLabel}>
                Account name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Account name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={formLabel}>Account number</label>
              <input
                type="text"
                className={formInput}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. LM-0045721"
              />
            </div>

            <div className="space-y-1.5">
              <label className={formLabel}>Type</label>
              <div className="relative">
                <select
                  className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
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

            <div className="space-y-1.5">
              <label className={formLabel}>Status</label>
              <div className="relative">
                <select
                  className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "Active" | "Suspended" | "Closed")
                  }
                >
                  {ACCOUNT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
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

            <div className="space-y-1.5">
              <label className={formLabel}>Address</label>
              <input
                type="text"
                className={formInput}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4 dark:border-gray-700">
            <Button variant="outline" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button size="md" type="submit">
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AccountManagementPage() {
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [localAccounts, setLocalAccounts] = React.useState<Account[]>([]);

  const allAccounts = React.useMemo(
    () => [...mockAccounts, ...localAccounts],
    [localAccounts]
  );

  const filteredAccounts = React.useMemo(() => {
    if (!search.trim()) return allAccounts;
    const q = search.toLowerCase();
    return allAccounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q)
    );
  }, [allAccounts, search]);

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        {/* Page header — matches Case Queue */}
        <div className="mb-density-xl flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Account management
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Accounts within each org — departments, sections, and sites
            </p>
          </div>
          <div className="flex items-center gap-density-md">
            <div className="relative w-64 min-w-[200px]">
              <Icon
                name="search"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-density-md border border-border bg-white py-2 pl-9 pr-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              />
            </div>
            <Button size="md" className="gap-1.5" onClick={() => setModalOpen(true)}>
              <Icon name="add" size={18} className="mr-1" />
              Add New Account
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white dark:border-gray-700 dark:bg-gray-900">
              <Table dense>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Account name</TableHead>
                    <TableHead>Account number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Contacts</TableHead>
                    <TableHead className="w-10" aria-hidden />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account: Account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <Link
                          href={`/crm/customer/accounts/${account.id}`}
                          className="font-medium text-[#006180] hover:underline dark:text-[#80E0FF]"
                        >
                          {account.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{account.accountNumber}</TableCell>
                      <TableCell>
                        <Badge variant={typeVariant[account.type] ?? "outline"} className="text-xs">
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[account.status] ?? "outline"} className="text-xs">
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{account.contacts.length}</TableCell>
                      <TableCell>
                        <Link
                          href={`/crm/customer/accounts/${account.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                          aria-label={`Open ${account.name} settings`}
                        >
                          <Icon name="chevron_right" size={18} />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAccounts.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No accounts match your search.</div>
              )}
            </div>
      </div>

      {modalOpen && (
        <NewAccountModal
          onClose={() => setModalOpen(false)}
          onAdd={(account) => setLocalAccounts((prev) => [account, ...prev])}
        />
      )}
    </div>
  );
}
