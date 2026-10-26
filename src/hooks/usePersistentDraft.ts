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
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      const preference = localStorage.getItem(`${key}:enabled`);
      // Preserve existing drafts during migration; new visitors opt in explicitly.
      const enabled = preference === "true" || (preference === null && saved !== null);
      setPersistenceEnabled(enabled);
      if (enabled && saved) {
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
    setSaving(persistenceEnabled);
    const persist = () => {
      try {
        localStorage.setItem(`${key}:enabled`, String(persistenceEnabled));
        if (persistenceEnabled) localStorage.setItem(key, JSON.stringify(draft));
        else localStorage.removeItem(key);
        setStorageAvailable(true);
      } catch {
        setStorageAvailable(false);
      } finally {
        setSaving(false);
      }
    };
    // Disabling removes stored source immediately; typing is debounced.
    if (!persistenceEnabled) { persist(); return; }
    const timer = window.setTimeout(persist, 300);
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") persist(); };
    // A reload or background transition must not discard the final debounce window.
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [draft, key, ready, persistenceEnabled]);

  return { draft, setDraft, ready, storageAvailable, persistenceEnabled, setPersistenceEnabled, saving };
}
