"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Tabs/Tabs";
import { getOrgById, getAccountsByOrgId } from "@/lib/mock-data/accounts";
import type { Org } from "@/types/crm";
import OrgChartFlow from "@/components/crm/OrgChartFlow";

export default function OrgDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const org = getOrgById(id);
  const [activeTab, setActiveTab] = React.useState("details");

  if (!org) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">Organisation not found.</p>
      </div>
    );
  }

  const accounts = getAccountsByOrgId(org.id);

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

        <div className="mb-6">
          <h1
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{
              fontSize: "var(--tally-font-size-3xl)",
              lineHeight: "var(--tally-line-height-tight)",
            }}
          >
            {org.name}
          </h1>
          {(org.type || org.abnAcn) && (
            <p className="mt-1 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
              {[org.type, org.abnAcn].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 h-10 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
            <TabsTrigger
              value="details"
              className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="org-chart"
              className="text-gray-700 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:text-gray-300 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100"
            >
              Org Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-0">
            <div className="space-y-6">
              {org.address && (
                <section className="rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Address
                  </h2>
                  <p className="text-gray-900 dark:text-gray-100">{org.address}</p>
                </section>
              )}
              <section className="rounded-lg border border-border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Accounts ({accounts.length})
                </h2>
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
          </TabsContent>

          <TabsContent value="org-chart" className="mt-0">
            <OrgChartFlow orgs={[org]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
