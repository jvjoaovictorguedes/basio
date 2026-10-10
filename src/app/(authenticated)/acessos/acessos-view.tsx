"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeAllAccessAction, revokeInviteAction, sendInviteAction } from "./actions";

type ClientRef = { id: string; name: string };
type Collaborator = { id: string; name: string; email: string; clients: ClientRef[] };
type Invite = { id: string; email: string; name: string | null; clientIds: string[]; token: string };

export function AcessosView({
  clients,
  collaborators,
  invites,
}: {
  clients: ClientRef[];
  collaborators: Collaborator[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  function handleInvite(formData: FormData) {
    startTransition(async () => {
      await sendInviteAction(formData);
      router.refresh();
    });
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Gestão de acessos</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Convidar colaboradora
        </button>
      </div>

      {showForm && (
        <form
          action={handleInvite}
          className="mb-6 space-y-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              name="name"
              placeholder="Nome (opcional)"
              className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="E-mail"
              className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted">Dar acesso a quais clientes?</p>
            <div className="flex flex-wrap gap-3">
              {clients.map((client) => (
                <label key={client.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="clientIds" value={client.id} className="h-4 w-4" />
                  {client.name}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Enviar convite
          </button>
        </form>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Colaboradoras
        </h2>
        <div className="space-y-2">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {c.name} <span className="text-muted">· {c.email}</span>
                </p>
                <p className="text-xs text-muted">
                  {c.clients.length > 0
                    ? c.clients.map((cl) => cl.name).join(", ")
                    : "Sem clientes vinculados"}
                </p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await removeAllAccessAction(c.id);
                    router.refresh();
                  })
                }
                className="text-xs text-muted hover:text-danger"
              >
                remover todos os acessos
              </button>
            </div>
          ))}
          {collaborators.length === 0 && (
            <p className="text-sm text-muted">Nenhuma colaboradora cadastrada ainda.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
          Convites pendentes
        </h2>
        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{invite.email}</p>
                <p className="text-xs text-muted">
                  {invite.clientIds
                    .map((id) => clients.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p className="mt-1 truncate text-xs text-muted">
                  Link do convite:{" "}
                  <code className="rounded bg-background px-1 py-0.5">
                    /convite/{invite.token}
                  </code>
                </p>
              </div>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await revokeInviteAction(invite.id);
                    router.refresh();
                  })
                }
                className="text-xs text-muted hover:text-danger"
              >
                revogar
              </button>
            </div>
          ))}
          {invites.length === 0 && (
            <p className="text-sm text-muted">Nenhum convite pendente.</p>
          )}
        </div>
      </section>
    </div>
  );
}
