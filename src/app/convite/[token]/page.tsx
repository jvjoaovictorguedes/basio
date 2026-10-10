import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite || invite.status !== "PENDING") {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-foreground">Bem-vinda ao Basio Studio</h1>
        <p className="mb-6 text-sm text-muted">
          Você foi convidada com o e-mail <strong>{invite.email}</strong>. Defina seu nome e
          senha para criar sua conta.
        </p>
        <AcceptInviteForm token={token} />
      </div>
    </div>
  );
}
