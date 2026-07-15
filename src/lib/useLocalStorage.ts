"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Reads/writes a JSON value in localStorage. `loaded` is false until the initial
 * client-side read completes, so callers can avoid rendering onboarding UI before
 * we know whether the user already has data saved.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Reading localStorage can only happen client-side, so this has to be an
    // effect rather than lazy useState initial value (that would mismatch SSR output).
    try {
      const raw = window.localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw !== null) setValue(JSON.parse(raw));
    } catch {
      // ignore corrupt localStorage data, fall back to default
    }
    setLoaded(true);
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // storage full or unavailable, keep in-memory state anyway
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, update, loaded] as const;
}
