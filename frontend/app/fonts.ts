import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";

export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-cat-serif",
  display: "swap",
});

export const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-cat-sans",
  display: "swap",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-cat-mono",
  display: "swap",
});

export const fontVars = `${serif.variable} ${sans.variable} ${mono.variable}`;
