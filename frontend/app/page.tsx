import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Github, Mail } from "lucide-react";
import { EmailSignupForm } from "@/components/EmailSignupForm";

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://codeswhat.com";

  // Structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CodesWhat",
    url: baseUrl,
    logo: `${baseUrl}/logo-transparent.png`,
    description:
      "Where curiosity meets code. Crafting innovative digital solutions and transforming ideas into elegant, scalable applications.",
    sameAs: ["https://github.com/codeswhat", "https://twitter.com/codeswhat"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@codeswhat.com",
      contactType: "customer service",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
        {/* Background Pattern */}
        <div className="bg-grid-neutral-200/50 dark:bg-grid-neutral-800/50 absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
          {/* Logo Animation */}
          <div className="animate-float mb-8">
            <Image
              src="/logos/codeswhat-logo-green.png"
              alt="CodesWhat Logo"
              width={180}
              height={180}
              className="drop-shadow-2xl transition-all duration-300 dark:brightness-200 dark:invert"
              priority
            />
          </div>

          {/* Coming Soon Badge */}
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            🚀 Coming Soon
          </Badge>

          {/* Main Content */}
          <div className="max-w-3xl text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl dark:text-neutral-50">
              <span className="bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent dark:from-neutral-100 dark:to-neutral-400">
                CodesWhat?
              </span>
            </h1>

            <p className="mb-8 text-lg text-neutral-600 sm:text-xl dark:text-neutral-400">
              Where curiosity meets code. Crafting innovative digital solutions and transforming
              ideas into elegant, scalable applications.
            </p>

            {/* Email Signup */}
            <Card className="mx-auto mb-8 max-w-md border-neutral-200 bg-white/50 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50">
              <div className="p-6">
                <EmailSignupForm />
              </div>
            </Card>

            {/* Social Links */}
            <div className="flex items-center justify-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@codeswhat.com"
                className="rounded-full p-2 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Footer */}
          <footer className="absolute bottom-4 text-center text-sm text-neutral-500 dark:text-neutral-500">
            <p>&copy; {new Date().getFullYear()} CodesWhat. All rights reserved.</p>
          </footer>
        </div>
      </main>
    </>
  );
}
