"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import Button from "@/components/Button/Button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog/AlertDialog";
import type { Attachment } from "@/types/crm";

interface DocumentAttachmentsProps {
  attachments: Attachment[];
  className?: string;
  /** Case id for upload and download URLs; required for upload/remove when using API */
  caseId?: string;
  /** Called when user selects files to upload; parent should upload then update case */
  onUpload?: (files: File[]) => Promise<void>;
  /** Called when user removes an attachment; parent should update case */
  onRemove?: (attachmentId: string) => void;
}

const fileTypeIcons: Record<string, { icon: string; color: string }> = {
  pdf: { icon: "picture_as_pdf", color: "text-red-600" },
  spreadsheet: { icon: "table_chart", color: "text-green-600" },
  document: { icon: "description", color: "text-blue-600" },
  image: { icon: "image", color: "text-purple-600" },
};

const ACCEPT_FILES =
  ".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.gif,.webp";

export default function DocumentAttachments({
  attachments,
  className,
  caseId,
  onUpload,
  onRemove,
}: DocumentAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [attachmentToRemove, setAttachmentToRemove] = useState<Attachment | null>(null);

  const canUpload = Boolean(caseId && onUpload);
  const canRemove = Boolean(onRemove);

  const processFiles = (files: File[]) => {
    if (!files.length || !onUpload) return;
    setUploading(true);
    Promise.resolve(onUpload(files))
      .then(() => setShowUploadArea(false))
      .finally(() => {
        setUploading(false);
        inputRef.current && (inputRef.current.value = "");
      })
      .catch(() => {
        inputRef.current && (inputRef.current.value = "");
      });
  };

  const handleUploadClick = () => {
    if (canUpload) setShowUploadArea(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    processFiles(Array.from(files));
  };

  const handleDropZoneClick = () => {
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const items = e.dataTransfer?.files;
    if (!items?.length) return;
    processFiles(Array.from(items));
  };

  const downloadUrl =
    caseId != null
      ? `/api/cases/${caseId}/attachments`
      : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Files ({attachments.length})
        </p>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={() => setEditMode((prev) => !prev)}
              className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
              title={editMode ? "Done editing" : "Edit attachments"}
            >
              {editMode ? "Done" : "Edit"}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT_FILES}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={!canUpload || uploading}
            onClick={handleUploadClick}
          >
            <Icon name="upload" size={16} />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border dark:divide-gray-700 dark:border-gray-700">
          {attachments.map((att) => {
            const ftConfig = fileTypeIcons[att.type] ?? {
              icon: "draft",
              color: "text-gray-500",
            };
            const canDownload =
              downloadUrl && att.storagePath != null;

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
                {editMode && canRemove && onRemove ? (
                  <button
                    type="button"
                    onClick={() => setAttachmentToRemove(att)}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
                    aria-label={`Remove ${att.name}`}
                  >
                    <Icon name="delete" size={18} />
                  </button>
                ) : canDownload ? (
                  <a
                    href={`${downloadUrl}/${att.id}`}
                    download={att.name}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                    aria-label={`Download ${att.name}`}
                  >
                    <Icon name="download" size={18} />
                  </a>
                ) : (
                  <span
                    className="shrink-0 rounded p-1 text-gray-300 dark:text-gray-600"
                    title="Download not available"
                    aria-hidden
                  >
                    <Icon name="download" size={18} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canUpload && showUploadArea && (
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowUploadArea(false)}
              className="underline text-muted-foreground hover:text-[#2C365D] dark:hover:text-[#7c8cb8]"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={handleDropZoneClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            disabled={uploading}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 px-4 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C365D] focus-visible:ring-offset-2 dark:focus-visible:ring-[#7c8cb8]",
              attachments.length > 0 ? "py-6" : "py-10",
              isDragging
                ? "border-[#2C365D] bg-[#2C365D]/5 dark:border-[#7c8cb8] dark:bg-[#7c8cb8]/10"
                : "border-border bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100/80 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:hover:bg-gray-800/80",
              uploading && "pointer-events-none opacity-70"
            )}
          >
            <Icon
              name="upload"
              size={attachments.length > 0 ? 28 : 40}
              className="text-muted-foreground shrink-0"
            />
            <span
              className="text-center font-medium text-gray-700 dark:text-gray-300"
              style={{ fontSize: "var(--tally-font-size-sm)" }}
            >
              {isDragging
                ? "Drop files here"
                : "Drag files here or click to upload"}
            </span>
            <span
              className="text-center text-muted-foreground"
              style={{ fontSize: "var(--tally-font-size-xs)" }}
            >
              Upload from your computer · PDF, Word, Excel, images
            </span>
          </button>
        </div>
      )}

      {attachments.length === 0 && !(canUpload && showUploadArea) && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No attachments
        </p>
      )}

      {canRemove && (
        <AlertDialog
          open={attachmentToRemove != null}
          onOpenChange={(open) => !open && setAttachmentToRemove(null)}
        >
          <AlertDialogContent
            className="max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Remove file</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to remove{" "}
                <strong className="text-gray-900 dark:text-gray-100">
                  {attachmentToRemove?.name}
                </strong>{" "}
                from this case. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (attachmentToRemove && onRemove) {
                    onRemove(attachmentToRemove.id);
                    setAttachmentToRemove(null);
                  }
                }}
                className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
