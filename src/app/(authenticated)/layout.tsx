import { requireUser } from "@/lib/authz";
import { getVisibleClients } from "@/lib/clients-data";
import { AppShell } from "@/components/app-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const clients = await getVisibleClients(user);

  return (
    <AppShell
      clients={clients.map((c) => ({ id: c.id, name: c.name, color: c.color }))}
      userName={user.name ?? user.email ?? "Usuário"}
      userRole={user.role}
    >
      {children}
    </AppShell>
  );
}
