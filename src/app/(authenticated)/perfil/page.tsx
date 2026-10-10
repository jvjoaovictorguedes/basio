import { requireUser } from "@/lib/authz";
import { PerfilForm } from "./perfil-form";

export default async function PerfilPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-md px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Meu perfil</h1>
      <PerfilForm name={user.name ?? ""} email={user.email ?? ""} role={user.role} />
    </div>
  );
}
