import { requireUser } from "@/lib/authz";
import { NewPageForm } from "@/components/new-page-form";

export default async function NovaPaginaGeralPage() {
  await requireUser();
  return <NewPageForm clientId={null} />;
}
