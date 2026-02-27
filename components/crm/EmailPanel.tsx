"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { Icon } from "@/components/ui/icon";
import EmailTemplatePickerModal, { type EmailTemplateItem } from "@/components/crm/EmailTemplatePickerModal";
import type { Attachment, CaseItem, Communication, Activity, Contact } from "@/types/crm";

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

const CURRENT_USER = "Current User";

export interface EmailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: CaseItem;
  /** Account contacts — primary contact is pre-filled as the default recipient */
  contacts?: Contact[];
  onSave?: (payload: {
    communication: Communication;
    activity: Activity;
  }) => void | Promise<void>;
  portalContainer?: HTMLElement | null;
}

export default function EmailPanel({
  open,
  onOpenChange,
  caseItem,
  contacts = [],
  onSave,
  portalContainer,
}: EmailPanelProps) {
  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0];

  const [expanded, setExpanded] = useState(false);
  const [toField, setToField] = useState("");
  const [toDropdownOpen, setToDropdownOpen] = useState(false);
  const [ccField, setCcField] = useState("");
  const [bccField, setBccField] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
  const miniCardRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");

  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/email-templates?active=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setTemplates(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  const applyTemplate = useCallback((tpl: EmailTemplateItem) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
    if (editorRef.current) editorRef.current.innerText = tpl.body;
    setTemplatePickerOpen(false);
  }, []);

  const contained = !!portalContainer;

  // Close contact dropdown on outside click
  useEffect(() => {
    if (!toDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (toInputRef.current && !toInputRef.current.closest(".relative")?.contains(e.target as Node)) {
        setToDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [toDropdownOpen]);

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

  useEffect(() => {
    if (!open) return;
    setToField(primaryContact?.email ?? "");
    setToDropdownOpen(false);
    setCcField("");
    setBccField("");
    setShowCc(false);
    setShowBcc(false);
    setSubject("");
    setBody("");
    setAttachments([]);
    const timer = setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  const handleEditorInput = () => {
    setBody(editorRef.current?.innerHTML ?? "");
  };

  const execFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
    setBody(editorRef.current?.innerHTML ?? "");
  };

  const insertLink = () => {
    const url = window.prompt("Link URL:");
    if (url == null) return;
    const text = window.prompt("Link text (optional):", url);
    if (text == null) return;
    execFormat("createLink", url);
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        (node as Text).textContent = text || url;
      }
    }
    setBody(editorRef.current?.innerHTML ?? "");
  };

  const insertImageFromFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement("img");
      img.src = reader.result as string;
      img.alt = file.name;
      img.className = "max-h-48 rounded border border-border object-contain";
      const sel = window.getSelection();
      if (sel && editorRef.current) {
        const range = sel.getRangeAt(0);
        range.insertNode(img);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
      setBody(editorRef.current?.innerHTML ?? "");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      insertImageFromFile(file);
    }
    e.target.value = "";
  };

  const addFileAttachment = useCallback((file: File) => {
    const id = `att-email-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setAttachments((prev) => [
      ...prev,
      {
        id,
        name: file.name,
        type: file.type || "file",
        size: file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`,
        uploadedBy: CURRENT_USER,
        uploadedDate: formatTimestamp(),
      },
    ]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFileAttachment(file);
    e.target.value = "";
  };

  const handleSend = async () => {
    const plainBody = (editorRef.current?.innerText ?? "").trim();
    const html = editorRef.current?.innerHTML ?? "";
    if (!toField.trim() || (!plainBody && !subject.trim())) return;

    setSaving(true);
    try {
      const timestamp = formatTimestamp();
      const commId = `comm-email-${Date.now()}`;
      const actId = `act-email-${Date.now()}`;
      const subjectLine = subject.trim() || plainBody.split(/\n/)[0]?.slice(0, 80) || "Email";

      const communication: Communication = {
        id: commId,
        type: "Email",
        direction: "Outbound",
        from: caseItem.owner,
        to: toField.trim(),
        subject: subjectLine,
        body: html,
        timestamp,
        attachments: [...attachments],
      };

      const activity: Activity = {
        id: actId,
        type: "Email Sent",
        description: `Email sent: ${subjectLine}`,
        user: caseItem.owner,
        timestamp,
      };

      await onSave?.({ communication, activity });
      setToField("");
      setCcField("");
      setBccField("");
      setSubject("");
      setBody("");
      setAttachments([]);
      if (editorRef.current) editorRef.current.innerHTML = "";
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

  const handleResetPosition = () => {
    setDragOffset({ x: 0, y: 0 });
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
    const onMouseUp = () => {
      const el = miniCardRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const visibleLeft = Math.max(0, r.left);
        const visibleTop = Math.max(0, r.top);
        const visibleRight = Math.min(vw, r.right);
        const visibleBottom = Math.min(vh, r.bottom);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleArea = visibleWidth * visibleHeight;
        const totalArea = r.width * r.height;
        const moreThanHalfOutside =
          totalArea > 0 && visibleArea < totalArea * 0.5;
        if (moreThanHalfOutside) {
          setDragOffset({ x: 0, y: 0 });
        }
      }
      setDragging(false);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const canSend = !!(
    toField.trim() &&
    ((editorRef.current?.innerText?.trim() ?? body.trim()) || subject.trim())
  );

  const formContent = (
    <>
      {/* Template picker trigger */}
      {templates.length > 0 && (
        <div className="mb-1">
          <button
            type="button"
            onClick={() => setTemplatePickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-medium text-[#2C365D] transition-colors hover:bg-[#2C365D]/5 dark:border-gray-700 dark:text-[#7c8cb8] dark:hover:bg-[#7c8cb8]/10"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
          >
            <Icon name="drafts" size={14} />
            Use template
          </button>
        </div>
      )}

      {/* To / Cc / Bcc / From / Subject fields */}
      <div className="divide-y divide-border dark:divide-gray-700">
        {/* To */}
        <div className="relative flex items-center gap-3 py-2">
          <span
            className="w-12 shrink-0 text-sm font-medium text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            To
          </span>
          <div className="relative flex min-w-0 flex-1 items-center">
            <Input
              ref={toInputRef}
              placeholder="recipient@example.com"
              value={toField}
              onChange={(e) => { setToField(e.target.value); setToDropdownOpen(true); }}
              onFocus={() => { if (contacts.length > 0) setToDropdownOpen(true); }}
              className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-400"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            />
            {contacts.length > 1 && (
              <button
                type="button"
                onClick={() => setToDropdownOpen((v) => !v)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Select contact"
              >
                <Icon name="expand_more" size={16} />
              </button>
            )}
            {toDropdownOpen && contacts.length > 0 && (() => {
              const q = toField.toLowerCase();
              const matchedContacts = contacts.filter(
                (c) =>
                  c.name.toLowerCase().includes(q) ||
                  c.email.toLowerCase().includes(q) ||
                  c.role.toLowerCase().includes(q)
              );
              if (matchedContacts.length === 0) return null;
              return (
                <div
                  className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
                >
                  {matchedContacts.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setToField(c.email); setToDropdownOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                        c.email === toField && "bg-gray-50 dark:bg-gray-800"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-medium text-gray-900 dark:text-gray-100"
                            style={{ fontSize: "var(--tally-font-size-sm)" }}
                          >
                            {c.name}
                          </span>
                          {c.isPrimary && (
                            <span
                              className="rounded bg-[#006180]/10 px-1 py-0.5 font-semibold uppercase text-[#006180] dark:bg-[#0091BF]/10 dark:text-[#0091BF]"
                              style={{ fontSize: "9px" }}
                            >
                              Primary
                            </span>
                          )}
                        </div>
                        <div
                          className="text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {c.email} · {c.role}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!showCc && (
              <button
                type="button"
                onClick={() => setShowCc(true)}
                className="text-xs font-medium text-[#006180] hover:underline dark:text-[#0091BF]"
              >
                Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                onClick={() => setShowBcc(true)}
                className="text-xs font-medium text-[#006180] hover:underline dark:text-[#0091BF]"
              >
                Bcc
              </button>
            )}
          </div>
        </div>

        {/* Cc */}
        {showCc && (
          <div className="flex items-center gap-3 py-2">
            <span
              className="w-12 shrink-0 text-sm font-medium text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Cc
            </span>
            <Input
              placeholder="cc@example.com"
              value={ccField}
              onChange={(e) => setCcField(e.target.value)}
              className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-400"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            />
          </div>
        )}

        {/* Bcc */}
        {showBcc && (
          <div className="flex items-center gap-3 py-2">
            <span
              className="w-12 shrink-0 text-sm font-medium text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Bcc
            </span>
            <Input
              placeholder="bcc@example.com"
              value={bccField}
              onChange={(e) => setBccField(e.target.value)}
              className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-400"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            />
          </div>
        )}

        {/* From */}
        <div className="flex items-center gap-3 py-2">
          <span
            className="w-12 shrink-0 text-sm font-medium text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            From
          </span>
          <span
            className="text-sm text-gray-900 dark:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            {caseItem.owner}
          </span>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 py-2">
          <span
            className="w-12 shrink-0 text-sm font-medium text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          >
            Subject
          </span>
          <Input
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-400"
            style={{ fontSize: "var(--tally-font-size-sm)" }}
          />
        </div>
      </div>

      {/* Email body */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        className={cn(
          "mt-2 min-h-[80px] overflow-y-auto rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#006180] focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
          expanded ? "min-h-[280px] max-h-[55vh]" : "max-h-[160px]",
          "empty:before:content-['Write_your_email...'] empty:before:text-gray-400 dark:empty:before:text-gray-500"
        )}
        data-placeholder="Write your email..."
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      />

      {/* Rich text toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 py-1">
        <button
          type="button"
          onClick={() => execFormat("bold")}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Bold"
        >
          <Icon name="format_bold" size={18} />
        </button>
        <button
          type="button"
          onClick={() => execFormat("italic")}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Italic"
        >
          <Icon name="format_italic" size={18} />
        </button>
        <button
          type="button"
          onClick={() => execFormat("underline")}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Underline"
        >
          <Icon name="format_underlined" size={18} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-border dark:bg-gray-600" />
        <button
          type="button"
          onClick={insertLink}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Insert link"
        >
          <Icon name="link" size={18} />
        </button>
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Image"
        >
          <Icon name="image" size={18} />
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Attachment"
        >
          <Icon name="attach_file" size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-gray-50 px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <Icon name="attach_file" size={12} className="text-muted-foreground" />
              <span>{att.name}</span>
              <span className="text-muted-foreground">({att.size})</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-0.5 rounded p-0.5 text-muted-foreground hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label={`Remove ${att.name}`}
              >
                <Icon name="close" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-2 dark:border-gray-700">
        <div className="text-xs text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
          {caseItem.caseNumber}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={saving || !canSend}
            className="gap-1.5"
          >
            {saving ? "Sending…" : "Send"}
          </Button>
        </div>
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
          className={`${posClass} inset-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]`}
          aria-hidden
          onClick={() => setExpanded(false)}
        />
        <div
          role="dialog"
          aria-labelledby="email-panel-title"
          className={`${posClass} left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`}
          style={{
            maxHeight: "min(85vh, 680px)",
            boxShadow:
              "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <h2
              id="email-panel-title"
              className="leading-none text-base font-semibold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Email
            </h2>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleExpandToggle}
                className="rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Minimise"
              >
                <Icon name="close_fullscreen" size={18} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
            {formContent}
          </div>
        </div>
        <EmailTemplatePickerModal
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
          onSelect={applyTemplate}
          templates={templates}
        />
      </>,
      portalTarget
    );
  }

  const miniCard = (
    <div
      ref={miniCardRef}
      role="dialog"
      aria-labelledby="email-panel-title"
      className={cn(
        `${posClass} z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`,
        "transition-[box-shadow] duration-200",
        dragging && "shadow-2xl"
      )}
      style={{
        right: MINI_DEFAULT_RIGHT - dragOffset.x,
        bottom: MINI_DEFAULT_BOTTOM - dragOffset.y,
        width: "min(440px, calc(100vw - 3rem))",
        maxHeight: "min(480px, 85vh)",
        boxShadow:
          "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="flex shrink-0 cursor-grab items-center gap-1.5 border-b border-border bg-gray-50 px-3 py-2 active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
        onMouseDown={onDragHandleMouseDown}
      >
        <span className="cursor-grab text-gray-500 active:cursor-grabbing dark:text-gray-400" aria-hidden>
          <Icon name="drag_indicator" size={18} />
        </span>
        <h2
          id="email-panel-title"
          className="flex-1 leading-none text-base font-semibold text-gray-900 dark:text-gray-100"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        >
          Email
        </h2>
        <button
          type="button"
          onClick={handleResetPosition}
          className="rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 shrink-0"
          aria-label="Reset position"
          title="Reset position to default"
        >
          <Icon name="pip" size={16} />
        </button>
        <button
          type="button"
          onClick={handleExpandToggle}
          className="rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 shrink-0"
          aria-label="Expand"
        >
          <Icon name="open_in_full" size={16} />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="rounded p-1 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 shrink-0"
          aria-label="Close"
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
        {formContent}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(miniCard, portalTarget)}
      <EmailTemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={applyTemplate}
        templates={templates}
      />
    </>
  );
}
