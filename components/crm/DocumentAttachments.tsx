"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import type { Attachment } from "@/types/crm";

interface DocumentAttachmentsProps {
  attachments: Attachment[];
  className?: string;
}

const fileTypeIcons: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "picture_as_pdf", color: "text-red-600" },
  spreadsheet: { icon: "table_chart", color: "text-green-600" },
  document: { icon: "description", color: "text-blue-600" },
  image: { icon: "image", color: "text-purple-600" },
};

export default function DocumentAttachments({
  attachments,
  className,
}: DocumentAttachmentsProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Files ({attachments.length})
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
            style={{ fontSize: "var(--tally-font-size-xs)" }}
            title="Edit attachments"
          >
            Edit
          </button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Icon name="upload" size={16} />
            Upload
          </Button>
        </div>
      </div>

      {attachments.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No attachments
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border dark:divide-gray-700 dark:border-gray-700">
          {attachments.map((att) => {
            const ftConfig = fileTypeIcons[att.type] ?? {
              icon: "draft",
              color: "text-gray-500",
            };

            return (
              <div
                key={att.id}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                <Icon
                  name={ftConfig.icon}
                  size={20}
                  className={ftConfig.color}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {att.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {att.size} · {att.uploadedBy} · {att.uploadedDate}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  aria-label={`Download ${att.name}`}
                >
                  <Icon name="download" size={18} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
