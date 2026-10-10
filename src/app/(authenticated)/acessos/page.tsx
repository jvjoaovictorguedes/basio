import { requireAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { AcessosView } from "./acessos-view";

export default async function AcessosPage() {
  await requireAdmin();

  const [clients, collaborators, invites] = await Promise.all([
    prisma.client.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "COLLABORATOR" },
      orderBy: { name: "asc" },
      include: { clientCollaborations: { include: { client: { select: { id: true, name: true } } } } },
    }),
    prisma.invite.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AcessosView
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      collaborators={collaborators.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        clients: c.clientCollaborations.map((l) => l.client),
      }))}
      invites={invites.map((i) => ({
        id: i.id,
        email: i.email,
        name: i.name,
        clientIds: i.clientIds,
        token: i.token,
      }))}
    />
  );
}
