"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/authz";

export async function addCollaboratorToClientAction(clientId: string, userId: string) {
  await assertAdmin();
  await prisma.clientCollaborator.upsert({
    where: { clientId_userId: { clientId, userId } },
    update: {},
    create: { clientId, userId },
  });
  revalidatePath(`/clientes/${clientId}/configuracoes`);
}

export async function removeCollaboratorFromClientAction(clientId: string, userId: string) {
  await assertAdmin();
  await prisma.clientCollaborator
    .delete({ where: { clientId_userId: { clientId, userId } } })
    .catch(() => {});
  revalidatePath(`/clientes/${clientId}/configuracoes`);
}

export async function createContactAction(clientId: string, formData: FormData) {
  await assertAdmin();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!name || !email) throw new Error("Informe nome e e-mail do contato.");

  await prisma.clientContact.create({ data: { clientId, name, email } });
  revalidatePath(`/clientes/${clientId}/configuracoes`);
}

export async function deleteContactAction(contactId: string) {
  const contact = await prisma.clientContact.findUniqueOrThrow({ where: { id: contactId } });
  await assertAdmin();
  await prisma.clientContact.delete({ where: { id: contactId } });
  revalidatePath(`/clientes/${contact.clientId}/configuracoes`);
}
