"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/mock-data/pipeline";
import OpportunityCard from "@/components/crm/OpportunityCard";
import type { Opportunity, PipelineStage } from "@/types/crm";

interface PipelineColumnProps {
  stage: PipelineStage;
  opportunities: Opportunity[];
  onDrop?: (opportunityId: string, newStage: PipelineStage) => void;
  className?: string;
}

const stageColors: Record<PipelineStage, string> = {
  Leads: "bg-gray-400",
  Qualification: "bg-[#0074C4]",
  Proposal: "bg-[#C53B00]",
  Negotiation: "bg-[#8B5CF6]",
  "Closed Won": "bg-[#008000]",
  "Closed Lost": "bg-[#C40000]",
};

export default function PipelineColumn({
  stage,
  opportunities,
  onDrop,
  className,
}: PipelineColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const totalValue = opportunities.reduce((sum, o) => sum + o.value, 0);

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
    if (oppId && onDrop) {
      onDrop(oppId, stage);
    }
  };

  return (
    <div
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border border-border bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50",
        isDragOver && "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between rounded-t-lg border-b border-border bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", stageColors[stage])} />
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
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", opp.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          />
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
