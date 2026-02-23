"use client";

/**
 * Density system — React hooks + re-exported tokens.
 *
 * This module re-exports everything from `@/lib/density-tokens` (server-safe
 * types, token data, and pure helpers) and adds **client-only** React hooks.
 *
 * If you only need types / tokens / pure helpers inside a Server Component,
 * import from `@/lib/density-tokens` directly to avoid the `"use client"` boundary.
 */

import { useCallback, useSyncExternalStore } from "react";

// ── Re-export all server-safe tokens, types, and helpers ────────────────
export {
  type DensityMode,
  type DensityTokenSet,
  densityTokens,
  densityBreakpoints,
  densityFromWidth,
  getDensityClasses,
  getDensityCSS,
} from "./density-tokens";

import { type DensityMode, densityFromWidth, getDensityCSS } from "./density-tokens";

// ────────────────────────────────────────────────────────────────────────────
// Viewport store (framework-agnostic singleton)
// ────────────────────────────────────────────────────────────────────────────

type Listener = () => void;

let _listeners: Listener[] = [];
let _width: number | null = null; // null = SSR / not yet initialised

function getServerSnapshot(): number {
  return 1400; // Default to "normal" during SSR (1280–1919 range)
}

function getSnapshot(): number {
  if (_width === null) {
    _width = typeof window !== "undefined" ? window.innerWidth : getServerSnapshot();
  }
  return _width;
}

function subscribe(listener: Listener): () => void {
  _listeners.push(listener);

  // Lazily attach the global resize handler the first time someone subscribes.
  if (_listeners.length === 1 && typeof window !== "undefined") {
    _width = window.innerWidth;
    window.addEventListener("resize", handleResize);
  }

  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
    if (_listeners.length === 0 && typeof window !== "undefined") {
      window.removeEventListener("resize", handleResize);
    }
  };
}

function handleResize() {
  const next = window.innerWidth;
  if (next !== _width) {
    _width = next;
    for (const l of _listeners) l();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// React hooks
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current viewport width, updating on resize.
 * SSR-safe (returns 1400 on the server).
 */
export function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Auto-detect the current density mode based on viewport width.
 * Listens to window resize and re-renders when the mode changes.
 * SSR-safe (defaults to `"normal"`).
 *
 * @example
 * ```tsx
 * const density = useDensity();
 * // → "compact" on a 1440 px laptop
 * ```
 */
export function useDensity(): DensityMode {
  const width = useViewportWidth();
  return densityFromWidth(width);
}

// ────────────────────────────────────────────────────────────────────────────
// Density preference store (shared singleton, like the viewport store above)
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "tally-density-preference";

let _prefListeners: Listener[] = [];
let _prefOverride: DensityMode | null = null;
let _prefInitialised = false;

/**
 * Apply or remove density CSS custom properties on `document.documentElement`.
 *
 * When a mode is provided the corresponding token values are set as inline
 * styles on `:root`, which **override** the media-query-based values from
 * `density.css`.  Passing `null` removes them so the media queries resume
 * control.
 */
function applyDensityToRoot(mode: DensityMode | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode) {
    const vars = getDensityCSS(mode);
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  } else {
    // Remove all density overrides so media queries take over again.
    const keys = Object.keys(getDensityCSS("normal"));
    for (const key of keys) {
      root.style.removeProperty(key);
    }
  }
}

function initPref() {
  if (_prefInitialised) return;
  _prefInitialised = true;
  if (typeof window === "undefined") return;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "comfortable" || stored === "normal" || stored === "compact") {
    _prefOverride = stored;
    // Apply stored preference to :root so CSS utilities pick it up immediately.
    applyDensityToRoot(stored);
  }
}

function getPrefSnapshot(): DensityMode | null {
  initPref();
  return _prefOverride;
}

function getPrefServerSnapshot(): DensityMode | null {
  return null;
}

function subscribePref(listener: Listener): () => void {
  _prefListeners.push(listener);
  return () => {
    _prefListeners = _prefListeners.filter((l) => l !== listener);
  };
}

function notifyPref() {
  for (const l of _prefListeners) l();
}

/** Imperatively set the density override (shared across all hook consumers). */
export function setDensityPreference(mode: DensityMode) {
  _prefOverride = mode;
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, mode);
  applyDensityToRoot(mode);
  notifyPref();
}

/** Imperatively clear the density override (shared across all hook consumers). */
export function resetDensityPreference() {
  _prefOverride = null;
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  applyDensityToRoot(null);
  notifyPref();
}

/**
 * Like {@link useDensity}, but allows the user to pin a specific density mode
 * that persists in `localStorage`.  The preference is a **shared singleton** —
 * every component that calls this hook sees the same value and re-renders
 * together when it changes.
 *
 * @example
 * ```tsx
 * const { density, setDensity, isAutoDetect, resetToAuto } = useDensityPreference();
 * ```
 */
export function useDensityPreference() {
  const autoDetected = useDensity();

  const override = useSyncExternalStore(
    subscribePref,
    getPrefSnapshot,
    getPrefServerSnapshot,
  );

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityPreference(mode);
  }, []);

  const resetToAuto = useCallback(() => {
    resetDensityPreference();
  }, []);

  return {
    /** The effective density mode (override or auto-detected). */
    density: override ?? autoDetected,
    /** The auto-detected mode (ignoring any override). */
    autoDetected,
    /** Pin to a specific density mode. */
    setDensity,
    /** Clear the override and return to auto-detection. */
    resetToAuto,
    /** `true` when no user override is active. */
    isAutoDetect: override === null,
  } as const;
}
