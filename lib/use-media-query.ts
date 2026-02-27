"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe hook that tracks whether a CSS media query matches.
 * Returns `false` on the server and during hydration to avoid layout shift,
 * then syncs with the real value once mounted.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
