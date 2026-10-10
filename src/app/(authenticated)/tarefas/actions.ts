"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";
import type { CardPriority } from "@/generated/prisma/client";

export async function createInternalTaskAction(formData: FormData) {
  const user = await assertUser();

  const title = String(formData.get("title") || "").trim();
  if (!title) throw new Error("Informe o título da tarefa.");

  const dueDateRaw = String(formData.get("dueDate") || "");
  const clientId = String(formData.get("clientId") || "") || null;

  const task = await prisma.internalTask.create({
    data: {
      title,
      description: (formData.get("description") as string) || null,
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      priority: (formData.get("priority") as CardPriority) || "MEDIA",
      clientId,
      createdById: user.id,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  revalidatePath("/tarefas");
  revalidatePath("/");
  return task;
}

export async function toggleTaskStatusAction(taskId: string, done: boolean) {
  await assertUser();
  await prisma.internalTask.update({
    where: { id: taskId },
    data: { status: done ? "CONCLUIDA" : "PENDENTE", completedAt: done ? new Date() : null },
  });
  revalidatePath("/tarefas");
  revalidatePath("/");
}

export async function deleteInternalTaskAction(taskId: string) {
  await assertUser();
  await prisma.internalTask.delete({ where: { id: taskId } });
  revalidatePath("/tarefas");
  revalidatePath("/");
}
