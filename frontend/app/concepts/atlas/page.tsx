import { AtlasConcept } from "@/components/concepts/AtlasConcept";
import { ConceptShell } from "@/components/concepts/ConceptShell";

export default function AtlasConceptPage() {
  return (
    <ConceptShell
      eyebrow="Option 01"
      title="CodesWhat Atlas"
      summary="A spatial showcase that turns CodesWhat projects into a browsable software map."
    >
      <AtlasConcept />
    </ConceptShell>
  );
}
