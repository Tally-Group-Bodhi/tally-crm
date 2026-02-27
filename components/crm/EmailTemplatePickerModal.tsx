"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export interface EmailTemplateItem {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EmailTemplatePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: EmailTemplateItem) => void;
  templates: EmailTemplateItem[];
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  General: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" },
  Billing: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400" },
  Closing: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  Escalation: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  Field: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-400" },
  Onboarding: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-400" },
  Technical: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400" },
  Commercial: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-400" },
};

export default function EmailTemplatePickerModal({
  open,
  onClose,
  onSelect,
  templates,
}: EmailTemplatePickerModalProps) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  useEffect(() => {
    if (open) {
      setSearch("");
      setActiveFilter("All");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    for (const t of templates) {
      if (t.category) cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
    }
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
  }, [templates]);

  const filtered = useMemo(() => {
    let list = [...templates];
    if (activeFilter !== "All") {
      list = list.filter((t) => t.category === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [templates, activeFilter, search]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-label="Email Templates"
        className="fixed left-1/2 top-1/2 z-[101] flex w-full max-w-[640px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-border bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        style={{ maxHeight: "min(85vh, 680px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between border-b border-border px-5 pb-4 pt-5 dark:border-gray-700">
          <div>
            <h2
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{ fontSize: "var(--tally-font-size-lg)", lineHeight: "var(--tally-line-height-tight)" }}
            >
              Email Templates
            </h2>
            <p
              className="mt-0.5 text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              {templates.length} template{templates.length !== 1 ? "s" : ""} · Select one to prefill your email
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <div className="shrink-0 border-b border-border px-5 py-3 dark:border-gray-700">
          <div className="relative">
            <Icon
              name="search"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by name, category, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="h-10 w-full rounded-lg border border-border bg-gray-50 pl-10 pr-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:bg-white focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-900"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Icon name="backspace" size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="shrink-0 border-b border-border px-5 py-2.5 dark:border-gray-700">
          <div className="flex flex-wrap gap-1.5">
            <FilterPill
              label="All"
              count={templates.length}
              active={activeFilter === "All"}
              onClick={() => setActiveFilter("All")}
            />
            {categories.map(([cat, count]) => (
              <FilterPill
                key={cat}
                label={cat}
                count={count}
                active={activeFilter === cat}
                onClick={() => setActiveFilter(cat)}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon name="search_off" size={32} className="mb-2 text-muted-foreground" />
              <p className="font-medium text-gray-600 dark:text-gray-400" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                No templates found
              </p>
              <p className="mt-0.5 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                Try a different search or filter
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border dark:divide-gray-800">
              {filtered.map((tpl) => {
                const catStyle = CATEGORY_COLORS[tpl.category] ?? CATEGORY_COLORS.Technical;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelect(tpl)}
                    className="group flex w-full gap-3 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-gray-900 dark:text-gray-100"
                          style={{ fontSize: "var(--tally-font-size-sm)" }}
                        >
                          {tpl.name}
                        </span>
                        {tpl.category && (
                          <span
                            className={cn("rounded px-1.5 py-0.5 font-semibold uppercase tracking-wider", catStyle.bg, catStyle.text)}
                            style={{ fontSize: "9px" }}
                          >
                            {tpl.category}
                          </span>
                        )}
                      </div>
                      {tpl.subject && (
                        <div
                          className="mt-0.5 text-gray-600 dark:text-gray-400"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          Subject: {tpl.subject}
                        </div>
                      )}
                      {tpl.description && (
                        <p
                          className="mt-1 line-clamp-1 text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)", lineHeight: "var(--tally-line-height-normal)" }}
                        >
                          {tpl.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors",
        active
          ? "border-[#2C365D] bg-[#2C365D] text-white dark:border-[#7c8cb8] dark:bg-[#7c8cb8] dark:text-gray-900"
          : "border-border bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      )}
      style={{ fontSize: "var(--tally-font-size-xs)" }}
    >
      {label}
      <span
        className={cn(
          "inline-flex min-w-[16px] items-center justify-center rounded-full px-1 font-semibold",
          active
            ? "bg-white/20 text-white dark:bg-gray-900/30 dark:text-gray-100"
            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
        )}
        style={{ fontSize: "10px", height: "16px" }}
      >
        {count}
      </span>
    </button>
  );
}
