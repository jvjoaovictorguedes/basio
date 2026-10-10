import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/lib/authz";
import { CalendarView } from "./calendar-view";

export default async function CalendarioPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireClientAccess(clientId);

  const [cards, pillars, collaboratorLinks, admins] = await Promise.all([
    prisma.contentCard.findMany({
      where: { clientId, scheduledAt: { not: null } },
      orderBy: { scheduledAt: "asc" },
      include: {
        pillar: { select: { id: true, name: true, color: true } },
        responsible: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
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
    <CalendarView
      key={clientId}
      clientId={clientId}
      initialCards={cards}
      pillars={pillars}
      team={Array.from(teamMap.values())}
    />
  );
}
