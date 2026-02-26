"use client";

import React from "react";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/Dialog/Dialog";
import type { Account, CaseItem } from "@/types/crm";

const CLOSE_REASONS = [
  "Resolved by support",
  "Customer satisfied",
  "Duplicate case",
  "No longer required",
  "Referred elsewhere",
  "Other",
];

const RESOLUTION_TYPES = [
  "Fixed",
  "Workaround provided",
  "Information provided",
  "Cannot reproduce",
  "Won't fix",
  "Duplicate",
  "Other",
];

function formatClosedAtDisplay(d: Date): string {
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + ", " + d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}


interface CloseCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: CaseItem;
  account: Account;
  /** Current user name (e.g. from auth); falls back to case owner if not provided */
  currentUserName?: string;
  onCloseCase: (payload: {
    closeReason: string;
    resolutionType: string;
    closedAt: Date;
    closedBy: string;
  }) => void;
}

export default function CloseCaseModal({
  open,
  onOpenChange,
  caseItem,
  account,
  currentUserName,
  onCloseCase,
}: CloseCaseModalProps) {
  const defaultClosedBy = currentUserName ?? caseItem.owner;

  const [closeReason, setCloseReason] = React.useState("");
  const [resolutionType, setResolutionType] = React.useState("");
  const [closedAt, setClosedAt] = React.useState(() => new Date());
  const [closedBy, setClosedBy] = React.useState(defaultClosedBy);
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setCloseReason("");
      setResolutionType("");
      setClosedAt(new Date());
      setClosedBy(defaultClosedBy);
      setShowConfirm(false);
    }
  }, [open, defaultClosedBy]);

  const canClose = closeReason.trim() !== "" && resolutionType.trim() !== "";

  const handleCloseCase = () => {
    if (!canClose) return;
    onCloseCase({
      closeReason: closeReason.trim(),
      resolutionType: resolutionType.trim(),
      closedAt,
      closedBy,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3 dark:border-gray-700">
          <DialogTitle className="text-base">{showConfirm ? "Confirm close case" : "Close case"}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        {showConfirm ? (
          <>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              {/* Confirmation warning */}
              <div
                className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/50 dark:bg-amber-950/30"
                role="alert"
              >
                <Icon name="warning" size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                    Please confirm
                  </p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                    You are about to close this case. This action will update the case status to Closed. Please review the details below and confirm to proceed.
                  </p>
                </div>
              </div>

              {/* Summary of selected details */}
              <div className="rounded-lg border border-border bg-gray-50/50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800/30">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</p>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Close reason</dt>
                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{closeReason}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Resolution type</dt>
                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{resolutionType}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Closed at</dt>
                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{formatClosedAtDisplay(closedAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Closed by</dt>
                    <dd className="mt-0.5 text-gray-900 dark:text-gray-100">{closedBy}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <DialogFooter className="border-t border-border gap-2 px-4 py-3 dark:border-gray-700">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Back
              </Button>
              <Button
                onClick={handleCloseCase}
                className="bg-[#006180] text-white hover:bg-[#0091BF] dark:bg-[#0091BF] dark:hover:bg-[#00C1FF]"
              >
                Confirm and close case
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {/* Warning */}
          <div
            className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/50 dark:bg-amber-950/30"
            role="alert"
          >
            <Icon name="warning" size={20} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                Warning
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                Closing this case will update its status to Closed. Select a close reason and resolution type to continue.
              </p>
            </div>
          </div>

          {/* Close Reason */}
          <div className="space-y-1.5">
            <label htmlFor="close-reason" className="block font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
              Close Reason <span className="text-red-500">*</span>
            </label>
            <select
              id="close-reason"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[#006180] focus:ring-1 focus:ring-[#006180] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Select close reason</option>
              {CLOSE_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Resolution Type */}
          <div className="space-y-1.5">
            <label htmlFor="resolution-type" className="block font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
              Resolution Type <span className="text-red-500">*</span>
            </label>
            <select
              id="resolution-type"
              value={resolutionType}
              onChange={(e) => setResolutionType(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[#006180] focus:ring-1 focus:ring-[#006180] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">Select resolution type</option>
              {RESOLUTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Closed at — read-only */}
          <div className="space-y-1.5">
            <span className="block font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
              Closed at
            </span>
            <div className="flex items-center gap-2 rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
              <Icon name="calendar_today" size={18} className="shrink-0 text-muted-foreground" />
              <span>{formatClosedAtDisplay(closedAt)}</span>
            </div>
          </div>

          {/* Closed By — read-only */}
          <div className="space-y-1.5">
            <span className="block font-medium text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
              Closed by
            </span>
            <div className="rounded-md border border-border bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
              {closedBy}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border gap-2 px-4 py-3 dark:border-gray-700">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canClose}
            onClick={() => setShowConfirm(true)}
            className="bg-[#006180] text-white hover:bg-[#0091BF] dark:bg-[#0091BF] dark:hover:bg-[#00C1FF]"
          >
            Close case
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
