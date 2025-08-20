import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Personal Blog and Portfolio",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?",
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Personal Blog and Portfolio",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?",
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Personal Blog and Portfolio",
    creator: "@codeswhat",
  },
  icons: {
    icon: [
      // Light mode favicon
      {
        url: "/favicon-green.svg",
        media: "(prefers-color-scheme: light)",
        type: "image/svg+xml",
      },
      // Dark mode favicon
      {
        url: "/favicon-green.svg",
        media: "(prefers-color-scheme: dark)",
        type: "image/svg+xml",
      },
      // Fallback for browsers that don't support media queries
      {
        url: "/favicon.ico",
        sizes: "32x32",
      },
      {
        url: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="apple-mobile-web-app-title"
          content={process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?"}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
        <Toaster
          position="bottom-right"
          theme="system"
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
              backdropFilter: "blur(8px)",
            },
            className:
              "!bg-white dark:!bg-neutral-900 !text-neutral-900 dark:!text-neutral-100 !border-neutral-200 dark:!border-neutral-800 !shadow-lg group",
            duration: 5000, // 5 seconds before auto-dismiss
          }}
          richColors
          closeButton
          expand={false} // Don't expand on hover
          gap={12} // Space between toasts
        />
      </body>
    </html>
  );
}
