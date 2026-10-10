import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

/** Usa em Server Actions/Route Handlers: lança erro em vez de redirecionar. */
export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError("Você precisa estar autenticada.");
  return user;
}
