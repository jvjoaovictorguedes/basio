"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/authz";

export async function sendInviteAction(formData: FormData) {
  const admin = await assertAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim() || null;
  const clientIds = formData.getAll("clientIds").map(String);

  if (!email) throw new Error("Informe o e-mail.");
  if (clientIds.length === 0) throw new Error("Selecione pelo menos um cliente.");

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.role === "ADMIN") {
      throw new Error("Este e-mail já pertence à administradora.");
    }
    await prisma.clientCollaborator.createMany({
      data: clientIds.map((clientId) => ({ clientId, userId: existingUser.id })),
      skipDuplicates: true,
    });
    revalidatePath("/acessos");
    return;
  }

  const existingInvite = await prisma.invite.findFirst({
    where: { email, status: "PENDING" },
  });

  if (existingInvite) {
    const merged = Array.from(new Set([...existingInvite.clientIds, ...clientIds]));
    await prisma.invite.update({
      where: { id: existingInvite.id },
      data: { clientIds: merged, name: name ?? existingInvite.name },
    });
  } else {
    await prisma.invite.create({
      data: { email, name, clientIds, invitedById: admin.id },
    });
  }

  revalidatePath("/acessos");
}

export async function revokeInviteAction(inviteId: string) {
  await assertAdmin();
  await prisma.invite.update({ where: { id: inviteId }, data: { status: "REVOKED" } });
  revalidatePath("/acessos");
}

export async function removeAllAccessAction(userId: string) {
  await assertAdmin();
  await prisma.clientCollaborator.deleteMany({ where: { userId } });
  revalidatePath("/acessos");
}
