"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";
import type { CardPriority } from "@/generated/prisma/client";

export async function updateCardAction(cardId: string, formData: FormData) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  await assertUser();

  const dueDateRaw = String(formData.get("dueDate") || "");

  await prisma.contentCard.update({
    where: { id: cardId },
    data: {
      title: String(formData.get("title") || card.title).trim() || card.title,
      format: (formData.get("format") as string) || null,
      channel: (formData.get("channel") as string) || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      priority: (formData.get("priority") as CardPriority) || card.priority,
      script: (formData.get("script") as string) || null,
      caption: (formData.get("caption") as string) || null,
      internalNotes: (formData.get("internalNotes") as string) || null,
    },
  });

  revalidatePath(`/clientes/${card.clientId}/cards/${cardId}`);
  revalidatePath("/");
}

export async function moveCardStageAction(cardId: string, toStageId: string) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  const user = await assertUser();

  if (card.stageId !== toStageId) {
    await prisma.contentCard.update({ where: { id: cardId }, data: { stageId: toStageId } });
    await prisma.cardStageHistory.create({
      data: { cardId, fromStageId: card.stageId, toStageId, changedById: user.id },
    });
  }

  revalidatePath(`/clientes/${card.clientId}/cards/${cardId}`);
  revalidatePath("/");
}

export async function addCardCommentAction(cardId: string, formData: FormData) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  const user = await assertUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await prisma.cardComment.create({
    data: { cardId, authorType: "STAFF", authorId: user.id, authorName: user.name, body },
  });

  revalidatePath(`/clientes/${card.clientId}/cards/${cardId}`);
}
