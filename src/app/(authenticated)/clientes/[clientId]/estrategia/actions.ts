"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";
import type { StrategyKey } from "@/generated/prisma/client";

export async function updateStrategyPageAction(
  clientId: string,
  key: StrategyKey,
  formData: FormData,
) {
  await assertUser();
  const content = String(formData.get("content") || "");

  await prisma.strategyPage.upsert({
    where: { clientId_key: { clientId, key } },
    update: { content },
    create: { clientId, key, content },
  });

  revalidatePath(`/clientes/${clientId}/estrategia`);
}
