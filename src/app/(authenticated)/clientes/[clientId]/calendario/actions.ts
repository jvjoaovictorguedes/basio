"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertClientAccess } from "@/lib/authz";

export async function rescheduleCardAction(cardId: string, newDateIso: string) {
  const card = await prisma.contentCard.findUniqueOrThrow({ where: { id: cardId } });
  await assertClientAccess(card.clientId);

  const newDate = new Date(newDateIso);
  if (card.scheduledAt) {
    const prev = new Date(card.scheduledAt);
    newDate.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
  } else {
    newDate.setHours(12, 0, 0, 0);
  }

  await prisma.contentCard.update({
    where: { id: cardId },
    data: { scheduledAt: newDate },
  });

  revalidatePath(`/clientes/${card.clientId}/calendario`);
  revalidatePath(`/clientes/${card.clientId}/producao`);
}
