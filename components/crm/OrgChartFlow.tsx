"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  type Node,
  type Edge,
  type NodeProps,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAccountsByOrgId, getAccountById } from "@/lib/mock-data/accounts";
import { getCasesByAccountId } from "@/lib/mock-data/cases";
import type { Org } from "@/types/crm";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const CARD_W = { gp: 380, company: 230 };
const CARD_H = { gp: 72, company: 68 };
const V_GAP = 80;
const H_GAP = 40;

const BASE_CARD = {
  background: "#ffffff",
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "10px 14px",
  fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
  cursor: "default",
  transition: "box-shadow 0.15s",
} as const;

function getInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

const AVATAR_HEX = ["#8b5cf6", "#3b82f6", "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"] as const;

function getAvatarHex(name: string, index: number): string {
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_HEX[(hash + index) % AVATAR_HEX.length];
}

type OrgChartNodeData = {
  label?: string;
  sublabel?: string;
  href?: string;
  type: "org" | "account";
  accountNumber?: string;
  /** When viewing from an account, the main account is emphasized */
  isFocus?: boolean;
  /** Linked / other accounts when a focus account is set – shown subtly */
  isSubtle?: boolean;
};

function OrgNode({ data }: NodeProps<Node<OrgChartNodeData>>) {
  return (
    <div
      style={{
        ...BASE_CARD,
        width: CARD_W.gp,
        height: CARD_H.gp,
        borderLeft: "3px solid #6264a7",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(98,100,167,0.15)",
        position: "relative",
      }}
    >
      <Handle id="source" type="source" position={Position.Bottom} style={{ background: "#bdbdbd", width: 8, height: 8 }} />
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 8,
          background: "#ede9fe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name="apartment" size={22} className="text-[#5b21b6]" />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#252423", lineHeight: 1.3 }}>{data.label}</div>
        {data.sublabel && (
          <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>{data.sublabel}</div>
        )}
      </div>
    </div>
  );
}

function AccountNode({ data }: NodeProps<Node<OrgChartNodeData>>) {
  const isFocus = data.isFocus;
  const isSubtle = data.isSubtle;
  const initials = data.label ? getInitials(data.label) : "?";
  const hex = getAvatarHex(data.label ?? "", 0);
  const content = (
    <div
      style={{
        ...BASE_CARD,
        width: CARD_W.company,
        height: CARD_H.company,
        borderLeft: `3px solid ${isFocus ? "#6264a7" : "#c7c7c7"}`,
        boxShadow: isFocus
          ? "0 0 0 2px #dce0f5, 0 2px 8px rgba(98,100,167,0.15)"
          : "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
        position: "relative",
        background: isSubtle ? "#fafafa" : undefined,
      }}
    >
      <Handle id="target" type="target" position={Position.Top} style={{ background: "#bdbdbd", width: 8, height: 8 }} />
      <Handle id="source" type="source" position={Position.Bottom} style={{ background: "#bdbdbd", width: 8, height: 8 }} />
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: hex,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
          letterSpacing: "0.3px",
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: isSubtle ? "#8a8886" : "#252423",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.label}
        </div>
        {data.accountNumber && (
          <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>{data.accountNumber}</div>
        )}
      </div>
    </div>
  );
  if (data.href) {
    return (
      <Link href={data.href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

const nodeTypes = {
  org: OrgNode,
  account: AccountNode,
};

function getAccountsToShow(org: Org, focusAccountId: string | undefined): ReturnType<typeof getAccountsByOrgId> {
  const allAccounts = getAccountsByOrgId(org.id);
  if (!focusAccountId) return allAccounts;
  const focusAccount = allAccounts.find((a) => a.id === focusAccountId) ?? getAccountById(focusAccountId);
  if (!focusAccount || focusAccount.orgId !== org.id) return [];
  const linkedIds = new Set(focusAccount.linkedAccountIds ?? []);
  const accountsLinkingHere = allAccounts.filter((a) => a.linkedAccountIds?.includes(focusAccountId));
  const idsToShow = new Set([focusAccountId, ...linkedIds, ...accountsLinkingHere.map((a) => a.id)]);
  return allAccounts.filter((a) => idsToShow.has(a.id));
}

function buildOrgChartData(orgs: Org[], focusAccountId: string | undefined) {
  const nodes: Node<OrgChartNodeData>[] = [];
  const edges: Edge[] = [];
  const nodeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  const addNode = (node: Node<OrgChartNodeData>) => {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  };

  const addEdge = (edge: Edge) => {
    const key = `${edge.source}-${edge.target}-${edge.sourceHandle ?? ""}-${edge.targetHandle ?? ""}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({
      ...edge,
      sourceHandle: edge.sourceHandle ?? "source",
      targetHandle: edge.targetHandle ?? "target",
    });
  };

  const companyColWidth = CARD_W.company + H_GAP;
  const accountRowY = CARD_H.gp + V_GAP;

  for (const org of orgs) {
    const accounts = getAccountsToShow(org, focusAccountId);
    const orgId = `org-${org.id}`;
    const numAccounts = accounts.length;
    const totalW = numAccounts * CARD_W.company + (numAccounts - 1) * H_GAP;
    const centerX = numAccounts > 0 ? (CARD_W.gp / 2 - totalW / 2) : 0;

    addNode({
      id: orgId,
      type: "org",
      position: { x: 0, y: 0 },
      data: { label: org.name, type: "org" },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    });

    const hasFocus = !!focusAccountId;
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const accId = `acc-${account.id}`;
      const accX = centerX + i * companyColWidth;
      const isFocus = hasFocus && account.id === focusAccountId;
      const isSubtle = hasFocus && account.id !== focusAccountId;

      addNode({
        id: accId,
        type: "account",
        position: { x: accX, y: accountRowY },
        data: {
          label: account.name,
          accountNumber: account.accountNumber,
          type: "account",
          href: `/crm/customer/accounts/${account.id}`,
          isFocus,
          isSubtle,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      } as Node<OrgChartNodeData>);
      addEdge({ id: `e-${orgId}-${accId}`, source: orgId, target: accId });

      if (account.linkedAccountIds?.length) {
        for (const linkedId of account.linkedAccountIds) {
          const targetAccId = `acc-${linkedId}`;
          if (accId < targetAccId) {
            addEdge({
              id: `link-${accId}-${targetAccId}`,
              source: accId,
              target: targetAccId,
              type: "smoothstep",
              style: { stroke: "#c7c7c7", strokeWidth: 1.5, strokeDasharray: "4 3" },
              zIndex: -1,
            });
          }
        }
      }
    }
  }

  // Final safety: ensure only one edge per (source, target) so React Flow never draws duplicate lines
  const seen = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    const k = `${e.source}-${e.target}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { nodes, edges: uniqueEdges };
}

export default function OrgChartFlow({
  orgs,
  focusAccountId,
}: {
  orgs: Org[];
  focusAccountId?: string;
}) {
  const [selectedAccountId, setSelectedAccountId] = React.useState<string | null>(null);

  const isOrgOnlyView = orgs.length === 1 && !focusAccountId;
  const orgOnly = isOrgOnlyView ? orgs[0]! : null;
  const orgOnlyAccounts = orgOnly ? getAccountsByOrgId(orgOnly.id) : [];

  const { nodes, edges } = useMemo(
    () => buildOrgChartData(orgs, focusAccountId),
    [orgs, focusAccountId]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      style: { stroke: "#c7c7c7", strokeWidth: 1.5 },
      zIndex: 0,
    }),
    []
  );

  const accountsWithContacts = useMemo(() => {
    const list: { account: { id: string; name: string; accountNumber?: string }; contacts: { id: string; name: string; role?: string }[] }[] = [];
    for (const org of orgs) {
      const accounts = getAccountsToShow(org, focusAccountId);
      for (const account of accounts) {
        const seen = new Set<string>();
        const contacts = account.contacts.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        if (contacts.length > 0) {
          list.push({
            account: { id: account.id, name: account.name, accountNumber: account.accountNumber },
            contacts: contacts.map((c) => ({ id: c.id, name: c.name, role: c.role })),
          });
        }
      }
    }
    return list;
  }, [orgs, focusAccountId]);

  if (isOrgOnlyView && orgOnly) {
    const selectedAccount = selectedAccountId ? orgOnlyAccounts.find((a) => a.id === selectedAccountId) : null;
    const selectedContacts = selectedAccount
      ? [...new Map(selectedAccount.contacts.map((c) => [c.id, c])).values()]
      : [];
    const accountCases = selectedAccount ? getCasesByAccountId(selectedAccount.id) : [];

    return (
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-0">
        <div className="rounded-t-lg border border-[#e0e0e0] bg-[#f5f5f5] p-6 dark:border-gray-700 dark:bg-gray-900/50">
          <div
            style={{
              ...BASE_CARD,
              width: "100%",
              maxWidth: CARD_W.gp,
              height: CARD_H.gp,
              borderLeft: "3px solid #6264a7",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(98,100,167,0.15)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 8,
                background: "#ede9fe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="apartment" size={22} className="text-[#5b21b6]" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#252423", lineHeight: 1.3 }}>{orgOnly.name}</div>
              <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>
                {orgOnlyAccounts.length} account{orgOnlyAccounts.length !== 1 ? "s" : ""} in this organisation
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {orgOnlyAccounts.map((account) => {
              const isSelected = selectedAccountId === account.id;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedAccountId(isSelected ? null : account.id)}
                  className="text-left"
                  style={{
                    ...BASE_CARD,
                    width: "100%",
                    minHeight: CARD_H.company,
                    borderLeft: `3px solid ${isSelected ? "#6264a7" : "#c7c7c7"}`,
                    boxShadow: isSelected
                      ? "0 0 0 2px #dce0f5, 0 2px 8px rgba(98,100,167,0.15)"
                      : "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: getAvatarHex(account.name, 0),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      flexShrink: 0,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {getInitials(account.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#252423",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {account.name}
                    </div>
                    {account.accountNumber && (
                      <div style={{ fontSize: 11, color: "#8a8886", marginTop: 2 }}>{account.accountNumber}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedAccount && (
          <div className="rounded-b-lg border border-t-0 border-[#e0e0e0] bg-white p-5 dark:border-gray-700 dark:bg-gray-900/30">
            {accountCases.length > 0 && (
              <div className="mb-6">
                <div className="mb-3 text-[12px] font-normal text-[#616161] dark:text-gray-400">
                  Cases at {selectedAccount.name} ({accountCases.length})
                </div>
                <div className="space-y-4">
                  {accountCases.map((caseItem) => (
                    <div
                      key={caseItem.id}
                      className="rounded-lg border border-[#e0e0e0] bg-[#fafafa] p-4 dark:border-gray-600 dark:bg-gray-800/40"
                    >
                      <Link
                        href={`/crm/cases/${caseItem.id}`}
                        className="mb-3 flex items-center gap-2 font-semibold text-[#252423] hover:text-[#6264a7] dark:text-gray-100 dark:hover:text-violet-400"
                        style={{ fontSize: 13 }}
                      >
                        {caseItem.caseNumber}
                        <span className="font-normal text-[#616161] dark:text-gray-400">
                          · {caseItem.type} · {caseItem.subType} · {caseItem.status}
                        </span>
                      </Link>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8886] dark:text-gray-500">
                            Contacts
                          </div>
                          {selectedContacts.length === 0 ? (
                            <p className="text-[12px] text-[#616161] dark:text-gray-400">No contacts</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {selectedContacts.slice(0, 5).map((contact) => (
                                <Link
                                  key={contact.id}
                                  href={`/crm/customer/contacts?contact=${contact.id}`}
                                  className="flex items-center gap-1.5 rounded-md border border-[#e0e0e0] bg-white px-2 py-1.5 text-[12px] transition-colors hover:bg-[#f3f2f1] dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                                >
                                  <div
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                                    style={{ background: getAvatarHex(contact.name, 1) }}
                                  >
                                    {getInitials(contact.name)}
                                  </div>
                                  <span className="font-medium text-[#252423] dark:text-gray-100">{contact.name}</span>
                                  {contact.role && (
                                    <span className="text-[11px] text-[#616161] dark:text-gray-400">· {contact.role}</span>
                                  )}
                                </Link>
                              ))}
                              {selectedContacts.length > 5 && (
                                <span className="text-[11px] text-[#616161] dark:text-gray-400">
                                  +{selectedContacts.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#8a8886] dark:text-gray-500">
                            Assigned
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md border border-[#e0e0e0] bg-white px-2 py-1.5 text-[12px] dark:border-gray-600 dark:bg-gray-800"
                              style={{ borderLeft: "3px solid #0d9488" }}
                            >
                              <span className="font-medium text-[#252423] dark:text-gray-100">{caseItem.owner}</span>
                              <span className="text-[11px] text-[#616161] dark:text-gray-400">· {caseItem.team}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-3 text-[12px] font-normal text-[#616161] dark:text-gray-400">
              People at {selectedAccount.name} ({selectedContacts.length})
            </div>
            {selectedContacts.length === 0 ? (
              <p className="text-[12px] text-[#616161] dark:text-gray-400">No contacts for this account.</p>
            ) : (
              <div className="grid grid-cols-1 gap-x-2 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {selectedContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/crm/customer/contacts?contact=${contact.id}`}
                    className="flex items-center gap-2.5 rounded-md py-1.5 pr-2 transition-colors hover:bg-[#f3f2f1] dark:hover:bg-gray-700/50"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                      style={{ background: getAvatarHex(contact.name, 1) }}
                    >
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[#252423] dark:text-gray-100">
                        {contact.name}
                      </div>
                      {contact.role && (
                        <div className="truncate text-[11px] text-[#616161] dark:text-gray-400">{contact.role}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-border bg-gray-50 dark:bg-gray-800/50">
        <p className="text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
          {focusAccountId
            ? "No related accounts to display for this account."
            : "No organisations to display. Add an org to see the chart."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-col gap-0">
      <div
        className="w-full rounded-t-lg border border-b-0 border-[#e0e0e0] bg-[#f5f5f5] dark:border-gray-700 dark:bg-gray-900/50"
        style={{ height: 320 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={1}
          maxZoom={1}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
          className="rounded-t-lg"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d4d4d4" />
        </ReactFlow>
      </div>
      <div className="flex flex-col gap-4 rounded-b-lg border border-[#e0e0e0] bg-white p-5 dark:border-gray-700 dark:bg-gray-900/30">
        {accountsWithContacts.length === 0 ? (
          <p className="text-[12px] text-[#616161] dark:text-gray-400">No contacts to display.</p>
        ) : (
          accountsWithContacts.map(({ account, contacts }) => (
            <div
              key={account.id}
              className="rounded-lg border border-[#e0e0e0] bg-white p-4 dark:border-gray-600 dark:bg-gray-800/50"
            >
              <div className="mb-3 text-[12px] font-normal text-[#616161] dark:text-gray-400">
                People at {account.name} ({contacts.length})
              </div>
              <div className="grid grid-cols-1 gap-x-2 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/crm/customer/contacts?contact=${contact.id}`}
                    className="flex items-center gap-2.5 rounded-md py-1.5 pr-2 transition-colors hover:bg-[#f3f2f1] dark:hover:bg-gray-700/50"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                      style={{ background: getAvatarHex(contact.name, 1) }}
                    >
                      {getInitials(contact.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[#252423] dark:text-gray-100">
                        {contact.name}
                      </div>
                      {contact.role && (
                        <div className="truncate text-[11px] text-[#616161] dark:text-gray-400">
                          {contact.role}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
