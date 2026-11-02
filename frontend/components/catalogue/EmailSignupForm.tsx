"use client";

import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import styles from "./catalogue.module.css";

// Maps the /api/subscribe status to a fixed error_class. Never the email or the
// response text; the sanitizer drops anything outside this list.
function classifyNewsletterError(status: number) {
  if (status === 429) return "rate_limited";
  if (status === 400) return "invalid_email";
  return "unavailable";
}

type Status = "idle" | "loading" | "success" | "error";

// Cloudflare Turnstile guards /api/subscribe. The script is only fetched once a
// visitor touches the form, and the widget stays invisible unless Cloudflare
// needs them to interact. Responses are single use, so every attempt resets it.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const CHALLENGE_WAIT_MS = 30_000;

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing"));
    script.onerror = () => {
      script.remove();
      scriptPromise = null; // allow a retry after a blocked or failed load
      reject(new Error("turnstile script failed"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

type Waiter = { resolve: (response: string) => void; reject: (error: Error) => void };
type ChallengeState = {
  widgetId: string | null;
  starting: Promise<string> | null;
  response: string | null;
  failed: boolean;
  waiter: Waiter | null;
};

export function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const container = useRef<HTMLDivElement>(null);
  const challenge = useRef<ChallengeState>({
    widgetId: null,
    starting: null,
    response: null,
    failed: false,
    waiter: null,
  });

  useEffect(() => {
    const state = challenge.current;
    return () => {
      if (state.widgetId) window.turnstile?.remove(state.widgetId);
      state.widgetId = null;
      state.starting = null;
    };
  }, []);

  const startChallenge = (): Promise<string> => {
    const state = challenge.current;
    if (!SITE_KEY || !container.current) return Promise.reject(new Error("no site key"));
    const target = container.current;
    state.starting ??= loadTurnstile().then(
      (api) => {
        state.widgetId = api.render(target, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
          callback: (response: string) => {
            state.response = response;
            state.failed = false;
            state.waiter?.resolve(response);
          },
          "error-callback": () => {
            state.response = null;
            state.failed = true;
            state.waiter?.reject(new Error("challenge error"));
          },
          "expired-callback": () => {
            state.response = null;
          },
          "timeout-callback": () => {
            state.response = null;
          },
        });
        return state.widgetId;
      },
      (error: Error) => {
        state.starting = null;
        throw error;
      },
    );
    return state.starting;
  };

  const resetChallenge = () => {
    const state = challenge.current;
    state.response = null;
    state.failed = false;
    if (state.widgetId) window.turnstile?.reset(state.widgetId);
  };

  const awaitResponse = (): Promise<string> => {
    const state = challenge.current;
    if (state.response) return Promise.resolve(state.response);
    if (state.failed) return Promise.reject(new Error("challenge error"));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        state.waiter = null;
        reject(new Error("challenge timed out"));
      }, CHALLENGE_WAIT_MS);
      state.waiter = {
        resolve: (response) => {
          clearTimeout(timer);
          state.waiter = null;
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          state.waiter = null;
          reject(error);
        },
      };
    });
  };

  const fail = (text: string) => {
    setStatus("error");
    setMessage(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot (anti-bot): pretend it worked, send nothing.
    if (honeypot) {
      setStatus("success");
      setMessage("Thanks. Check your inbox to find out what's next.");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      fail("Please enter a valid email address.");
      return;
    }
    if (trimmedEmail.length > 254) {
      fail("That email address is too long.");
      return;
    }

    setStatus("loading");
    setMessage("");

    let turnstileResponse: string;
    try {
      await startChallenge();
      if (challenge.current.failed) resetChallenge(); // retry a widget that errored earlier
      turnstileResponse = await awaitResponse();
    } catch {
      resetChallenge();
      fail("Couldn't finish the human check. Turn off any blocker for this page, then try again.");
      return;
    }

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, turnstileResponse }),
      });
      const data = await response.json().catch(() => ({}));
      resetChallenge(); // the response was spent either way

      if (response.ok) {
        posthog.capture("newsletter submitted", { result: "success" });
        setStatus("success");
        setMessage("Thanks. Check your inbox to find out what's next.");
        setEmail("");
      } else {
        posthog.capture("newsletter submitted", {
          result: "error",
          error_class: classifyNewsletterError(response.status),
        });
        fail(typeof data.error === "string" ? data.error : "Something went wrong. Try again.");
      }
    } catch {
      resetChallenge();
      posthog.capture("newsletter submitted", { result: "error", error_class: "network" });
      fail("Network error. Check your connection and try again.");
    }
  };

  const busy = status === "loading" || status === "success";

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={() => {
        if (SITE_KEY) startChallenge().catch(() => {});
      }}
      className={styles.signup}
      noValidate
    >
      <label htmlFor="signup-email" className={styles.signupLabel}>
        A note when something new ships. No spam.
      </label>
      <div className={styles.signupRow}>
        <input
          id="signup-email"
          type="email"
          name="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 254))}
          className={styles.signupInput}
          required
          disabled={busy}
          maxLength={254}
          autoComplete="email"
          inputMode="email"
        />

        {/* Honeypot field: hidden from people, visible to bots */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className={styles.srOnly}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <button type="submit" className={styles.btnLine} disabled={busy}>
          {status === "loading"
            ? "Subscribing..."
            : status === "success"
              ? "Subscribed"
              : "Notify me"}
        </button>
      </div>
      {/* Turnstile renders here; interaction-only keeps it empty unless a challenge is needed */}
      <div ref={container} className={styles.signupChallenge} />
      <p
        className={styles.signupMsg}
        data-state={status}
        role={status === "error" ? "alert" : "status"}
      >
        {message}
      </p>
    </form>
  );
}
