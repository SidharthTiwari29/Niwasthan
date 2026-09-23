import { SupplierPortal } from "./SupplierPortal";

type PageProps = { params: Promise<{ token: string }> };

export default async function SupplierPortalPage({ params }: PageProps) {
  const { token } = await params;
  return <SupplierPortal token={token} />;
}
