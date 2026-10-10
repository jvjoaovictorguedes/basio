import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/lib/authz";
import { KanbanBoard } from "./kanban-board";

export default async function ProducaoPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const user = await requireClientAccess(clientId);

  const [stages, pillars, collaboratorLinks, admins] = await Promise.all([
    prisma.pipelineStage.findMany({
      where: { clientId },
      orderBy: { position: "asc" },
      include: {
        cards: {
          orderBy: { position: "asc" },
          include: {
            pillar: { select: { id: true, name: true, color: true } },
            responsible: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.contentPillar.findMany({ where: { clientId }, orderBy: { position: "asc" } }),
    prisma.clientCollaborator.findMany({
      where: { clientId },
      include: { user: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, name: true } }),
  ]);

  const teamMap = new Map<string, { id: string; name: string }>();
  admins.forEach((a) => teamMap.set(a.id, a));
  collaboratorLinks.forEach((l) => teamMap.set(l.user.id, l.user));

  return (
    <KanbanBoard
      key={clientId}
      clientId={clientId}
      initialStages={stages}
      pillars={pillars}
      team={Array.from(teamMap.values())}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
