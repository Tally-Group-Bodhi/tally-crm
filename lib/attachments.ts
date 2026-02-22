/**
 * Helpers for case attachment uploads: file type from name, size formatting.
 */

export const UPLOADS_DIR = "uploads";

/** Map file extension to Attachment.type for icon display */
export function attachmentTypeFromFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx", "txt"].includes(ext)) return "document";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  return "draft";
}

/** Format byte size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Sanitize filename for storage (keep extension, replace unsafe chars) */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/[^\w\s.-]/gi, "_").replace(/\s+/g, "_");
  return base.slice(0, 200) || "file";
}
