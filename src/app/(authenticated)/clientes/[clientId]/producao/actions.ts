"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin, assertClientAccess } from "@/lib/authz";
import type { ContentChannel, ContentFormat } from "@/generated/prisma/client";

function computePosition(prev: number | null, next: number | null): number {
  if (prev === null && next === null) return 0;
  if (prev === null) return (next as number) - 1;
  if (next === null) return prev + 1;
  return (prev + next) / 2;
}

// ---------- Etapas (kanban) ----------

export async function createStageAction(clientId: string, name: string) {
  await assertAdmin();
  const last = await prisma.pipelineStage.findFirst({
    where: { clientId },
    orderBy: { position: "desc" },
  });
  await prisma.pipelineStage.create({
    data: { clientId, name, position: (last?.position ?? -1) + 1 },
  });
  revalidatePath(`/clientes/${clientId}/producao`);
}

export async function renameStageAction(stageId: string, name: string) {
  const stage = await prisma.pipelineStage.findUniqueOrThrow({ where: { id: stageId } });
  await assertAdmin();
  await prisma.pipelineStage.update({ where: { id: stageId }, data: { name } });
  revalidatePath(`/clientes/${stage.clientId}/producao`);
}

export async function deleteStageAction(stageId: string) {
  const stage = await prisma.pipelineStage.findUniqueOrThrow({
    where: { id: stageId },
    include: { _count: { select: { cards: true } } },
  });
  await assertAdmin();
  if (stage._count.cards > 0) {
    throw new Error("Mova ou exclua os cartões desta etapa antes de removê-la.");
  }
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  revalidatePath(`/clientes/${stage.clientId}/producao`);
}

export async function reorderStagesAction(clientId: string, orderedStageIds: string[]) {
  await assertAdmin();
  await prisma.$transaction(
    orderedStageIds.map((id, index) =>
      prisma.pipelineStage.update({ where: { id }, data: { position: index } }),
    ),
  );
  revalidatePath(`/clientes/${clientId}/producao`);
}

// ---------- Cartões ----------

export async function createCardAction(clientId: string, stageId: string, title: string) {
  const user = await assertClientAccess(clientId);
  const last = await prisma.contentCard.findFirst({
    where: { stageId },
    orderBy: { position: "desc" },
  });
  const card = await prisma.contentCard.create({
    data: {
      clientId,
      stageId,
      title,
      position: computePosition(last?.position ?? null, null),
      createdById: user.id,
    },
  });
  await prisma.cardStageHistory.create({
    data: { cardId: card.id, toStageId: stageId, changedById: user.id },
  });
  revalidatePath(`/clientes/${clientId}/producao`);
  revalidatePath(`/clientes/${clientId}/calendario`);
  return card.id;
}

export async function moveCardAction(
  cardId: string,
  toStageId: string,
  neighborPositions: { prev: number | null; next: number | null },
) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  const user = await assertClientAccess(card.clientId);

  const newPosition = computePosition(neighborPositions.prev, neighborPositions.next);
  const stageChanged = card.stageId !== toStageId;

  await prisma.contentCard.update({
    where: { id: cardId },
    data: { stageId: toStageId, position: newPosition },
  });

  if (stageChanged) {
    await prisma.cardStageHistory.create({
      data: {
        cardId,
        fromStageId: card.stageId,
        toStageId,
        changedById: user.id,
      },
    });
  }

  revalidatePath(`/clientes/${card.clientId}/producao`);
  revalidatePath(`/clientes/${card.clientId}/calendario`);
}

export async function deleteCardAction(cardId: string) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  await assertClientAccess(card.clientId);
  await prisma.contentCard.delete({ where: { id: cardId } });
  revalidatePath(`/clientes/${card.clientId}/producao`);
  revalidatePath(`/clientes/${card.clientId}/calendario`);
}

export async function updateCardAction(cardId: string, formData: FormData) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  await assertClientAccess(card.clientId);

  const scheduledAtRaw = String(formData.get("scheduledAt") || "");

  await prisma.contentCard.update({
    where: { id: cardId },
    data: {
      title: String(formData.get("title") || card.title).trim() || card.title,
      format: formData.get("format") as ContentFormat,
      channel: formData.get("channel") as ContentChannel,
      pillarId: (formData.get("pillarId") as string) || null,
      responsibleId: (formData.get("responsibleId") as string) || null,
      scheduledAt: scheduledAtRaw ? new Date(scheduledAtRaw) : null,
      script: (formData.get("script") as string) || null,
      caption: (formData.get("caption") as string) || null,
      internalNotes: (formData.get("internalNotes") as string) || null,
      visibleToClient: formData.get("visibleToClient") === "on",
    },
  });

  revalidatePath(`/clientes/${card.clientId}/producao`);
  revalidatePath(`/clientes/${card.clientId}/calendario`);
}

export async function addCommentAction(cardId: string, formData: FormData) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  const user = await assertClientAccess(card.clientId);
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await prisma.cardComment.create({
    data: { cardId, authorId: user.id, body },
  });
  revalidatePath(`/clientes/${card.clientId}/producao`);
}

export async function getCardDetailAction(cardId: string) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  await assertClientAccess(card.clientId);

  return prisma.contentCard.findUnique({
    where: { id: cardId },
    include: {
      pillar: true,
      responsible: { select: { id: true, name: true } },
      attachments: { include: { file: true }, orderBy: { createdAt: "desc" } },
      comments: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
      stageHistory: {
        include: {
          fromStage: { select: { name: true } },
          toStage: { select: { name: true } },
          changedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function uploadAttachmentAction(cardId: string, formData: FormData) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  const user = await assertClientAccess(card.clientId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("Selecione um arquivo.");

  const maxSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 20 * 1024 * 1024);
  if (file.size > maxSize) {
    throw new Error("Arquivo muito grande.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const storedFile = await prisma.file.create({
    data: {
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: buffer.byteLength,
      data: buffer,
      uploadedById: user.id,
    },
  });

  await prisma.cardAttachment.create({
    data: { cardId, fileId: storedFile.id },
  });

  revalidatePath(`/clientes/${card.clientId}/producao`);
}

export async function deleteAttachmentAction(attachmentId: string) {
  const attachment = await prisma.cardAttachment.findUniqueOrThrow({
    where: { id: attachmentId },
    include: { card: true },
  });
  await assertClientAccess(attachment.card.clientId);
  await prisma.cardAttachment.delete({ where: { id: attachmentId } });
  await prisma.file.delete({ where: { id: attachment.fileId } }).catch(() => {});
  revalidatePath(`/clientes/${attachment.card.clientId}/producao`);
}

export async function createPillarAction(clientId: string, formData: FormData) {
  await assertClientAccess(clientId);
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do pilar.");
  const color = (formData.get("color") as string) || null;

  await prisma.contentPillar.create({ data: { clientId, name, color } });
  revalidatePath(`/clientes/${clientId}/producao`);
  revalidatePath(`/clientes/${clientId}/configuracoes`);
}

export async function deletePillarAction(pillarId: string) {
  const pillar = await prisma.contentPillar.findUniqueOrThrow({ where: { id: pillarId } });
  await assertClientAccess(pillar.clientId);
  await prisma.contentPillar.delete({ where: { id: pillarId } });
  revalidatePath(`/clientes/${pillar.clientId}/producao`);
  revalidatePath(`/clientes/${pillar.clientId}/configuracoes`);
}
