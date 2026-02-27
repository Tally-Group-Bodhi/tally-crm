"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/Card/Card";
import Button from "@/components/Button/Button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/Popover/Popover";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const TIMELINE_ITEMS = [
  {
    id: "1",
    type: "call" as const,
    typeLabel: "Outbound Call",
    time: "2 hours ago",
    title: "Contract Renewal Discussion",
    customer: "Veolia Energy",
    summary: "Discussed renewal terms and pricing for Q2 2025. Customer requested volume discount proposal.",
    meta: { duration: "18 min" },
  },
  {
    id: "2",
    type: "email" as const,
    typeLabel: "Email Sent",
    time: "5 hours ago",
    title: "Billing Statement - November 2024",
    customer: "Energy Plus Co",
    summary: "Sent monthly billing statement and payment reminder.",
    meta: { user: "John Smith" },
  },
  {
    id: "3",
    type: "meeting" as const,
    typeLabel: "Meeting Completed",
    time: "Yesterday",
    title: "Quarterly Business Review",
    customer: "Green Solutions",
    summary: "QBR covered usage trends, cost savings, and roadmap for 2025.",
    meta: { user: "Daniel Cooper" },
  },
  {
    id: "4",
    type: "note" as const,
    typeLabel: "Note Added",
    time: "2 days ago",
    title: "Meter Transfer Issue",
    customer: "Aurora Power",
    summary: "Customer reported delay in meter transfer. Follow-up scheduled for next week.",
    meta: { attachments: "1 file" },
  },
];

type FilterType = "call" | "email" | "meeting" | "note";

const ACTION_TYPE_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
];

const UNASSIGNED_LABEL = "—";

/** Unique users from timeline items (meta.user); items without user map to UNASSIGNED_LABEL */
function getUniqueUsers(items: typeof TIMELINE_ITEMS): string[] {
  const set = new Set<string>();
  items.forEach((item) => {
    const user = "user" in item.meta ? (item.meta as { user?: string }).user : undefined;
    set.add(user ?? UNASSIGNED_LABEL);
  });
  return Array.from(set).sort((a, b) => (a === UNASSIGNED_LABEL ? 1 : b === UNASSIGNED_LABEL ? -1 : a.localeCompare(b)));
}

const TIMELINE_ICON_CLASSES = {
  call: "bg-[#2C365D]/10 text-[#2C365D] dark:bg-[#7c8cb8]/20 dark:text-[#7c8cb8]",
  email: "bg-blue-50 text-[#0074C4] dark:bg-blue-950/30",
  meeting: "bg-green-50 text-[#008000] dark:bg-green-950/30",
  note: "bg-purple-50 text-[#8B5CF6] dark:bg-purple-950/30",
};

const TIMELINE_TYPE_LABEL_CLASSES = {
  call: "text-[#2C365D] dark:text-[#7c8cb8]",
  email: "text-[#0074C4]",
  meeting: "text-[#008000]",
  note: "text-[#8B5CF6]",
};

export default function CommunicationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<FilterType>>(new Set());

  const uniqueUsers = useMemo(() => getUniqueUsers(TIMELINE_ITEMS), []);

  const filteredItems = useMemo(() => {
    let list = TIMELINE_ITEMS;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.customer.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.typeLabel.toLowerCase().includes(q)
      );
    }

    if (selectedTypes.size > 0) {
      list = list.filter((item) => selectedTypes.has(item.type));
    }

    if (selectedUsers.size > 0) {
      list = list.filter((item) => {
        const user = "user" in item.meta ? (item.meta as { user?: string }).user : undefined;
        const key = user ?? UNASSIGNED_LABEL;
        return selectedUsers.has(key);
      });
    }

    return list;
  }, [searchQuery, selectedTypes, selectedUsers]);

  const toggleUser = (user: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(user)) next.delete(user);
      else next.add(user);
      return next;
    });
  };

  const toggleType = (type: FilterType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const clearUserFilter = () => setSelectedUsers(new Set());
  const clearTypeFilter = () => setSelectedTypes(new Set());

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
        <div className="mb-density-xl flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Communications
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Log calls, emails, meetings, and notes
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-density-xl grid grid-cols-1 gap-density-lg sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Log Call", desc: "Record an outbound or inbound call", icon: "call", iconColor: "text-[#2C365D] dark:text-[#7c8cb8]", onClick: undefined },
            { title: "Send Email", desc: "Compose and send an email to customer", icon: "mail", iconColor: "text-[#0074C4] dark:text-blue-400", onClick: undefined },
            { title: "Schedule Meeting", desc: "Book a meeting or call with customer", icon: "event_available", iconColor: "text-[#008000] dark:text-green-400", onClick: undefined },
            { title: "Add Note", desc: "Add an internal note or update", icon: "note", iconColor: "text-[#8B5CF6] dark:text-purple-400", onClick: () => router.push("/crm/cases") },
          ].map((action) => (
            <Card
              key={action.title}
              className="group cursor-pointer transition-all shadow-none hover:border-[#2C365D] hover:shadow-sm dark:hover:border-[#7c8cb8]"
              onClick={action.onClick}
            >
              <div className="flex items-center gap-density-md p-density-lg">
                <Icon name={action.icon} size="var(--tally-icon-size-lg)" className={action.iconColor} />
                <div className="min-w-0 flex-1">
                  <p
                    className="font-bold leading-tight text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  >
                    {action.title}
                  </p>
                  <p
                    className="mt-0.5 truncate text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    {action.desc}
                  </p>
                </div>
                <Icon name="arrow_forward" size="var(--tally-icon-size-md)" className="shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-[#2C365D] dark:group-hover:text-[#7c8cb8]" />
              </div>
            </Card>
          ))}
        </div>

        {/* Search and filters — between Actions and Compose */}
        <section
          aria-label="Search and filter communications"
          className="min-h-[52px] flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/60"
          style={{ marginBottom: "var(--tally-spacing-lg, 16px)" }}
        >
          <span
            className="sr-only sm:not-sr-only sm:mr-1 sm:inline-block sm:text-muted-foreground"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
          >
            Search & filter:
          </span>
          <div className="relative w-full min-w-0 sm:w-52">
            <Icon
              name="search"
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm text-gray-900 placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-[#2C365D] focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
              )}
              style={{ fontSize: "var(--tally-font-size-sm)" }}
              aria-label="Search communications"
            />
          </div>

          <Popover>
            <PopoverTrigger
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
                selectedUsers.size > 0 && "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/10"
              )}
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              <Icon name="person" size={16} className="shrink-0 text-muted-foreground" />
              <span>User</span>
              {selectedUsers.size > 0 && (
                <span className="rounded bg-[#2C365D] px-1.5 py-0 text-xs text-white dark:bg-[#7c8cb8]">
                  {selectedUsers.size}
                </span>
              )}
              <Icon name="expand_more" size={16} className="shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-2">
              <div className="max-h-64 overflow-y-auto">
                {uniqueUsers.map((user) => (
                  <label
                    key={user}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user)}
                      onChange={() => toggleUser(user)}
                      className="h-4 w-4 rounded border-border text-[#2C365D] focus:ring-[#2C365D] dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user}</span>
                  </label>
                ))}
              </div>
              {selectedUsers.size > 0 && (
                <button
                  type="button"
                  onClick={clearUserFilter}
                  className="mt-2 w-full rounded py-1.5 text-center text-sm font-medium text-[#2C365D] hover:bg-gray-100 dark:text-[#7c8cb8] dark:hover:bg-gray-800"
                >
                  Clear
                </button>
              )}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm text-gray-700 transition-colors dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700",
                selectedTypes.size > 0 && "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/10"
              )}
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              <Icon name="filter_list" size={16} className="shrink-0 text-muted-foreground" />
              <span>Type</span>
              {selectedTypes.size > 0 && (
                <span className="rounded bg-[#2C365D] px-1.5 py-0 text-xs text-white dark:bg-[#7c8cb8]">
                  {selectedTypes.size}
                </span>
              )}
              <Icon name="expand_more" size={16} className="shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-2">
              <div className="space-y-0.5">
                {ACTION_TYPE_OPTIONS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(value)}
                      onChange={() => toggleType(value)}
                      className="h-4 w-4 rounded border-border text-[#2C365D] focus:ring-[#2C365D] dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
                  </label>
                ))}
              </div>
              {selectedTypes.size > 0 && (
                <button
                  type="button"
                  onClick={clearTypeFilter}
                  className="mt-2 w-full rounded py-1.5 text-center text-sm font-medium text-[#2C365D] hover:bg-gray-100 dark:text-[#7c8cb8] dark:hover:bg-gray-800"
                >
                  Clear
                </button>
              )}
            </PopoverContent>
          </Popover>
        </section>

        <p
          className="mb-density-xl text-muted-foreground"
          style={{ fontSize: "var(--tally-font-size-xs)" }}
        >
          Outbound customer emails are sent via SendGrid.
        </p>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 gap-density-lg lg:grid-cols-[1fr_350px]">
          {/* Left: Recent Activity */}
          <Card className="shadow-none">
            <div className="border-b border-border p-density-lg dark:border-gray-700">
              <h3
                className="font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Recent Activity
              </h3>
            </div>
            <div className="p-density-lg">
              {filteredItems.length === 0 ? (
                <p
                  className="py-8 text-center text-muted-foreground"
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                >
                  No communications match your filters.
                </p>
              ) : (
              <div className="relative flex flex-col before:absolute before:bottom-0 before:left-[15px] before:top-7 before:w-px before:bg-gray-200 before:content-[''] dark:before:bg-gray-700">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative pb-density-md pl-10 last:pb-0"
                  >
                    <div
                      className={cn(
                        "absolute left-1 top-1 z-[1] flex h-6 w-6 items-center justify-center rounded-full",
                        TIMELINE_ICON_CLASSES[item.type]
                      )}
                    >
                      <Icon
                        name={
                          item.type === "call"
                            ? "call"
                            : item.type === "email"
                              ? "mail"
                              : item.type === "meeting"
                                ? "event_available"
                                : "note"
                        }
                        size="var(--tally-icon-size-sm)"
                      />
                    </div>
                    <div className="rounded-density-md border border-border bg-white p-density-md dark:border-gray-700 dark:bg-gray-800">
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn(
                            "font-bold uppercase tracking-wider",
                            TIMELINE_TYPE_LABEL_CLASSES[item.type]
                          )}
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {item.typeLabel}
                        </span>
                        <span
                          className="text-muted-foreground"
                          style={{ fontSize: "var(--tally-font-size-xs)" }}
                        >
                          {item.time}
                        </span>
                      </div>
                      <div
                        className="font-medium text-gray-900 dark:text-gray-100"
                        style={{ fontSize: "var(--tally-font-size-sm)" }}
                      >
                        {item.title} with {item.customer}
                      </div>
                      <div
                        className="mt-0.5 text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {item.customer}
                      </div>
                      <div
                        className="mt-1.5 text-gray-700 dark:text-gray-300"
                        style={{
                          fontSize: "var(--tally-font-size-sm)",
                          lineHeight: "var(--tally-line-height-relaxed)",
                        }}
                      >
                        {item.summary}
                      </div>
                      <div
                        className="mt-2 flex gap-density-md text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {"duration" in item.meta && (
                          <span className="flex items-center gap-1">
                            <Icon name="schedule" size={12} />
                            {item.meta.duration}
                          </span>
                        )}
                        {"user" in item.meta && (
                          <span className="flex items-center gap-1">
                            <Icon name="person" size={12} />
                            {item.meta.user}
                          </span>
                        )}
                        {"attachments" in item.meta && (
                          <span className="flex items-center gap-1">
                            <Icon name="attach_file" size={12} />
                            {item.meta.attachments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </Card>

          {/* Right: Log Communication */}
          <Card className="shadow-none">
            <CardHeader className="p-density-lg pb-density-md">
              <CardTitle
                className="uppercase tracking-wider text-gray-900 dark:text-gray-100"
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              >
                Log Communication
              </CardTitle>
            </CardHeader>
            <CardContent className="p-density-lg pt-0">
              <form>
                <div className="grid grid-cols-2 gap-density-md">
                  <div className="rounded-density-md bg-gray-50 p-density-md dark:bg-gray-800">
                    <label
                      className="mb-density-xs block font-medium text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      Customer
                    </label>
                    <input
                      type="text"
                      placeholder="Select customer"
                      className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted-foreground dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    />
                  </div>
                  <div className="rounded-density-md bg-gray-50 p-density-md dark:bg-gray-800">
                    <label
                      className="mb-density-xs block font-medium text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      Type
                    </label>
                    <input
                      type="text"
                      placeholder="Call, Email, Meeting, Note"
                      className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted-foreground dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    />
                  </div>
                  <div className="rounded-density-md bg-gray-50 p-density-md dark:bg-gray-800">
                    <label
                      className="mb-density-xs block font-medium text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      Owner
                    </label>
                    <input
                      type="text"
                      placeholder="Assign owner"
                      className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted-foreground dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    />
                  </div>
                  <div className="rounded-density-md bg-gray-50 p-density-md dark:bg-gray-800">
                    <label
                      className="mb-density-xs block font-medium text-muted-foreground"
                      style={{ fontSize: "var(--tally-font-size-xs)" }}
                    >
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 15 min"
                      className="w-full bg-transparent outline-none text-gray-900 placeholder:text-muted-foreground dark:text-gray-100"
                      style={{ fontSize: "var(--tally-font-size-sm)" }}
                    />
                  </div>
                </div>
                <div className="mt-density-lg">
                  <label
                    className="mb-density-xs block font-medium text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Summary
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter summary..."
                    className="w-full resize-y rounded-density-md border border-border bg-white p-density-md outline-none placeholder:text-muted-foreground focus:border-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                  />
                </div>
                <Button type="submit" size="sm" className="mt-density-lg">
                  Save
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
