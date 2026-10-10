"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { assertUser } from "@/lib/authz";

export async function updateProfileAction(formData: FormData) {
  const user = await assertUser();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe seu nome.");

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/perfil");
}

export async function changePasswordAction(formData: FormData) {
  const user = await assertUser();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem.");

  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) throw new Error("Senha atual incorreta.");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}
