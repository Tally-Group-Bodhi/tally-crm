"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import { cn } from "@/lib/utils";
import { getOrgById, getAccountsByOrgId } from "@/lib/mock-data/accounts";
import type { Account, AccountType, Contact, Org, OrgType } from "@/types/crm";

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "Parent Company", label: "Parent Company" },
  { value: "Subsidiary", label: "Subsidiary" },
  { value: "Division", label: "Division" },
];

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
];

const ACCOUNT_STATUSES = ["Active", "Suspended", "Closed"] as const;

function cloneOrg(org: Org): Org {
  return JSON.parse(JSON.stringify(org));
}

/* ─── Add Account Modal (org scoped) ─────────────────────────────────────── */

function AddAccountModal({
  orgId,
  orgName,
  onClose,
  onAdd,
}: {
  orgId: string;
  orgName: string;
  onClose: () => void;
  onAdd: (account: Account) => void;
}) {
  const [name, setName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [type, setType] = React.useState<AccountType>("Commercial");
  const [status, setStatus] = React.useState<"Active" | "Suspended" | "Closed">("Active");
  const [address, setAddress] = React.useState("");

  const formInput =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const formLabel =
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
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
      aria-labelledby="add-account-modal-title"
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
              id="add-account-modal-title"
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Add account
            </h2>
            <p className="text-sm text-muted-foreground">
              Add an account under {orgName}
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

export default function OrgDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const initialOrg = getOrgById(id);

  const [org, setOrg] = React.useState<Org | null>(() =>
    initialOrg ? cloneOrg(initialOrg) : null
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [addAccountModalOpen, setAddAccountModalOpen] = React.useState(false);
  const [localAccounts, setLocalAccounts] = React.useState<Account[]>([]);

  React.useEffect(() => {
    const next = getOrgById(id);
    setOrg(next ? cloneOrg(next) : null);
    setLocalAccounts([]);
  }, [id]);

  const updateOrg = (updates: Partial<Org>) => {
    setOrg((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    const next = getOrgById(id);
    setOrg(next ? cloneOrg(next) : null);
    setIsEditing(false);
  };

  if (!org) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Organisation not found.</p>
      </div>
    );
  }

  const mockAccountsForOrg = getAccountsByOrgId(org.id);
  const accounts = [...mockAccountsForOrg, ...localAccounts];

  const handleAddAccount = (account: Account) => {
    setLocalAccounts((prev) => [account, ...prev]);
  };

  const formInput =
    "h-10 w-full rounded-density-md border border-border bg-white px-3 text-sm outline-none focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const formLabel = "text-sm font-medium text-gray-900 dark:text-gray-100";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1400px] p-6">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link
            href="/crm/customer"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            Customer Management
          </Link>
          <Icon name="chevron_right" size={14} />
          <Link
            href="/crm/customer/orgs"
            className="transition-colors hover:text-gray-900 dark:hover:text-gray-100"
          >
            Org Management
          </Link>
          <Icon name="chevron_right" size={14} />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {org.name}
          </span>
        </nav>

        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              {org.name}
            </h1>
            {!isEditing && (org.type || org.abnAcn) && (
              <p className="mt-1 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                {[org.type, org.abnAcn].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="md" onClick={handleSave}>
                Save
              </Button>
            </div>
          ) : (
            <Button size="md" onClick={() => setIsEditing(true)}>
              <Icon name="edit" size={18} className="mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Basic information */}
          <section className="rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Basic information
            </h2>
            {isEditing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={formLabel}>Org name</label>
                  <input
                    type="text"
                    className={formInput}
                    value={org.name}
                    onChange={(e) => updateOrg({ name: e.target.value })}
                    placeholder="Organisation name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={formLabel}>Type</label>
                  <select
                    className={formInput}
                    value={org.type ?? ""}
                    onChange={(e) =>
                      updateOrg({ type: (e.target.value || undefined) as OrgType | undefined })
                    }
                  >
                    <option value="">Select type</option>
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={formLabel}>ABN/ACN</label>
                  <input
                    type="text"
                    className={formInput}
                    value={org.abnAcn ?? ""}
                    onChange={(e) => updateOrg({ abnAcn: e.target.value || undefined })}
                    placeholder="e.g. 12 345 678 901"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={formLabel}>Address</label>
                  <input
                    type="text"
                    className={formInput}
                    value={org.address ?? ""}
                    onChange={(e) => updateOrg({ address: e.target.value || undefined })}
                    placeholder="Street address"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Org name
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{org.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Type
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{org.type ?? "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      ABN/ACN
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{org.abnAcn ?? "—"}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Address
                    </span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{org.address ?? "—"}</p>
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Accounts ({accounts.length})
              </h2>
              <Button
                size="md"
                variant="outline"
                className="gap-1.5"
                onClick={() => setAddAccountModalOpen(true)}
              >
                <Icon name="add" size={18} className="mr-1" />
                Add account
              </Button>
            </div>
            {accounts.length === 0 ? (
              <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                No accounts linked to this organisation.
              </p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((acc) => (
                  <li key={acc.id}>
                    <Link
                      href={`/crm/customer/accounts/${acc.id}`}
                      className="font-medium text-[#006180] hover:underline dark:text-[#80E0FF]"
                    >
                      {acc.name}
                    </Link>
                    <span className="ml-2 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                      {acc.accountNumber} · {acc.contacts.length} contact{acc.contacts.length !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {addAccountModalOpen && (
        <AddAccountModal
          orgId={org.id}
          orgName={org.name}
          onClose={() => setAddAccountModalOpen(false)}
          onAdd={handleAddAccount}
        />
      )}
    </div>
  );
}
