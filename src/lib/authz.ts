import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export class ForbiddenError extends Error {
  constructor(message = "Acesso não permitido.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

/** Usa em Server Components/Pages. Redireciona para /login se não houver sessão. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Usa em Server Components/Pages. Redireciona para / se o usuário não for admin. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Usa em Server Actions/Route Handlers: lança erro em vez de redirecionar. */
export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Você precisa estar autenticado.");
  return user;
}

export async function assertAdmin() {
  const user = await assertUser();
  if (user.role !== "ADMIN") {
    throw new ForbiddenError("Apenas a administradora pode fazer isso.");
  }
  return user;
}

/** IDs dos clientes que o usuário pode acessar. Admin: todos. Colaborador: só os vinculados. */
export async function getAccessibleClientIds(user: {
  id: string;
  role: "ADMIN" | "COLLABORATOR";
}): Promise<string[] | "ALL"> {
  if (user.role === "ADMIN") return "ALL";
  const links = await prisma.clientCollaborator.findMany({
    where: { userId: user.id },
    select: { clientId: true },
  });
  return links.map((l) => l.clientId);
}

/** Garante que o usuário logado pode acessar o cliente informado; lança ForbiddenError caso não. */
export async function assertClientAccess(clientId: string) {
  const user = await assertUser();
  if (user.role === "ADMIN") return user;

  const link = await prisma.clientCollaborator.findUnique({
    where: { clientId_userId: { clientId, userId: user.id } },
  });
  if (!link) {
    throw new ForbiddenError("Você não tem acesso a este cliente.");
  }
  return user;
}

/** Versão para Server Components/Pages: redireciona em vez de lançar erro. */
export async function requireClientAccess(clientId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") return user;

  const link = await prisma.clientCollaborator.findUnique({
    where: { clientId_userId: { clientId, userId: user.id } },
  });
  if (!link) redirect("/");
  return user;
}
