"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "shreycare-consent-v1";
const OPEN_EVENT = "shreycare:open-consent";

type Choice = "granted" | "denied";

declare global {
  interface Window {
    shreycareOpenConsent?: () => void;
  }
}

function applyConsent(choice: Choice) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  // gtag() pushes its `arguments` object (not an array) to dataLayer so
  // gtag.js parses the entry as a command. We mirror that shape here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag: (...args: unknown[]) => void = function (this: any) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  gtag("consent", "update", {
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
    analytics_storage: choice,
    functionality_storage: choice,
    personalization_storage: choice,
  });
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getStoredConsent(): Choice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  // null on server + initial client render, real value after hydration.
  const stored = useSyncExternalStore<Choice | null>(
    subscribeToStorage,
    getStoredConsent,
    () => null,
  );
  const [forceOpen, setForceOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Expose a window-level hook so footers, settings pages, or support pages
  // can re-open the banner to let users withdraw or change their choice.
  useEffect(() => {
    const open = () => {
      setDismissed(false);
      setForceOpen(true);
    };
    window.shreycareOpenConsent = open;
    window.addEventListener(OPEN_EVENT, open);
    return () => {
      delete window.shreycareOpenConsent;
      window.removeEventListener(OPEN_EVENT, open);
    };
  }, []);

  const save = useCallback((choice: Choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // Ignore storage errors; consent still applied for this session.
    }
    applyConsent(choice);
    setDismissed(true);
    setForceOpen(false);
  }, []);

  const visible = !dismissed && (forceOpen || stored === null);
  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-4 bottom-4 z-[60] md:inset-x-auto md:right-6 md:bottom-6 md:max-w-md rounded-lg bg-surface-container-lowest shadow-botanical-lg border border-outline-variant p-6"
    >
      <h2 className="font-headline text-lg text-primary font-bold mb-2">
        We value your privacy
      </h2>
      <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
        We use cookies to analyse traffic and improve your experience on
        ShreyCare Organics. You can accept all cookies, reject non-essential
        ones, or read our{" "}
        <Link
          href="/policies/privacy"
          className="underline text-primary hover:text-secondary"
        >
          Privacy &amp; Cookie Policy
        </Link>
        . You can change this choice at any time from the footer.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => save("denied")}
          className="flex-1 px-4 py-2 rounded-md border border-outline text-sm font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
        >
          Reject non-essential
        </button>
        <button
          type="button"
          onClick={() => save("granted")}
          className="flex-1 px-4 py-2 rounded-md bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Accept all
        </button>
      </div>
    </div>
  );
}

export function openCookiePreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_EVENT));
}
