import { EmailSignupForm } from "@/components/EmailSignupForm";

/**
 * Contact — the email signup, server-rendered inline on a dark card (not hidden
 * behind a modal) so it works without JS and gives lead capture a real home.
 */
export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-20 px-4 pt-20 pb-24 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-8 text-center shadow-sm backdrop-blur-sm dark:shadow-none sm:p-12">
        <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-brand uppercase">
          Stay in the loop
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Get notified when something ships
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-fg-muted">
          A note when something new ships. No spam.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <EmailSignupForm />
        </div>
        <p className="mt-6 text-sm text-fg-faint">
          or email{" "}
          <a
            href="mailto:hello@codeswhat.com"
            className="font-medium text-fg underline decoration-brand/60 underline-offset-2 hover:text-brand-hover"
          >
            hello@codeswhat.com
          </a>
        </p>
      </div>
    </section>
  );
}
