import { requireUser } from "@/lib/authz";
import { NewPageForm } from "@/components/new-page-form";

export default async function NovaPaginaClientePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireUser();
  return <NewPageForm clientId={clientId} />;
}
