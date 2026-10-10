import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/lib/authz";
import { ConfiguracoesView } from "./configuracoes-view";

export default async function ConfiguracoesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireClientAccess(clientId);

  const [client, pillars, contacts, links, collaboratorUsers] = await Promise.all([
    prisma.client.findUniqueOrThrow({ where: { id: clientId } }),
    prisma.contentPillar.findMany({ where: { clientId }, orderBy: { position: "asc" } }),
    prisma.clientContact.findMany({ where: { clientId }, orderBy: { name: "asc" } }),
    prisma.clientCollaborator.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { role: "COLLABORATOR" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ConfiguracoesView
      client={{ id: client.id, name: client.name, color: client.color, status: client.status }}
      pillars={pillars}
      contacts={contacts}
      linkedCollaborators={links.map((l) => l.user)}
      allCollaborators={collaboratorUsers}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
