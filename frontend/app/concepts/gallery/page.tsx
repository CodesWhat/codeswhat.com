import { ConceptShell } from "@/components/concepts/ConceptShell";
import { GalleryConcept } from "@/components/concepts/GalleryConcept";

export default function GalleryConceptPage() {
  return (
    <ConceptShell
      eyebrow="Option 03"
      title="Artifact Gallery"
      summary="A case-study wall built from shipped work, notes, UI fragments, and release evidence."
    >
      <GalleryConcept />
    </ConceptShell>
  );
}
