"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function acceptInviteAction(token: string, formData: FormData) {
  const invite = await prisma.invite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING") {
    throw new Error("Convite inválido ou já utilizado.");
  }

  const name = String(formData.get("name") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name) throw new Error("Informe seu nome.");
  if (password.length < 6) throw new Error("A senha deve ter pelo menos 6 caracteres.");
  if (password !== confirmPassword) throw new Error("As senhas não coincidem.");

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) throw new Error("Já existe uma conta com este e-mail.");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { name, email: invite.email, passwordHash, role: "COLLABORATOR" },
    });

    await tx.clientCollaborator.createMany({
      data: invite.clientIds.map((clientId) => ({ clientId, userId: user.id })),
      skipDuplicates: true,
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
  });

  redirect("/login?convite=aceito");
}
