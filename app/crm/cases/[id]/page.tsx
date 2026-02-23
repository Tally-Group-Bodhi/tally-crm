"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { getCaseById } from "@/lib/mock-data/cases";
import { getSessionCase, setSessionCase } from "@/lib/session-cases";
import { getAccountById } from "@/lib/mock-data/accounts";
import { useCaseLinksOverrides } from "@/lib/case-links-overrides";
import AccountContextPanel from "@/components/crm/AccountContextPanel";
import CaseDetailContent from "@/components/crm/CaseDetailContent";
import LinkCaseModal from "@/components/crm/LinkCaseModal";
import type { CaseItem } from "@/types/crm";

const useDatabase = () =>
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_DATABASE === "true";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const [linkModalOpen, setLinkModalOpen] = React.useState(false);
  const [notePanelOpen, setNotePanelOpen] = React.useState(false);
  const [callLogPanelOpen, setCallLogPanelOpen] = React.useState(false);
  const [caseItem, setCaseItem] = React.useState<CaseItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [relatedCasesMap, setRelatedCasesMap] = React.useState<Map<string, CaseItem>>(new Map());
  const useDb = useDatabase();
  const { getRelatedCases, addLink } = useCaseLinksOverrides();

  React.useEffect(() => {
    if (!useDb) {
      const found = getSessionCase(caseId) ?? getCaseById(caseId);
      setCaseItem(found ?? null);
      setNotFound(!found);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetch(`/api/cases/${caseId}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        setCaseItem(data ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [caseId, useDb]);

  const handleDelete = React.useCallback(() => {
    if (!useDb || !caseId) return;
    if (!confirm("Delete this case? This cannot be undone.")) return;
    fetch(`/api/cases/${caseId}`, { method: "DELETE" }).then((r) => {
      if (r.ok) router.push("/crm/cases");
    });
  }, [useDb, caseId, router]);

  const handleUpdate = React.useCallback(
    (payload: Partial<CaseItem>) => {
      if (useDb && caseId) {
        return fetch(`/api/cases/${caseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then((r) => {
          if (r.ok) return r.json().then(setCaseItem);
        });
      }
      setCaseItem((prev) => {
        const next = prev ? { ...prev, ...payload } : null;
        if (next) setSessionCase(next);
        return next;
      });
      return Promise.resolve();
    },
    [useDb, caseId]
  );

  const relatedCaseNumbers = caseItem ? getRelatedCases(caseItem.id) : [];
  React.useEffect(() => {
    if (!useDb || relatedCaseNumbers.length === 0) {
      setRelatedCasesMap(new Map());
      return;
    }
    const map = new Map<string, CaseItem>();
    Promise.all(
      relatedCaseNumbers.map((num) =>
        fetch(`/api/cases?caseNumber=${encodeURIComponent(num)}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((arr: CaseItem[]) => {
            if (Array.isArray(arr) && arr[0]) map.set(num, arr[0]);
          })
      )
    ).then(() => setRelatedCasesMap(map));
  }, [useDb, relatedCaseNumbers.join(",")]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Loading case…</p>
      </div>
    );
  }
  if (notFound || !caseItem) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Case not found.</p>
      </div>
    );
  }

  const account = getAccountById(caseItem.accountId);
  const relatedCaseNumbersList = getRelatedCases(caseItem.id);

  if (!account) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Account not found.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <AccountContextPanel
        account={account}
        linkedCaseNumbers={relatedCaseNumbersList}
        currentCaseId={caseItem.id}
        onOpenLinkModal={() => setLinkModalOpen(true)}
        onOpenNotePanel={() => setNotePanelOpen(true)}
        onOpenCallLogPanel={() => setCallLogPanelOpen(true)}
        relatedCasesMap={useDb ? relatedCasesMap : undefined}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto">
        <CaseDetailContent
          caseItem={caseItem}
          account={account}
          showBreadcrumbs
          relatedCaseNumbers={relatedCaseNumbersList}
          onOpenLinkModal={() => setLinkModalOpen(true)}
          onOpenNotePanel={() => setNotePanelOpen(true)}
          onOpenCallLogPanel={() => setCallLogPanelOpen(true)}
          onUpdateCase={handleUpdate}
          onDeleteCase={useDb ? handleDelete : undefined}
          relatedCasesMap={useDb ? relatedCasesMap : undefined}
          notePanelOpen={notePanelOpen}
          onCloseNotePanel={() => setNotePanelOpen(false)}
          callLogPanelOpen={callLogPanelOpen}
          onCloseCallLogPanel={() => setCallLogPanelOpen(false)}
        />
      </div>

      <LinkCaseModal
        open={linkModalOpen}
        onOpenChange={setLinkModalOpen}
        currentCaseId={caseItem.id}
        account={account}
        existingRelatedCaseNumbers={relatedCaseNumbersList}
        onSelectCase={(caseNumber) => addLink(caseItem.id, caseNumber)}
      />
    </div>
  );
}
