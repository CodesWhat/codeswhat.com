import { EmailSignupForm } from "@/components/EmailSignupForm";

/**
 * Contact — the email signup, server-rendered inline on a dark card (not hidden
 * behind a modal) so it works without JS and gives lead capture a real home.
 */
export function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-20 px-4 pt-20 pb-24 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm backdrop-blur-sm dark:border-white/5 dark:bg-neutral-900/50 dark:shadow-none sm:p-12">
        <p className="mb-3 font-mono text-xs font-semibold tracking-[0.2em] text-lime-700 uppercase dark:text-lime-300">
          Stay in the loop
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-white">
          Get notified when something ships
        </h2>
        <p className="mx-auto mt-3 max-w-md text-base text-neutral-600 dark:text-neutral-400">
          A note when something new ships. No spam.
        </p>
        <div className="mx-auto mt-8 max-w-md">
          <EmailSignupForm />
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          or email{" "}
          <a
            href="mailto:hello@codeswhat.com"
            className="font-medium text-neutral-900 underline decoration-lime-400/60 underline-offset-2 hover:text-lime-600 dark:text-white dark:hover:text-lime-200"
          >
            hello@codeswhat.com
          </a>
        </p>
      </div>
    </section>
  );
}
