"use client";

import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/Card/Card";
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
import {
  OPPORTUNITIES,
  OPPORTUNITY_STAGES,
  type OpportunityRecord,
} from "@/lib/mock-data/colleague-opportunities";

type ViewMode = "kanban" | "list";

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }
  return `$${value}`;
}

function StatusBadge({ status }: { status: OpportunityRecord["status"] }) {
  const config: Record<
    string,
    { variant: "warning" | "info" | "success" | "error" | "outline"; label: string }
  > = {
    lead: { variant: "warning", label: "Lead" },
    open: { variant: "info", label: "Open" },
    won: { variant: "success", label: "Won" },
    lost: { variant: "error", label: "Lost" },
    deferred: { variant: "outline", label: "Deferred" },
  };
  const c = config[status] ?? { variant: "outline" as const, label: status };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "lead", label: "Lead" },
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "deferred", label: "Deferred" },
];

const stageColors: Record<OpportunityRecord["stage"], string> = {
  Initial: "bg-gray-400",
  Qualification: "bg-[#0074C4]",
  Proposal: "bg-[#C53B00]",
  Contract: "bg-[#8B5CF6]",
};

const OWNERS = Array.from(new Set(OPPORTUNITIES.map((o) => o.owner))).sort();

export default function OpportunitiesPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [stageFilter, setStageFilter] = React.useState("");
  const [ownerFilter, setOwnerFilter] = React.useState("");
  const [searchText, setSearchText] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [opportunities, setOpportunities] = React.useState(OPPORTUNITIES);
  const kanbanRef = React.useRef<HTMLDivElement>(null);

  // Convert vertical mouse-wheel into horizontal scroll for kanban board
  React.useEffect(() => {
    const el = kanbanRef.current;
    if (!el || viewMode !== "kanban") return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [viewMode]);

  const handleDrop = (
    opportunityId: string,
    newStage: OpportunityRecord["stage"]
  ) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId ? { ...opp, stage: newStage } : opp
      )
    );
  };

  const filtered = React.useMemo(() => {
    let result = [...opportunities];

    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    if (stageFilter) {
      result = result.filter((o) => o.stage === stageFilter);
    }
    if (ownerFilter) {
      result = result.filter((o) => o.owner === ownerFilter);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          o.owner.toLowerCase().includes(q)
      );
    }

    return result;
  }, [opportunities, statusFilter, stageFilter, ownerFilter, searchText]);

  const stats = React.useMemo(() => {
    const openOpps = filtered.filter(
      (o) => o.status === "lead" || o.status === "open"
    );
    const pipelineValue = openOpps.reduce((sum, o) => sum + o.value, 0);
    const wonOpps = filtered.filter((o) => o.status === "won");
    const totalClosed =
      wonOpps.length + filtered.filter((o) => o.status === "lost").length;
    const winRate =
      totalClosed > 0 ? Math.round((wonOpps.length / totalClosed) * 100) : 0;
    const cycles = filtered
      .filter((o) => o.cycleDays != null)
      .map((o) => o.cycleDays as number);
    const avgCycle =
      cycles.length > 0
        ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
        : 0;

    return {
      openOpportunities: openOpps.length,
      pipelineValue,
      winRate,
      avgSalesCycle: avgCycle,
    };
  }, [filtered]);

  const kanbanByStage = React.useMemo(() => {
    const byStage: Record<string, OpportunityRecord[]> = {};
    for (const stage of OPPORTUNITY_STAGES) {
      byStage[stage] = filtered.filter((o) => o.stage === stage);
    }
    return byStage;
  }, [filtered]);

  const formInput =
    "w-full rounded-density-md border border-border bg-white py-2 px-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

  return (
    <div className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[1600px] p-density-xl">
      {/* Top section: header + filters + KPIs */}
      <div>
        {/* Page header */}
        <div className="mb-density-lg flex items-center justify-between">
          <div>
            <h1
              className="font-bold text-gray-900 dark:text-gray-100"
              style={{
                fontSize: "var(--tally-font-size-3xl)",
                lineHeight: "var(--tally-line-height-tight)",
              }}
            >
              Opportunities
            </h1>
            <p
              className="mt-density-xs text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              Manage and track sales opportunities
            </p>
          </div>
          <div className="flex items-center gap-density-sm">
            {/* Search */}
            <div className="relative w-[280px]">
              <Icon
                name="search"
                size="var(--tally-icon-size-md)"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                placeholder="Search opportunities…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className={cn(formInput, "h-10 pl-9")}
                style={{ fontSize: "var(--tally-font-size-sm)" }}
              />
            </div>
            <Button size="md" className="gap-1.5" onClick={() => setModalOpen(true)}>
              <Icon name="add" size="var(--tally-icon-size-sm)" className="mr-1" />
              New Opportunity
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-density-lg flex flex-wrap items-end gap-density-md rounded-density-md border border-border bg-white p-density-md dark:border-gray-700 dark:bg-gray-900">
          <div className="flex flex-col gap-density-xs">
            <label
              className="font-bold uppercase tracking-wider text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              Status
            </label>
            <div className="relative min-w-[160px]">
              <select
                className={cn(formInput, "cursor-pointer appearance-none py-1.5 pr-9")}
                style={{ fontSize: "var(--tally-font-size-sm)" }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-density-xs">
            <label
              className="font-bold uppercase tracking-wider text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              Stage
            </label>
            <div className="relative min-w-[160px]">
              <select
                className={cn(formInput, "cursor-pointer appearance-none py-1.5 pr-9")}
                style={{ fontSize: "var(--tally-font-size-sm)" }}
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
              >
                <option value="">All Stages</option>
                {OPPORTUNITY_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="flex flex-col gap-density-xs">
            <label
              className="font-bold uppercase tracking-wider text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              Owner
            </label>
            <div className="relative min-w-[160px]">
              <select
                className={cn(formInput, "cursor-pointer appearance-none py-1.5 pr-9")}
                style={{ fontSize: "var(--tally-font-size-sm)" }}
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              >
                <option value="">All Owners</option>
                {OWNERS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
          <div className="ml-auto flex items-center">
            <div className="inline-flex rounded-density-md border border-border bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
              <button
                type="button"
                className={cn(
                  "flex items-center rounded px-2.5 py-1 font-medium transition-colors",
                  viewMode === "kanban"
                    ? "bg-[#2C365D] text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
                style={{ fontSize: "var(--tally-font-size-xs)" }}
                onClick={() => setViewMode("kanban")}
                title="Kanban view"
              >
                <Icon
                  name="view_kanban"
                  size="var(--tally-icon-size-sm)"
                  className="mr-1"
                />
                Kanban
              </button>
              <button
                type="button"
                className={cn(
                  "flex items-center rounded px-2.5 py-1 font-medium transition-colors",
                  viewMode === "list"
                    ? "bg-[#2C365D] text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                )}
                style={{ fontSize: "var(--tally-font-size-xs)" }}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <Icon
                  name="list"
                  size="var(--tally-icon-size-sm)"
                  className="mr-1"
                />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-density-lg grid grid-cols-1 gap-density-lg sm:grid-cols-2 xl:grid-cols-4">
          <Card className="shadow-none">
            <CardContent className="p-density-xl pt-density-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className="font-medium uppercase text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Open Opportunities
                  </p>
                  <p
                    className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-3xl)" }}
                  >
                    {stats.openOpportunities}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-center rounded-density-md bg-[#2C365D]/10 p-density-md dark:bg-[#7c8cb8]/20">
                  <Icon
                    name="folder_open"
                    size="var(--tally-icon-size-lg)"
                    className="text-[#2C365D] dark:text-[#7c8cb8]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-density-xl pt-density-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className="font-medium uppercase text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Pipeline Value
                  </p>
                  <p
                    className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-3xl)" }}
                  >
                    {formatCurrency(stats.pipelineValue)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-center rounded-density-md bg-[#0074C4]/10 p-density-md dark:bg-[#7c8cb8]/20">
                  <Icon
                    name="trending_up"
                    size="var(--tally-icon-size-lg)"
                    className="text-[#0074C4] dark:text-[#7c8cb8]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-density-xl pt-density-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className="font-medium uppercase text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Win Rate
                  </p>
                  <p
                    className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-3xl)" }}
                  >
                    {stats.winRate}%
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-center rounded-density-md bg-[#008000]/10 p-density-md dark:bg-[#008000]/20">
                  <Icon
                    name="emoji_events"
                    size="var(--tally-icon-size-lg)"
                    className="text-[#008000] dark:text-green-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-none">
            <CardContent className="p-density-xl pt-density-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p
                    className="font-medium uppercase text-muted-foreground"
                    style={{ fontSize: "var(--tally-font-size-xs)" }}
                  >
                    Avg Sales Cycle
                  </p>
                  <p
                    className="mt-density-sm font-bold leading-tight text-gray-900 dark:text-gray-100"
                    style={{ fontSize: "var(--tally-font-size-3xl)" }}
                  >
                    {stats.avgSalesCycle}d
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-center rounded-density-md bg-[#C53B00]/10 p-density-md dark:bg-[#C53B00]/20">
                  <Icon
                    name="schedule"
                    size="var(--tally-icon-size-lg)"
                    className="text-[#C53B00] dark:text-orange-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <div
          ref={kanbanRef}
          className="mt-density-lg"
          style={{ overflowX: "auto" }}
        >
          <div
            className="grid gap-density-lg pb-density-md"
            style={{ gridTemplateColumns: `repeat(${OPPORTUNITY_STAGES.length}, minmax(260px, 1fr))` }}
          >
            {OPPORTUNITY_STAGES.map((stage) => {
              const stageOpps = kanbanByStage[stage] ?? [];
              const stageValue = stageOpps.reduce((sum, o) => sum + o.value, 0);
              return (
                <OpportunityColumn
                  key={stage}
                  stage={stage}
                  opportunities={stageOpps}
                  totalValue={stageValue}
                  onDrop={handleDrop}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="mt-density-lg">
          <div className="overflow-hidden rounded-density-md border border-border bg-white dark:border-gray-700 dark:bg-gray-900">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((opp) => (
                  <TableRow key={opp.id}>
                    <TableCell>
                      <Link
                        href={`/crm/opportunities/${opp.id}`}
                        className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                      >
                        {opp.name}
                      </Link>
                      <div
                        className="mt-density-xs flex items-center gap-1 text-muted-foreground"
                        style={{ fontSize: "var(--tally-font-size-xs)" }}
                      >
                        {opp.id}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      {opp.owner}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={opp.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            stageColors[opp.stage]
                          )}
                        />
                        <span style={{ fontSize: "var(--tally-font-size-sm)" }}>
                          {opp.stage}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(opp.value)}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {opp.startDate}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          opp.probability >= 70
                            ? "success"
                            : opp.probability >= 40
                              ? "warning"
                              : "outline"
                        }
                      >
                        {opp.probability}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No opportunities match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* New Opportunity modal */}
      {modalOpen && (
        <NewOpportunityModal onClose={() => setModalOpen(false)} />
      )}
      </div>
    </div>
  );
}

/* ─── Kanban Column (mirrors PipelineColumn) ──────────────────────────────── */

function OpportunityColumn({
  stage,
  opportunities,
  totalValue,
  onDrop,
}: {
  stage: OpportunityRecord["stage"];
  opportunities: OpportunityRecord[];
  totalValue: number;
  onDrop: (opportunityId: string, newStage: OpportunityRecord["stage"]) => void;
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const oppId = e.dataTransfer.getData("text/plain");
    if (oppId) {
      onDrop(oppId, stage);
    }
  };

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-lg border border-border bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50",
        isDragOver &&
          "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/5"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span
            className={cn("h-2.5 w-2.5 rounded-full", stageColors[stage])}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {stage}
          </span>
          <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
            {opportunities.length}
          </span>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Cards */}
      <div className="flex min-h-[120px] flex-1 flex-col gap-2 overflow-y-auto p-2">
        {opportunities.map((opp) => (
          <OpportunityKanbanCard key={opp.id} opportunity={opp} />
        ))}
        {opportunities.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8 text-sm text-muted-foreground">
            No opportunities
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Kanban Card (mirrors OpportunityCard) ───────────────────────────────── */

function OpportunityKanbanCard({
  opportunity,
}: {
  opportunity: OpportunityRecord;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", opportunity.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Link
      href={`/crm/opportunities/${opportunity.id}`}
      draggable
      onDragStart={handleDragStart}
      className="block cursor-grab rounded-lg border border-border bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Title */}
      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {opportunity.name}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
        {opportunity.id}
      </p>

      {/* Value + Probability */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {formatCurrency(opportunity.value)}
        </span>
        <Badge
          variant={
            opportunity.probability >= 70
              ? "success"
              : opportunity.probability >= 40
                ? "warning"
                : "outline"
          }
          className="text-[10px]"
        >
          {opportunity.probability}%
        </Badge>
      </div>

      {/* Meta */}
      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon name="person" size={12} />
          {opportunity.owner}
        </span>
        <StatusBadge status={opportunity.status} />
      </div>
    </Link>
  );
}

/* ─── New Opportunity Modal ───────────────────────────────────────────────── */

const OWNER_OPTIONS = Array.from(
  new Set(OPPORTUNITIES.map((o) => o.owner))
).sort();

function NewOpportunityModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = React.useState("");
  const [owner, setOwner] = React.useState(OWNER_OPTIONS[0] ?? "");
  const [stage, setStage] = React.useState<OpportunityRecord["stage"]>("Initial");
  const [value, setValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  const formInput =
    "h-10 w-full rounded-density-md border border-border bg-white px-3 outline-none placeholder:text-muted-foreground focus:border-[#2C365D] focus:ring-1 focus:ring-[#2C365D] dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";
  const formLabel = "text-sm font-medium text-gray-900 dark:text-gray-100";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[0.5px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-xl border border-border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5 dark:border-gray-700">
          <h2
            id="modal-title"
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            New Opportunity
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {/* Name */}
            <div className="space-y-1.5">
              <label className={formLabel}>
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={formInput}
                style={{ fontSize: "var(--tally-font-size-sm)" }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Acme Corp - Renewal"
                required
              />
            </div>

            {/* Owner + Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={formLabel}>Owner</label>
                <div className="relative">
                  <select
                    className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                  >
                    {OWNER_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={formLabel}>Stage</label>
                <div className="relative">
                  <select
                    className={cn(formInput, "cursor-pointer appearance-none pr-9")}
                    style={{ fontSize: "var(--tally-font-size-sm)" }}
                    value={stage}
                    onChange={(e) => setStage(e.target.value as OpportunityRecord["stage"])}
                  >
                    {OPPORTUNITY_STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <Icon name="expand_more" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={formLabel}>Value</label>
                <input
                  type="text"
                  className={formInput}
                  style={{ fontSize: "var(--tally-font-size-sm)" }}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 500000"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4 dark:border-gray-700">
            <Button variant="outline" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button size="md" type="submit">
              Create Opportunity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
