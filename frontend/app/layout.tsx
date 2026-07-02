import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemedToaster } from "@/components/site/ThemedToaster";
import { BASE_URL, OG_IMAGE, SITE_CONFIG } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// env overrides for the shared shell, falling back to the real brand values
// (not the old scaffolding defaults) so non-homepage routes stay on-brand
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || SITE_CONFIG.name;
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || SITE_CONFIG.description;

export const metadata: Metadata = {
  title: siteName,
  description: siteDescription,
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: siteName,
    description: siteDescription,
    url: BASE_URL,
    siteName,
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    site: SITE_CONFIG.twitterCreator,
    creator: SITE_CONFIG.twitterCreator,
    images: [OG_IMAGE],
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
        <meta name="apple-mobile-web-app-title" content={siteName} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Dark by default (the 3D layer is tuned for black); light is an
                // explicit opt-in via the header toggle.
                if (localStorage.theme === 'light') {
                  document.documentElement.classList.remove('dark')
                } else {
                  document.documentElement.classList.add('dark')
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
        <ThemedToaster />
      </body>
    </html>
  );
}
