"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { CaseStatus } from "@/types/crm";

interface StatusProgressBarProps {
  currentStatus: CaseStatus;
  className?: string;
  /** When provided, steps (except current) become clickable; called with the clicked status. */
  onStatusChange?: (newStatus: CaseStatus) => void;
}

const STATUS_STEPS: { status: CaseStatus; icon: string }[] = [
  { status: "New", icon: "add_circle" },
  { status: "In Progress", icon: "pending" },
  { status: "Pending", icon: "hourglass_top" },
  { status: "Resolved", icon: "task_alt" },
  { status: "Closed", icon: "check_circle" },
];

export default function StatusProgressBar({
  currentStatus,
  className,
  onStatusChange,
}: StatusProgressBarProps) {
  const currentIndex = STATUS_STEPS.findIndex(
    (s) => s.status === currentStatus
  );

  return (
    <div className={cn("flex items-center", className)}>
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STATUS_STEPS.length - 1;
        const isClickable = onStatusChange != null && !isCurrent;

        const stepContent = (
          <>
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                isClickable && "cursor-pointer hover:opacity-90",
                isCompleted &&
                  "border-[#008000] bg-[#008000] text-white",
                isCurrent &&
                  "border-[#2C365D] bg-[#2C365D] text-white",
                !isCompleted &&
                  !isCurrent &&
                  "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-500"
              )}
            >
              <Icon name={isCompleted ? "check" : step.icon} size={14} />
            </div>
            <span
              className={cn(
                "whitespace-nowrap text-xs font-medium",
                isCurrent
                  ? "text-[#2C365D] dark:text-[#7c8cb8]"
                  : isCompleted
                    ? "text-[#008000]"
                    : "text-gray-400 dark:text-gray-500"
              )}
            >
              {step.status}
            </span>
          </>
        );

        return (
          <React.Fragment key={step.status}>
            {isClickable ? (
              <button
                type="button"
                onClick={() => onStatusChange(step.status)}
                className="flex shrink-0 items-center gap-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#006180] focus-visible:ring-offset-1"
                aria-label={`Change status to ${step.status}`}
              >
                {stepContent}
              </button>
            ) : (
              <div className="flex shrink-0 items-center gap-1.5">
                {stepContent}
              </div>
            )}
            {!isLast && (
              <div
                className={cn(
                  "mx-1.5 h-[1.5px] w-4 shrink-0 sm:mx-2 sm:flex-1",
                  index < currentIndex
                    ? "bg-[#008000]"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
