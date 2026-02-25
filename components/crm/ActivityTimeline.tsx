import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import type { Activity } from "@/types/crm";

interface ActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

const activityIcons: Record<string, { icon: string; color: string }> = {
  "Status Change": { icon: "swap_horiz", color: "text-[#0074C4] bg-blue-50 dark:bg-blue-950/30" },
  Assignment: { icon: "person_add", color: "text-[#2C365D] bg-indigo-50 dark:bg-indigo-950/30" },
  Comment: { icon: "chat_bubble", color: "text-[#595767] bg-gray-100 dark:bg-gray-800" },
  "Note Added": { icon: "edit_note", color: "text-[#8B5CF6] bg-purple-50 dark:bg-purple-950/30" },
  Attachment: { icon: "attach_file", color: "text-[#595767] bg-gray-100 dark:bg-gray-800" },
  "SLA Update": { icon: "timer", color: "text-[#C53B00] bg-orange-50 dark:bg-orange-950/30" },
  Created: { icon: "add_circle", color: "text-[#008000] bg-green-50 dark:bg-green-950/30" },
  "Email Sent": { icon: "send", color: "text-[#008000] bg-green-50 dark:bg-green-950/30" },
  "Email Received": { icon: "inbox", color: "text-[#0074C4] bg-blue-50 dark:bg-blue-950/30" },
  "Call Logged": { icon: "call", color: "text-[#2C365D] bg-indigo-50 dark:bg-indigo-950/30" },
};

export default function ActivityTimeline({
  activities,
  className,
}: ActivityTimelineProps) {
  // Sort newest first
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

      {sorted.map((activity) => {
        const config = activityIcons[activity.type] ?? {
          icon: "info",
          color: "text-gray-500 bg-gray-100 dark:bg-gray-800",
        };

        return (
          <div key={activity.id} className="relative pb-4 pl-10">
            {/* Dot */}
            <div
              className={cn(
                "absolute left-1.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full",
                config.color
              )}
            >
              <Icon name={config.icon} size={12} />
            </div>

            {/* Content */}
            <div>
              <p className="text-gray-900 dark:text-gray-100" style={{ fontSize: "var(--tally-font-size-sm)" }}>
                {activity.description}
              </p>
              {activity.metadata && activity.metadata.from && (
                <p className="mt-0.5 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                  {activity.metadata.from} → {activity.metadata.to}
                </p>
              )}
              <p className="mt-0.5 text-muted-foreground" style={{ fontSize: "var(--tally-font-size-xs)" }}>
                {activity.user} · {activity.timestamp}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
