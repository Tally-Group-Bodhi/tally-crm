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
import { mockOrgs, getAccountsByOrgId } from "@/lib/mock-data/accounts";
import type { Org, OrgType } from "@/types/crm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import { SummaryCard, EntityCard, CardGrid } from "@/components/crm/ManagementGrid";

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

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: "Parent Company", label: "Parent Company" },
  { value: "Subsidiary", label: "Subsidiary" },
  { value: "Division", label: "Division" },
];

/* ─── New Org Modal ────────────────────────────────────────────────────── */

function NewOrgModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (org: Org) => void;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<OrgType>("Parent Company");
  const [abnAcn, setAbnAcn] = React.useState("");
  const [address, setAddress] = React.useState("");

  const formInput =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const formLabel = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: `org-new-${Date.now()}`,
      name: name.trim(),
      type,
      abnAcn: abnAcn.trim() || undefined,
      address: address.trim() || undefined,
    });
    setName("");
    setType("Parent Company");
    setAbnAcn("");
    setAddress("");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-org-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-[400px] overflow-y-auto rounded-xl border border-border bg-card shadow-xl dark:border-gray-700 dark:bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-6 dark:border-gray-700">
          <div className="space-y-1.5">
            <h2
              id="new-org-modal-title"
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Add New Org
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter organisation details below
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
                Org name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={formInput}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Organisation name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className={formLabel}>Org type</label>
              <div className="relative">
                <select
                  className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                  value={type}
                  onChange={(e) => setType(e.target.value as OrgType)}
                >
                  {ORG_TYPES.map((t) => (
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
              <label className={formLabel}>ABN/ACN</label>
              <input
                type="text"
                className={formInput}
                value={abnAcn}
                onChange={(e) => setAbnAcn(e.target.value)}
                placeholder="e.g. 12 345 678 901 or 123 456 789"
              />
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

export default function OrgManagementPage() {
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [localOrgs, setLocalOrgs] = React.useState<Org[]>([]);
  const [activeTab, setActiveTab] = React.useState("table");

  const allOrgs = React.useMemo(() => [...mockOrgs, ...localOrgs], [localOrgs]);

  const filteredOrgs = React.useMemo(() => {
    if (!search.trim()) return allOrgs;
    const q = search.toLowerCase();
    return allOrgs.filter((org) => org.name.toLowerCase().includes(q));
  }, [allOrgs, search]);

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
              Org Management
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Parent companies and organisations
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
                placeholder="Search organisations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-density-md border border-border bg-white py-2 pl-9 pr-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              />
            </div>
            <Button size="md" className="gap-1.5" onClick={() => setModalOpen(true)}>
              <Icon name="add" size={18} className="mr-1" />
              Add New Org
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 h-10 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <TabsTrigger
              value="table"
              className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            >
              Table
            </TabsTrigger>
            <TabsTrigger
              value="org-chart"
              className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            >
              Org Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-0">
            <div className="rounded-lg border border-border bg-white dark:border-gray-700 dark:bg-gray-900">
              <Table dense>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Org name</TableHead>
                    <TableHead className="text-right">Accounts</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Contacts</TableHead>
                    <TableHead className="w-10" aria-hidden />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs.map((org: Org) => {
                    const accounts = getAccountsByOrgId(org.id);
                    const firstAccount = accounts[0];
                    const totalContacts = accounts.reduce((sum, acc) => sum + acc.contacts.length, 0);
                    return (
                      <TableRow key={org.id}>
                        <TableCell>
                          <Link
                            href={`/crm/customer/orgs/${org.id}`}
                            className="font-medium text-[#006180] hover:underline dark:text-[#80E0FF]"
                          >
                            {org.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{accounts.length}</TableCell>
                        <TableCell>
                          {firstAccount ? (
                            <Badge variant={typeVariant[firstAccount.type] ?? "outline"} className="text-xs">
                              {firstAccount.type}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {firstAccount ? (
                            <Badge variant={statusVariant[firstAccount.status] ?? "outline"} className="text-xs">
                              {firstAccount.status}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{totalContacts}</TableCell>
                        <TableCell>
                          <Link
                            href={`/crm/customer/orgs/${org.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                            aria-label={`Open ${org.name}`}
                          >
                            <Icon name="chevron_right" size={18} />
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredOrgs.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No organisations match your search.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="org-chart" className="mt-0">
            <div className="rounded-lg border border-[#e0e0e0] bg-[#f5f5f5] p-6 dark:border-gray-700 dark:bg-gray-900/50">
              <SummaryCard
                icon={<Icon name="apartment" size={22} className="text-[#5b21b6]" />}
                title="Organisations"
                count={filteredOrgs.length}
                countLabel={filteredOrgs.length === 1 ? "organisation" : "organisations"}
              />
              <CardGrid>
                {filteredOrgs.map((org: Org) => {
                  const accounts = getAccountsByOrgId(org.id);
                  const totalContacts = accounts.reduce((sum, acc) => sum + acc.contacts.length, 0);
                  const sublabel = [
                    accounts.length ? `${accounts.length} account${accounts.length !== 1 ? "s" : ""}` : null,
                    totalContacts ? `${totalContacts} contact${totalContacts !== 1 ? "s" : ""}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <EntityCard
                      key={org.id}
                      type="org"
                      name={org.name}
                      sublabel={sublabel || undefined}
                      href={`/crm/customer/orgs/${org.id}`}
                    />
                  );
                })}
              </CardGrid>
              {filteredOrgs.length === 0 && (
                <div className="py-12 text-center text-sm text-[#616161] dark:text-gray-400">
                  No organisations match your search.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {modalOpen && (
        <NewOrgModal
          onClose={() => setModalOpen(false)}
          onAdd={(org) => setLocalOrgs((prev) => [org, ...prev])}
        />
      )}
    </div>
  );
}
