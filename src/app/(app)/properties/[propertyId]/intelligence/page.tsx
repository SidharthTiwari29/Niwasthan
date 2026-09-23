import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/server/middleware/requireAuth";
import { propertyService } from "@/server/services/propertyService";
import { IntelligenceWorkspace } from "./IntelligenceWorkspace";

type PageProps = { params: Promise<{ propertyId: string }> };

export default async function PropertyIntelligencePage({ params }: PageProps) {
  const { propertyId } = await params;
  const { userId } = await requireAuth();
  const property = await propertyService.get(propertyId, userId);
  if (!property) notFound();
  return (
    <div className="space-y-6">
      <Link
        href={`/properties/${propertyId}`}
        className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← Back to {property.name}
      </Link>
      <IntelligenceWorkspace
        propertyId={propertyId}
        propertyName={property.name}
      />
    </div>
  );
}
