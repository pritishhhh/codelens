"use client";

import { useEffect, useState } from "react";

// Hydrate after mount to avoid SSR mismatches. Never persist before hydration,
// otherwise the initial empty draft could overwrite a user's saved work.
export function usePersistentDraft<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
) {
  const [draft, setDraft] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isValid(parsed)) setDraft(parsed);
      }
    } catch {
      setStorageAvailable(false);
    } finally {
      setReady(true);
    }
  }, [key, isValid]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(draft));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [draft, key, ready]);

  return { draft, setDraft, ready, storageAvailable };
}
