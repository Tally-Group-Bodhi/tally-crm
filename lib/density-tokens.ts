/**
 * Density tokens, breakpoints, and pure helper functions.
 *
 * This module is **server-safe** — it contains no React hooks or browser APIs.
 * Import from here when you only need the data or pure helpers
 * (e.g. inside a Server Component that cannot use `"use client"`).
 *
 * For React hooks (`useDensity`, `useDensityPreference`, `useViewportWidth`),
 * import from `@/lib/density` instead.
 */

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

/** The three density modes that map to viewport‐width ranges. */
export type DensityMode = "comfortable" | "normal" | "compact";

export interface DensityTokenSet {
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    xxl: string;
    "3xl": string;
    "4xl": string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
  iconSize: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Token definitions
// ────────────────────────────────────────────────────────────────────────────

/** Design tokens for each density mode. */
export const densityTokens: Record<DensityMode, DensityTokenSet> = {
  comfortable: {
    // Full HD, QHD, 4K (1920 px and above)
    spacing: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "32px", xxl: "48px" },
    fontSize: { xs: "12px", sm: "14px", base: "16px", lg: "18px", xl: "20px", xxl: "24px", "3xl": "30px", "4xl": "36px" },
    lineHeight: { tight: "1.25", normal: "1.5", relaxed: "1.75" },
    iconSize: { sm: "16px", md: "20px", lg: "24px", xl: "32px" },
    borderRadius: { sm: "4px", md: "8px", lg: "12px" },
  },
  normal: {
    // Typical laptops, smaller externals (1280 px – 1919 px)
    spacing: { xs: "3px", sm: "6px", md: "12px", lg: "16px", xl: "24px", xxl: "32px" },
    fontSize: { xs: "11px", sm: "13px", base: "14px", lg: "16px", xl: "18px", xxl: "20px", "3xl": "24px", "4xl": "30px" },
    lineHeight: { tight: "1.2", normal: "1.4", relaxed: "1.6" },
    iconSize: { sm: "14px", md: "18px", lg: "20px", xl: "28px" },
    borderRadius: { sm: "3px", md: "6px", lg: "10px" },
  },
  compact: {
    // Small laptops, constrained viewports (below 1280 px)
    spacing: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px", xxl: "24px" },
    fontSize: { xs: "10px", sm: "12px", base: "13px", lg: "14px", xl: "16px", xxl: "18px", "3xl": "20px", "4xl": "24px" },
    lineHeight: { tight: "1.15", normal: "1.35", relaxed: "1.5" },
    iconSize: { sm: "12px", md: "16px", lg: "18px", xl: "24px" },
    borderRadius: { sm: "2px", md: "4px", lg: "8px" },
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Breakpoints
// ────────────────────────────────────────────────────────────────────────────

/**
 * Minimum viewport widths that activate each density mode.
 * The runtime picks the **first mode whose min-width the viewport meets**,
 * checked from largest to smallest.
 */
export const densityBreakpoints: Record<DensityMode, number> = {
  comfortable: 1920, // 1920px and above (Full HD, QHD, 4K)
  normal: 1280,      // 1280px – 1919px (typical laptops, smaller externals)
  compact: 0,        // Below 1280px (small laptops, constrained viewports)
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Pure helpers (no React dependency)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Determine density mode from a pixel width.
 *
 * @example
 * ```ts
 * densityFromWidth(1920); // "comfortable"
 * densityFromWidth(1500); // "normal"
 * densityFromWidth(1100); // "compact"
 * ```
 */
export function densityFromWidth(width: number): DensityMode {
  if (width >= densityBreakpoints.comfortable) return "comfortable";
  if (width >= densityBreakpoints.normal) return "normal";
  return "compact";
}

/**
 * Pick a value from a per-density map.
 *
 * @example
 * ```ts
 * getDensityClasses("compact", {
 *   comfortable: "p-6 text-base",
 *   normal:      "p-4 text-sm",
 *   compact:     "p-3 text-xs",
 * });
 * // → "p-3 text-xs"
 * ```
 */
export function getDensityClasses(
  density: DensityMode,
  classes: Record<DensityMode, string>,
): string {
  return classes[density];
}

/**
 * Build a flat `Record<string, string>` of CSS custom properties for a given
 * density mode.  Useful for applying via `style` attributes or
 * `CSSStyleDeclaration.setProperty`.
 *
 * @example
 * ```ts
 * getDensityCSS("compact");
 * // → { "--tally-spacing-xs": "2px", "--tally-font-size-base": "13px", … }
 * ```
 */
export function getDensityCSS(density: DensityMode): Record<string, string> {
  const t = densityTokens[density];
  return {
    // Spacing
    "--tally-spacing-xs": t.spacing.xs,
    "--tally-spacing-sm": t.spacing.sm,
    "--tally-spacing-md": t.spacing.md,
    "--tally-spacing-lg": t.spacing.lg,
    "--tally-spacing-xl": t.spacing.xl,
    "--tally-spacing-xxl": t.spacing.xxl,
    // Font size
    "--tally-font-size-xs": t.fontSize.xs,
    "--tally-font-size-sm": t.fontSize.sm,
    "--tally-font-size-base": t.fontSize.base,
    "--tally-font-size-lg": t.fontSize.lg,
    "--tally-font-size-xl": t.fontSize.xl,
    "--tally-font-size-xxl": t.fontSize.xxl,
    "--tally-font-size-3xl": t.fontSize["3xl"],
    "--tally-font-size-4xl": t.fontSize["4xl"],
    // Line height
    "--tally-line-height-tight": t.lineHeight.tight,
    "--tally-line-height-normal": t.lineHeight.normal,
    "--tally-line-height-relaxed": t.lineHeight.relaxed,
    // Icon size
    "--tally-icon-size-sm": t.iconSize.sm,
    "--tally-icon-size-md": t.iconSize.md,
    "--tally-icon-size-lg": t.iconSize.lg,
    "--tally-icon-size-xl": t.iconSize.xl,
    // Border radius
    "--tally-radius-sm": t.borderRadius.sm,
    "--tally-radius-md": t.borderRadius.md,
    "--tally-radius-lg": t.borderRadius.lg,
  };
}
