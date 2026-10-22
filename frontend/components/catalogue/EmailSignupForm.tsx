"use client";

import posthog from "posthog-js";
import { useState } from "react";
import styles from "./catalogue.module.css";

// Maps the /api/subscribe status to a fixed error_class. Never the email or the
// response text; the sanitizer drops anything outside this list.
function classifyNewsletterError(status: number) {
  if (status === 429) return "rate_limited";
  if (status === 400) return "invalid_email";
  return "unavailable";
}

type Status = "idle" | "loading" | "success" | "error";

export function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

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

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json().catch(() => ({}));

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
      posthog.capture("newsletter submitted", { result: "error", error_class: "network" });
      fail("Network error. Check your connection and try again.");
    }
  };

  const busy = status === "loading" || status === "success";

  return (
    <form onSubmit={handleSubmit} className={styles.signup} noValidate>
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
