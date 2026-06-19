import { notFound } from "next/navigation";
import { MOCK_VETS } from "@/lib/data/mock-vets";
import VetBookingWizard from "@/components/care/VetBookingWizard";

export default function BookVetPage({ params }: { params: { vetId: string } }) {
  const vet = MOCK_VETS.find((v) => v.id === params.vetId);
  if (!vet) notFound();
  return <VetBookingWizard vet={vet} />;
}
