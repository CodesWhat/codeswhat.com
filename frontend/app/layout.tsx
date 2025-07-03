import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon-black.svg"
        />
        <link
          rel="alternate icon"
          href="/favicon.ico"
        />
        <meta name="apple-mobile-web-app-title" content={process.env.NEXT_PUBLIC_SITE_NAME || "CodesWhat?"} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
