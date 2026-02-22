/**
 * Derives a short prefix from an account name for use in case numbers.
 * Multi-word names: first letter of each word (max 4 chars).
 * Single word: first 4 characters.
 */
export function accountNameToCaseNumberPrefix(accountName: string): string {
  const trimmed = accountName.trim();
  if (!trimmed) return "CASE";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 4)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }
  return trimmed.slice(0, 4).toUpperCase().replace(/\s/g, "").replace(/[^A-Z0-9]/g, "") || "CASE";
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Generates a case number from account name and sequence: PREFIX-YYYY-NNNNNN
 */
export function generateCaseNumber(
  accountName: string,
  sequence: number,
  year: number = CURRENT_YEAR
): string {
  const prefix = accountNameToCaseNumberPrefix(accountName);
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}
