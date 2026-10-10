"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  archiveClientAction,
  reactivateClientAction,
  renameClientAction,
} from "../../actions";
import { createPillarAction, deletePillarAction } from "../producao/actions";
import {
  addCollaboratorToClientAction,
  createContactAction,
  deleteContactAction,
  removeCollaboratorFromClientAction,
} from "./actions";

type Pillar = { id: string; name: string; color: string | null };
type Contact = { id: string; name: string; email: string };
type CollaboratorUser = { id: string; name: string; email: string };

const COLOR_OPTIONS = ["#3b6fd6", "#36b37e", "#ff8b00", "#c9372c", "#8777d9", "#00a3bf"];
const PILLAR_COLORS = ["#5e6c84", "#3b6fd6", "#36b37e", "#ff8b00", "#c9372c", "#8777d9"];

export function ConfiguracoesView({
  client,
  pillars,
  contacts,
  linkedCollaborators,
  allCollaborators,
  isAdmin,
}: {
  client: { id: string; name: string; color: string | null; status: string };
  pillars: Pillar[];
  contacts: Contact[];
  linkedCollaborators: CollaboratorUser[];
  allCollaborators: CollaboratorUser[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const availableCollaborators = allCollaborators.filter(
    (c) => !linkedCollaborators.some((l) => l.id === c.id),
  );

  function refresh() {
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-6">
      {isAdmin && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Dados do cliente</h2>
          <form
            action={(formData) =>
              startTransition(async () => {
                await renameClientAction(client.id, formData);
                refresh();
              })
            }
            className="space-y-3"
          >
            <input
              name="name"
              defaultValue={client.name}
              className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={client.color === color}
                    className="peer sr-only"
                  />
                  <span
                    className="block h-6 w-6 rounded-full ring-offset-2 peer-checked:ring-2 peer-checked:ring-foreground"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Salvar
            </button>
          </form>

          <div className="mt-3 border-t border-border pt-3">
            {client.status === "ACTIVE" ? (
              <button
                onClick={() =>
                  startTransition(async () => {
                    await archiveClientAction(client.id);
                    router.push("/clientes");
                  })
                }
                className="text-sm text-danger hover:underline"
              >
                Arquivar cliente
              </button>
            ) : (
              <button
                onClick={() =>
                  startTransition(async () => {
                    await reactivateClientAction(client.id);
                    refresh();
                  })
                }
                className="text-sm text-primary hover:underline"
              >
                Reativar cliente
              </button>
            )}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pilares de conteúdo</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {pillars.map((pillar) => (
            <span
              key={pillar.id}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-white"
              style={{ backgroundColor: pillar.color || "#5e6c84" }}
            >
              {pillar.name}
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deletePillarAction(pillar.id);
                    refresh();
                  })
                }
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </span>
          ))}
          {pillars.length === 0 && <p className="text-sm text-muted">Nenhum pilar ainda.</p>}
        </div>
        <form
          action={(formData) =>
            startTransition(async () => {
              await createPillarAction(client.id, formData);
              refresh();
            })
          }
          className="flex flex-wrap items-center gap-2"
        >
          <input
            name="name"
            required
            placeholder="Novo pilar"
            className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
          <select name="color" className="rounded-md border border-border px-2 py-1.5 text-sm">
            {PILLAR_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            Adicionar
          </button>
        </form>
      </section>

      {isAdmin && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Colaboradoras com acesso</h2>
          <ul className="mb-3 space-y-1">
            {linkedCollaborators.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <span>
                  {c.name} <span className="text-muted">· {c.email}</span>
                </span>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await removeCollaboratorFromClientAction(client.id, c.id);
                      refresh();
                    })
                  }
                  className="text-xs text-muted hover:text-danger"
                >
                  remover
                </button>
              </li>
            ))}
            {linkedCollaborators.length === 0 && (
              <p className="text-sm text-muted">Nenhuma colaboradora vinculada ainda.</p>
            )}
          </ul>
          {availableCollaborators.length > 0 && (
            <form
              action={(formData) =>
                startTransition(async () => {
                  await addCollaboratorToClientAction(client.id, String(formData.get("userId")));
                  refresh();
                })
              }
              className="flex gap-2"
            >
              <select name="userId" className="flex-1 rounded-md border border-border px-2 py-1.5 text-sm">
                {availableCollaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
              >
                Adicionar
              </button>
            </form>
          )}
          <p className="mt-2 text-xs text-muted">
            Para convidar uma nova colaboradora por e-mail, use a{" "}
            <a href="/acessos" className="text-primary hover:underline">
              Gestão de acessos
            </a>
            .
          </p>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Contatos do cliente</h2>
          <ul className="mb-3 space-y-1">
            {contacts.map((contact) => (
              <li
                key={contact.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm"
              >
                <span>
                  {contact.name} <span className="text-muted">· {contact.email}</span>
                </span>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteContactAction(contact.id);
                      refresh();
                    })
                  }
                  className="text-xs text-muted hover:text-danger"
                >
                  remover
                </button>
              </li>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-muted">Nenhum contato cadastrado ainda.</p>
            )}
          </ul>
          <form
            action={(formData) =>
              startTransition(async () => {
                await createContactAction(client.id, formData);
                refresh();
              })
            }
            className="flex flex-wrap gap-2"
          >
            <input
              name="name"
              required
              placeholder="Nome"
              className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="E-mail"
              className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
            >
              Adicionar
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
