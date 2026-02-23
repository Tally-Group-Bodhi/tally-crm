"use client";

import React from "react";
import Link from "next/link";
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
import { mockOpportunities, formatCurrency } from "@/lib/mock-data/pipeline";
import PipelineColumn from "@/components/crm/PipelineColumn";
import type { PipelineStage } from "@/types/crm";

type ViewMode = "kanban" | "list";

const STAGES: PipelineStage[] = [
  "Leads",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const stageColors: Record<PipelineStage, string> = {
  Leads: "bg-gray-400",
  Qualification: "bg-[#0074C4]",
  Proposal: "bg-[#C53B00]",
  Negotiation: "bg-[#8B5CF6]",
  "Closed Won": "bg-[#008000]",
  "Closed Lost": "bg-[#C40000]",
};

export default function PipelinePage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>("kanban");
  const [opportunities, setOpportunities] = React.useState(mockOpportunities);
  const kanbanRef = React.useRef<HTMLDivElement>(null);

  // Convert vertical mouse-wheel into horizontal scroll for kanban board
  React.useEffect(() => {
    const el = kanbanRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept when there's vertical scroll intent and the container
      // can actually scroll horizontally
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;

      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [viewMode]);

  const handleDrop = (opportunityId: string, newStage: PipelineStage) => {
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId ? { ...opp, stage: newStage } : opp
      )
    );
  };

  const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);
  const activeOpps = opportunities.filter(
    (o) => o.stage !== "Closed Won" && o.stage !== "Closed Lost"
  );
  const weightedValue = activeOpps.reduce(
    (sum, o) => sum + o.value * (o.probability / 100),
    0
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <div className="shrink-0 p-density-xl pb-0">
      {/* Page header */}
      <div className="mb-density-lg flex items-center justify-between">
        <div>
          <h1
            className="font-bold text-gray-900 dark:text-gray-100"
            style={{ fontSize: "var(--tally-font-size-3xl)", lineHeight: "var(--tally-line-height-tight)" }}
          >
            Sales Pipeline
          </h1>
          <div className="mt-density-xs flex items-center gap-density-lg text-muted-foreground" style={{ fontSize: "var(--tally-font-size-sm)" }}>
            <span>
              Total Value:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(totalValue)}
              </span>
            </span>
            <span>
              Weighted:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(weightedValue)}
              </span>
            </span>
            <span>
              Active:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {activeOpps.length}
              </span>{" "}
              opportunities
            </span>
          </div>
        </div>
        <div className="flex items-center gap-density-sm">
          {/* View toggle */}
          <div className="inline-flex rounded-density-md border border-border bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center rounded px-2.5 py-1 font-medium transition-colors",
                viewMode === "kanban"
                  ? "bg-[#2C365D] text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              <Icon name="view_kanban" size="var(--tally-icon-size-sm)" className="mr-1" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center rounded px-2.5 py-1 font-medium transition-colors",
                viewMode === "list"
                  ? "bg-[#2C365D] text-white"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              <Icon name="list" size="var(--tally-icon-size-sm)" className="mr-1" />
              List
            </button>
          </div>
          <Button size="md" className="gap-1.5">
            <Icon name="add" size="var(--tally-icon-size-sm)" className="mr-1" />
            New Opportunity
          </Button>
        </div>
      </div>
    </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div
          ref={kanbanRef}
          className="scrollbar-visible min-h-0 flex-1 px-density-xl pb-density-xl"
          style={{ overflowX: "auto", overflowY: "hidden" }}
        >
          <div
            className="flex h-full gap-density-md"
            style={{ width: "max-content" }}
          >
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                stage={stage}
                opportunities={opportunities.filter(
                  (o) => o.stage === stage
                )}
                onDrop={handleDrop}
              />
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="min-h-0 flex-1 overflow-auto px-density-xl pb-density-xl">
        <div className="overflow-hidden rounded-density-md border border-border bg-white dark:border-gray-700 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Opportunity</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Probability</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>DocuSign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opp) => (
                <TableRow key={opp.id}>
                  <TableCell>
                    <Link
                      href={`/crm/pipeline/${opp.id}`}
                      className="font-medium text-[#2C365D] hover:underline dark:text-[#7c8cb8]"
                    >
                      {opp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {opp.accountName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          stageColors[opp.stage]
                        )}
                      />
                      <span style={{ fontSize: "var(--tally-font-size-sm)" }}>{opp.stage}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(opp.value)}
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
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {opp.owner}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {opp.expectedCloseDate}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">
                    {opp.docuSignStatus}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
      )}
    </div>
  );
}
