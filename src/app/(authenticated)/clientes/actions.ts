"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/authz";
import { createClientWithDefaults } from "@/lib/client-defaults";
import { prisma } from "@/lib/prisma";

export async function createClientAction(formData: FormData) {
  const user = await assertAdmin();

  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "").trim() || null;

  if (!name) {
    throw new Error("Informe o nome do cliente.");
  }

  const client = await createClientWithDefaults({
    name,
    color,
    createdById: user.id,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}/producao`);
}

export async function archiveClientAction(clientId: string) {
  await assertAdmin();
  await prisma.client.update({
    where: { id: clientId },
    data: { status: "ARCHIVED" },
  });
  revalidatePath("/clientes");
}

export async function reactivateClientAction(clientId: string) {
  await assertAdmin();
  await prisma.client.update({
    where: { id: clientId },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/clientes");
}

export async function renameClientAction(clientId: string, formData: FormData) {
  await assertAdmin();
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "").trim() || null;
  if (!name) throw new Error("Informe o nome do cliente.");

  await prisma.client.update({
    where: { id: clientId },
    data: { name, color },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}
