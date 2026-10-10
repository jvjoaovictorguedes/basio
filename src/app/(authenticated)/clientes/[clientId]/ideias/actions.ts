"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertClientAccess } from "@/lib/authz";
import type { ContentChannel, ContentFormat } from "@/generated/prisma/client";

export async function createIdeaAction(clientId: string, formData: FormData) {
  const user = await assertClientAccess(clientId);

  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Informe o título da ideia.");

  const idea = await prisma.ideaBank.create({
    data: {
      clientId,
      title,
      description: (formData.get("description") as string) || null,
      format: (formData.get("format") as ContentFormat) || null,
      channel: (formData.get("channel") as ContentChannel) || null,
      pillarId: (formData.get("pillarId") as string) || null,
      createdById: user.id,
    },
    include: { pillar: { select: { id: true, name: true, color: true } } },
  });

  revalidatePath(`/clientes/${clientId}/ideias`);
  return idea;
}

export async function deleteIdeaAction(ideaId: string) {
  const idea = await prisma.ideaBank.findUniqueOrThrow({ where: { id: ideaId } });
  await assertClientAccess(idea.clientId);
  await prisma.ideaBank.delete({ where: { id: ideaId } });
  revalidatePath(`/clientes/${idea.clientId}/ideias`);
}

export async function convertIdeaToCardAction(ideaId: string) {
  const idea = await prisma.ideaBank.findUniqueOrThrow({ where: { id: ideaId } });
  const user = await assertClientAccess(idea.clientId);

  const firstStage = await prisma.pipelineStage.findFirstOrThrow({
    where: { clientId: idea.clientId },
    orderBy: { position: "asc" },
  });

  const card = await prisma.$transaction(async (tx) => {
    const created = await tx.contentCard.create({
      data: {
        clientId: idea.clientId,
        stageId: firstStage.id,
        title: idea.title,
        format: idea.format ?? undefined,
        channel: idea.channel ?? undefined,
        pillarId: idea.pillarId,
        caption: idea.description,
        position: 0,
        createdById: user.id,
      },
    });

    await tx.cardStageHistory.create({
      data: { cardId: created.id, toStageId: firstStage.id, changedById: user.id },
    });

    await tx.ideaBank.update({
      where: { id: idea.id },
      data: { status: "CONVERTED", convertedCardId: created.id },
    });

    return created;
  });

  revalidatePath(`/clientes/${idea.clientId}/ideias`);
  revalidatePath(`/clientes/${idea.clientId}/producao`);
  return card.id;
}
