import { notFound } from "next/navigation";
import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { CardDetailView } from "./card-detail-view";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; cardId: string }>;
}) {
  const { clientId, cardId } = await params;
  await requireUser();

  const [card, stages] = await Promise.all([
    prisma.contentCard.findUnique({
      where: { id: cardId },
      include: {
        stage: true,
        client: { select: { id: true, name: true } },
        comments: { orderBy: { createdAt: "asc" } },
        stageHistory: {
          include: { fromStage: { select: { name: true } }, toStage: { select: { name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.pipelineStage.findMany({ where: { clientId }, orderBy: { position: "asc" } }),
  ]);

  if (!card || card.clientId !== clientId) notFound();

  return <CardDetailView card={card} stages={stages} />;
}
