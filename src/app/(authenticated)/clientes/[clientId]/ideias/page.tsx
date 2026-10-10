import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/lib/authz";
import { IdeaBankView } from "./idea-bank-view";

export default async function IdeiasPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await requireClientAccess(clientId);

  const [ideas, pillars] = await Promise.all([
    prisma.ideaBank.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: { pillar: { select: { id: true, name: true, color: true } } },
    }),
    prisma.contentPillar.findMany({ where: { clientId }, orderBy: { position: "asc" } }),
  ]);

  return (
    <IdeaBankView key={clientId} clientId={clientId} initialIdeas={ideas} pillars={pillars} />
  );
}
