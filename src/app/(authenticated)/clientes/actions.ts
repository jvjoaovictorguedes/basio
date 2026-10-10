"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertUser } from "@/lib/authz";
import { createClientWithDefaults } from "@/lib/client-defaults";
import { prisma } from "@/lib/prisma";

export async function createClientAction(formData: FormData) {
  const user = await assertUser();

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do cliente.");

  const client = await createClientWithDefaults({
    name,
    contactName: String(formData.get("contactName") || "").trim() || null,
    contactEmail: String(formData.get("contactEmail") || "").trim() || null,
    contactPhone: String(formData.get("contactPhone") || "").trim() || null,
    service: String(formData.get("service") || "").trim() || null,
    createdById: user.id,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}/estrategia`);
}

export async function archiveClientAction(clientId: string) {
  await assertUser();
  await prisma.client.update({ where: { id: clientId }, data: { status: "ARCHIVED" } });
  revalidatePath("/clientes");
}

export async function reactivateClientAction(clientId: string) {
  await assertUser();
  await prisma.client.update({ where: { id: clientId }, data: { status: "ACTIVE" } });
  revalidatePath("/clientes");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  await assertUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do cliente.");

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      contactName: String(formData.get("contactName") || "").trim() || null,
      contactEmail: String(formData.get("contactEmail") || "").trim() || null,
      contactPhone: String(formData.get("contactPhone") || "").trim() || null,
      service: String(formData.get("service") || "").trim() || null,
    },
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
}
