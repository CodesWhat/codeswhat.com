import { ConceptShell } from "@/components/concepts/ConceptShell";
import { ConsoleConcept } from "@/components/concepts/ConsoleConcept";

export default function ConsoleConceptPage() {
  return (
    <ConceptShell
      eyebrow="Option 02"
      title="Product Studio Console"
      summary="A restrained product-studio homepage with operational cards, docs paths, and live-project gravity."
    >
      <ConsoleConcept />
    </ConceptShell>
  );
}
