"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Button from "@/components/Button/Button";
import Input from "@/components/Input/Input";
import { Icon } from "@/components/ui/icon";
import NoteTemplatePickerModal, { type NoteTemplateItem } from "@/components/crm/NoteTemplatePickerModal";
import type { Attachment, CaseItem, Communication, Activity } from "@/types/crm";

const DRAFT_KEY_PREFIX = "note-draft-";
const DRAFT_DEBOUNCE_MS = 800;
const CURRENT_USER = "Current User";
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

export interface NotePanelProps {
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

export default function NotePanel({
  open,
  onOpenChange,
  caseItem,
  onSave,
  portalContainer,
}: NotePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });
  const miniCardRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [templates, setTemplates] = useState<NoteTemplateItem[]>([]);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/note-templates?active=true")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setTemplates(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  const applyTemplate = useCallback((tpl: NoteTemplateItem) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    if (editorRef.current) editorRef.current.innerHTML = tpl.body;
    setTemplatePickerOpen(false);
  }, []);

  const draftKey = `${DRAFT_KEY_PREFIX}${caseItem.id}`;
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

  // Start with empty note when opening (new note = fresh; draft no longer restored)
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setBody("");
    setAttachments([]);
    setLastDraftSaved(null);
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    // Clear contentEditable after mount
    const timer = setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = "";
    }, 0);
    return () => clearTimeout(timer);
  }, [open, draftKey]);

  // Persist draft (debounced)
  useEffect(() => {
    if (!open) return;
    const html = editorRef.current?.innerHTML ?? "";
    const trimmed = html.trim();
    const isEmpty = !trimmed || trimmed === "<br>" || trimmed === "<p><br></p>";
    if (isEmpty && attachments.length === 0 && !title.trim()) return;

    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      try {
        const payload = {
          title,
          body: editorRef.current?.innerHTML ?? "",
          attachments,
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
        setLastDraftSaved(formatTimestamp());
      } catch {}
      draftTimeoutRef.current = null;
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [open, title, body, attachments, draftKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
  }, [draftKey]);

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

  const insertSnippet = () => {
    const text = window.prompt("Snippet text:");
    if (text == null) return;
    const pre = document.createElement("pre");
    pre.setAttribute("contenteditable", "false");
    pre.className = "my-2 rounded bg-gray-100 px-2 py-1.5 font-mono text-sm dark:bg-gray-800";
    pre.textContent = text;
    const sel = window.getSelection();
    if (sel && editorRef.current) {
      const range = sel.getRangeAt(0);
      range.insertNode(pre);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
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

  const addFileAttachment = (file: File) => {
    const id = `att-note-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFileAttachment(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    const html = editorRef.current?.innerHTML ?? "";
    const plainBody = (editorRef.current?.innerText ?? "").trim();
    if (!plainBody && attachments.length === 0) return;

    setSaving(true);
    try {
      const timestamp = formatTimestamp();
      const commId = `comm-note-${Date.now()}`;
      const actId = `act-note-${Date.now()}`;
      const subject =
        title.trim() || plainBody.split(/\n/)[0]?.slice(0, 80) || "Note";

      const communication: Communication = {
        id: commId,
        type: "Note",
        direction: "Internal",
        from: caseItem.owner,
        to: "",
        subject,
        body: html,
        timestamp,
        attachments: [...attachments],
      };

      const activity: Activity = {
        id: actId,
        type: "Note Added",
        description: `Note added: ${subject}`,
        user: caseItem.owner,
        timestamp,
      };

      await onSave?.({ communication, activity });
      clearDraft();
      setTitle("");
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

  // Dragging for mini state
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

  const canSave = !!(
    (editorRef.current?.innerText?.trim() ?? body.trim()) ||
    attachments.length > 0
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
            <Icon name="sticky_note_2" size={14} />
            Use template
          </button>
        </div>
      )}

      {/* Title input */}
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="rounded-lg border-border bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      />

      {/* Notes area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleEditorInput}
        className={cn(
          "mt-2 min-h-[80px] overflow-y-auto rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100",
          expanded ? "min-h-[280px] max-h-[55vh]" : "max-h-[160px]",
          "empty:before:content-['Notes'] empty:before:text-gray-400 dark:empty:before:text-gray-500"
        )}
        data-placeholder="Notes"
        style={{ fontSize: "var(--tally-font-size-sm)" }}
      />

      {/* Rich text toolbar below notes */}
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
          onClick={insertSnippet}
          className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Code"
        >
          <Icon name="code" size={18} />
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
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-border pt-2 dark:border-gray-700">
        <Button variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !canSave}
          className="gap-1.5"
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </>
  );

  if (!open || typeof document === "undefined") return null;

  const portalTarget = portalContainer ?? document.body;
  const posClass = contained ? "absolute" : "fixed";

  // Expanded: centred modal overlay — clicking overlay minimizes to mini, does not close
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
          aria-labelledby="note-panel-title"
          className={`${posClass} left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`}
          style={{
            maxHeight: "min(85vh, 720px)",
            boxShadow:
              "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
            <h2
              id="note-panel-title"
              className="leading-none text-base font-semibold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Add note
            </h2>
            {lastDraftSaved && (
              <span
                className="text-xs text-muted-foreground"
                style={{ fontSize: "var(--tally-font-size-xs)" }}
              >
                Draft saved {lastDraftSaved}
              </span>
            )}
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
        <NoteTemplatePickerModal
          open={templatePickerOpen}
          onClose={() => setTemplatePickerOpen(false)}
          onSelect={applyTemplate}
          templates={templates}
        />
      </>,
      portalTarget
    );
  }

  // Mini: draggable floating card
  const miniCard = (
    <div
      ref={miniCardRef}
      role="dialog"
      aria-labelledby="note-panel-title"
      className={cn(
        `${posClass} z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100`,
        "transition-[box-shadow] duration-200",
        dragging && "shadow-2xl"
      )}
      style={{
        right: MINI_DEFAULT_RIGHT - dragOffset.x,
        bottom: MINI_DEFAULT_BOTTOM - dragOffset.y,
        width: "min(400px, calc(100vw - 3rem))",
        maxHeight: "min(360px, 85vh)",
        boxShadow:
          "0 20px 40px -12px rgba(0,0,0,0.15), 0 8px 20px -8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header: drag handle, title, reset position, expand, close */}
      <div
        className="flex shrink-0 cursor-grab items-center gap-1.5 border-b border-border bg-gray-50 px-3 py-2 active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
        onMouseDown={onDragHandleMouseDown}
      >
        <span
          className="cursor-grab text-gray-500 active:cursor-grabbing dark:text-gray-400"
          aria-hidden
        >
          <Icon name="drag_indicator" size={18} />
        </span>
        <h2
          id="note-panel-title"
          className="flex-1 leading-none text-base font-semibold text-gray-900 dark:text-gray-100"
          style={{ fontSize: "var(--tally-font-size-sm)" }}
        >
          Add note
        </h2>
        {lastDraftSaved && (
          <span
            className="text-xs text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
          >
            {lastDraftSaved}
          </span>
        )}
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
      <NoteTemplatePickerModal
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={applyTemplate}
        templates={templates}
      />
    </>
  );
}
