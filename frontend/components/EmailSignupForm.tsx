"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Bot trap
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot (anti-bot)
    if (honeypot) {
      setStatus("success");
      toast.success("What's next? Check your inbox to find out 👀", {
        icon: "🎯",
        duration: 5000,
      });
      return; // Silently fail for bots
    }

    // Client-side validation
    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setStatus("error");
      toast.error("⚠️ Please enter a valid email address");
      return;
    }

    // Length check
    if (trimmedEmail.length > 254) {
      setStatus("error");
      toast.error("📏 Email address is too long");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        toast.success("What's next? Check your inbox to find out 👀", {
          icon: "🎯",
          duration: 5000,
        });
        setEmail(""); // Clear the input

        // Reset form after 10 seconds
        setTimeout(() => {
          setStatus("idle");
        }, 10000);
      } else {
        setStatus("error");
        toast.error(data.error || "❌ Something went wrong", {
          duration: 5000,
        });

        // Reset error after 5 seconds
        setTimeout(() => {
          setStatus("idle");
        }, 5000);
      }
    } catch {
      setStatus("error");
      toast.error("🌐 Network error. Please check your connection and try again.", {
        duration: 5000,
      });

      // Reset error after 5 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Prevent excessive length on input
    if (value.length <= 254) {
      setEmail(value);
    }
  };

  return (
    <div>
      <h3 className="mb-2 flex items-center justify-center gap-2 text-lg font-semibold">
        <Bell className="h-5 w-5" />
        Get Notified
      </h3>
      <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
        Be the first to know when we launch our services!
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={handleEmailChange}
          className="flex-1 rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
          required
          disabled={status === "loading" || status === "success"}
          maxLength={254}
          autoComplete="email"
          inputMode="email"
        />

        {/* Honeypot field - hidden from users, visible to bots */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={status === "loading" || status === "success"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Subscribing...
            </>
          ) : status === "success" ? (
            "✓ Subscribed!"
          ) : (
            "Notify Me"
          )}
        </Button>
      </form>
    </div>
  );
}
