import { Geist_Mono } from "next/font/google";

// Geist Mono — the go-to, and monospace keeps the terminal feel of the wordmark.
const geistMono = Geist_Mono({ subsets: ["latin"] });

/**
 * Text-only header wordmark: `codeswhat?` in mono, lowercase, with the "?" in
 * lime (echoing the C?W logo mark). No disc, no cursor — the type is the mark.
 */
export function Wordmark() {
  return (
    <span className={`${geistMono.className} text-[15px] font-medium tracking-tight text-fg`}>
      codeswhat<span className="text-brand">?</span>
    </span>
  );
}
