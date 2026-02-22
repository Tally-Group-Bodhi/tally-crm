"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { Icon } from "@/components/ui/icon";
import type { CaseItem, Communication, Activity } from "@/types/crm";

const MINI_DEFAULT_RIGHT = 24;
const MINI_DEFAULT_BOTTOM = 24;

function formatTimestamp() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

type CallDirection = "Inbound" | "Outbound";

export interface CallLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: CaseItem;
  onSave?: (payload: {
    communication: Communication;
    activity: Activity;
  }) => void | Promise<void>;
  /** When set, panel is portaled into this container and uses absolute positioning (e.g. tab view) */
  portalContainer?: HTMLElement | null;
}

export default function CallLogPanel({
  open,
  onOpenChange,
  caseItem,
  onSave,
  portalContainer,
}: CallLogPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [direction, setDirection] = useState<CallDirection>("Outbound");
  const [subject, setSubject] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });

  const contained = !!portalContainer;

  useEffect(() => {
    if (open) {
      if (contained && portalContainer) {
        portalContainer.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "hidden";
      }
      setDragOffset({ x: 0, y: 0 });
      setExpanded(false);
    } else {
      if (contained && portalContainer) {
        portalContainer.style.overflow = "";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (contained && portalContainer) {
        portalContainer.style.overflow = "";
      } else {
        document.body.style.overflow = "";
      }
    };
  }, [open, contained, portalContainer]);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setDirection("Outbound");
      setSubject("");
      setFrom("");
      setTo("");
      setSummary("");
    }
  }, [open]);

  const handleSave = async () => {
    const subjectTrim = subject.trim() || (direction === "Inbound" ? "Inbound call" : "Outbound call");
    if (!subjectTrim && !summary.trim()) return;

    setSaving(true);
    try {
      const timestamp = formatTimestamp();
      const commId = `comm-call-${Date.now()}`;
      const actId = `act-call-${Date.now()}`;
      const communication: Communication = {
        id: commId,
        type: "Phone",
        direction,
        from: direction === "Inbound" ? (from.trim() || "—") : caseItem.owner,
        to: direction === "Inbound" ? (to.trim() || caseItem.owner) : (to.trim() || "—"),
        subject: subjectTrim,
        body: summary.trim() || "",
        timestamp,
        attachments: [],
        loggedBy: caseItem.owner,
      };

      const activity: Activity = {
        id: actId,
        type: "Call Logged",
        description: `${direction} call: ${subjectTrim}`,
        user: caseItem.owner,
        timestamp,
      };

      await onSave?.({ communication, activity });
      setSubject("");
      setFrom("");
      setTo("");
      setSummary("");
      onOpenChange(false);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setExpanded(false);
  };

  const handleExpandToggle = () => {
    setExpanded((e) => !e);
  };

  const onDragHandleMouseDown = (e: React.MouseEvent) => {
    if (expanded) return;
    e.preventDefault();
    setDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: dragOffset.x,
      offsetY: dragOffset.y,
    };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      setDragOffset({
        x: dragStartRef.current.offsetX + (e.clientX - dragStartRef.current.mouseX),
        y: dragStartRef.current.offsetY + (e.clientY - dragStartRef.current.mouseY),
      });
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const canSave = !!(subject.trim() || summary.trim());

  const formContent = (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDirection("Outbound")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            direction === "Outbound"
              ? "border-[#2C365D] bg-[#2C365D] text-white dark:border-[#7c8cb8] dark:bg-[#7c8cb8]"
              : "border-border bg-white text-muted-foreground hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          )}
        >
          <Icon name="call_made" size={18} />
          Outbound
        </button>
        <button
          type="button"
          onClick={() => setDirection("Inbound")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
            direction === "Inbound"
              ? "border-[#2C365D] bg-[#2C365D] text-white dark:border-[#7c8cb8] dark:bg-[#7c8cb8]"
              : "border-border bg-white text-muted-foreground hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          )}
        >
          <Icon name="call_received" size={18} />
          Inbound
        </button>
      </div>

      <Input
        placeholder="Subject (e.g. Follow-up call)"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mt-3 rounded-lg border-border bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      />

      {direction === "Inbound" ? (
        <>
          <Input
            placeholder="From (caller)"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-3 rounded-lg border-border bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          />
          <Input
            placeholder="To (e.g. yourself)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-2 rounded-lg border-border bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          />
        </>
      ) : (
        <Input
          placeholder="To (person/contact called)"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="mt-3 rounded-lg border-border bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        />
      )}

      <textarea
        placeholder="Call summary or notes"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={4}
        className={cn(
          "mt-3 w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        )}
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      />

      <div className="flex justify-end gap-2 border-t border-border pt-3 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !canSave}
          className="gap-1.5"
        >
          {saving ? "Saving…" : "Log call"}
        </Button>
      </div>
    </>
  );

  if (!open || typeof document === "undefined") return null;

  const portalTarget = portalContainer ?? document.body;
  const posClass = contained ? "absolute" : "fixed";

  if (expanded) {
    return createPortal(
      <>
        <div
          className={`${posClass} inset-0 z-50 bg-black/50`}
          aria-hidden
          onClick={() => setExpanded(false)}
        />
        <div
          role="dialog"
          aria-labelledby="call-log-panel-title"
          className={`${posClass} left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`}
          style={{
            maxHeight: "min(75vh, 520px)",
            boxShadow:
              "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <h2
              id="call-log-panel-title"
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Log call
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandToggle}
                className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Minimise"
              >
                <Icon name="close_fullscreen" size={20} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <Icon name="close" size={20} />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            {formContent}
          </div>
        </div>
      </>,
      portalTarget
    );
  }

  const miniCard = (
    <div
      role="dialog"
      aria-labelledby="call-log-panel-title"
      className={cn(
        `${posClass} z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`,
        "transition-[box-shadow] duration-200",
        dragging && "shadow-2xl"
      )}
      style={{
        right: MINI_DEFAULT_RIGHT - dragOffset.x,
        bottom: MINI_DEFAULT_BOTTOM - dragOffset.y,
        width: "min(400px, calc(100vw - 3rem))",
        maxHeight: "min(420px, 85vh)",
        boxShadow:
          "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="flex shrink-0 cursor-grab items-center gap-2 border-b border-border bg-gray-50 px-3 py-2.5 active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
        onMouseDown={onDragHandleMouseDown}
      >
        <span className="cursor-grab text-gray-500 active:cursor-grabbing dark:text-gray-400" aria-hidden>
          <Icon name="drag_indicator" size={20} />
        </span>
        <h2
          id="call-log-panel-title"
          className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        >
          Log call
        </h2>
        <button
          type="button"
          onClick={handleExpandToggle}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Expand"
        >
          <Icon name="open_in_full" size={18} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {formContent}
      </div>
    </div>
  );

  return createPortal(miniCard, portalTarget);
}
