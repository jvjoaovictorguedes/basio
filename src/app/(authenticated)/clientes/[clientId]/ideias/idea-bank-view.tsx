"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { convertIdeaToCardAction, createIdeaAction, deleteIdeaAction } from "./actions";

type Pillar = { id: string; name: string; color: string | null };
type Idea = {
  id: string;
  title: string;
  description: string | null;
  format: string | null;
  status: string;
  source: string;
  pillar: Pillar | null;
};

export function IdeaBankView({
  clientId,
  initialIdeas,
  pillars,
}: {
  clientId: string;
  initialIdeas: Idea[];
  pillars: Pillar[];
}) {
  const router = useRouter();
  const [ideas, setIdeas] = useState(initialIdeas);
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const idea = await createIdeaAction(clientId, formData);
      setIdeas((prev) => [idea, ...prev]);
      router.refresh();
    });
    setShowForm(false);
  }

  function handleDelete(ideaId: string) {
    if (!confirm("Excluir esta ideia?")) return;
    setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
    startTransition(async () => {
      await deleteIdeaAction(ideaId);
    });
  }

  function handleConvert(ideaId: string) {
    startTransition(async () => {
      await convertIdeaToCardAction(ideaId);
      router.refresh();
    });
    setIdeas((prev) =>
      prev.map((i) => (i.id === ideaId ? { ...i, status: "CONVERTED" } : i)),
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Banco de ideias</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Nova ideia
        </button>
      </div>

      {showForm && (
        <form
          action={handleCreate}
          className="mb-4 space-y-3 rounded-lg border border-border bg-surface p-4"
        >
          <input
            name="title"
            required
            autoFocus
            placeholder="Título da ideia"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Descrição (opcional)"
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="format"
              placeholder="Formato (ex: Reels, Carrossel)"
              className="rounded-md border border-border px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
            <select name="pillarId" defaultValue="" className="rounded-md border border-border px-2 py-1.5 text-sm">
              <option value="">Pilar</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Salvar ideia
          </button>
        </form>
      )}

      <div className="space-y-2">
        {ideas.map((idea) => (
          <div
            key={idea.id}
            className={clsx(
              "rounded-lg border border-border bg-surface p-3",
              idea.status === "CONVERTED" && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{idea.title}</p>
                  {idea.source === "CLIENT_REQUEST" && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      Pedido do cliente
                    </span>
                  )}
                </div>
                {idea.description && (
                  <p className="mt-0.5 text-sm text-muted">{idea.description}</p>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {idea.format && (
                    <span className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted">
                      {idea.format}
                    </span>
                  )}
                  {idea.pillar && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[11px] text-white"
                      style={{ backgroundColor: idea.pillar.color || "#5e6c84" }}
                    >
                      {idea.pillar.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                {idea.status === "PENDING" ? (
                  <button
                    onClick={() => handleConvert(idea.id)}
                    className="whitespace-nowrap rounded-md border border-primary px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                  >
                    Enviar para produção
                  </button>
                ) : (
                  <span className="whitespace-nowrap text-xs text-muted">Já na produção</span>
                )}
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="text-xs text-muted hover:text-danger"
                >
                  excluir
                </button>
              </div>
            </div>
          </div>
        ))}
        {ideas.length === 0 && <p className="text-sm text-muted">Nenhuma ideia registrada ainda.</p>}
      </div>
    </div>
  );
}
