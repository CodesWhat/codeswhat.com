import { Footer } from "@/components/catalogue/Footer";
import { Shell } from "@/components/catalogue/Shell";

// The Catalogue shell wraps every public route. The dev-only /studio capture pages sit
// outside this group so their transparent canvases are not painted over by the paper.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      {children}
      <Footer />
    </Shell>
  );
}
