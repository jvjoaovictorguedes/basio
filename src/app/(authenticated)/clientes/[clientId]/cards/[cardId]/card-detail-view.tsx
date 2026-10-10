"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PRIORITY_LABELS, PRIORITY_OPTIONS } from "@/lib/labels";
import { addCardCommentAction, moveCardStageAction, updateCardAction } from "./actions";

type Stage = { id: string; name: string };
type Comment = { id: string; authorName: string | null; body: string; createdAt: string | Date };
type StageHistoryEntry = {
  id: string;
  fromStage: { name: string } | null;
  toStage: { name: string };
  createdAt: string | Date;
};

type CardDetail = {
  id: string;
  title: string;
  format: string | null;
  channel: string | null;
  dueDate: string | Date | null;
  priority: string;
  script: string | null;
  caption: string | null;
  internalNotes: string | null;
  stageId: string;
  client: { id: string; name: string };
  comments: Comment[];
  stageHistory: StageHistoryEntry[];
};

function toDateInputValue(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CardDetailView({ card, stages }: { card: CardDetail; stages: Stage[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [commentDraft, setCommentDraft] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateCardAction(card.id, formData);
      setSaved(true);
      router.refresh();
    });
  }

  function handleStageChange(stageId: string) {
    startTransition(async () => {
      await moveCardStageAction(card.id, stageId);
      router.refresh();
    });
  }

  function handleAddComment() {
    if (!commentDraft.trim()) return;
    const formData = new FormData();
    formData.set("body", commentDraft);
    setCommentDraft("");
    startTransition(async () => {
      await addCardCommentAction(card.id, formData);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <Link
        href={`/clientes/${card.client.id}/estrategia`}
        className="mb-4 inline-block text-sm text-muted hover:text-primary"
      >
        ← {card.client.name}
      </Link>

      <form action={handleSave} className="space-y-4">
        <input
          name="title"
          defaultValue={card.title}
          className="w-full rounded-md border border-border px-3 py-2 text-lg font-medium outline-none focus:border-primary"
        />

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Etapa</label>
          <select
            defaultValue={card.stageId}
            onChange={(e) => handleStageChange(e.target.value)}
            className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Formato</label>
            <input
              name="format"
              defaultValue={card.format ?? ""}
              placeholder="Ex: Reels"
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Canal</label>
            <input
              name="channel"
              defaultValue={card.channel ?? ""}
              placeholder="Ex: Instagram"
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Prazo</label>
            <input
              type="date"
              name="dueDate"
              defaultValue={toDateInputValue(card.dueDate)}
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Prioridade</label>
            <select
              name="priority"
              defaultValue={card.priority}
              className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Roteiro</label>
          <textarea
            name="script"
            defaultValue={card.script ?? ""}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Legenda</label>
          <textarea
            name="caption"
            defaultValue={card.caption ?? ""}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="rounded-md border border-dashed border-border bg-background p-3">
          <label className="mb-1 block text-xs font-medium text-muted">Notas internas</label>
          <textarea
            name="internalNotes"
            defaultValue={card.internalNotes ?? ""}
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Salvar
          </button>
          {saved && <span className="text-sm text-muted">Salvo.</span>}
        </div>
      </form>

      {card.stageHistory.length > 0 && (
        <section className="mt-6 border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Histórico</h3>
          <ul className="space-y-1 text-sm text-muted">
            {card.stageHistory.map((h) => (
              <li key={h.id}>
                {h.fromStage ? `${h.fromStage.name} → ${h.toStage.name}` : `Criado em ${h.toStage.name}`}
                {" · "}
                {new Date(h.createdAt).toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 border-t border-border pt-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Comentários</h3>
        <div className="space-y-2">
          {card.comments.map((c) => (
            <div key={c.id} className="rounded-md bg-background p-2 text-sm">
              <p className="font-medium text-foreground">{c.authorName ?? "Jô"}</p>
              <p className="text-foreground">{c.body}</p>
              <p className="text-[11px] text-muted">{new Date(c.createdAt).toLocaleString("pt-BR")}</p>
            </div>
          ))}
          {card.comments.length === 0 && (
            <p className="text-sm text-muted">Nenhum comentário ainda.</p>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Escrever um comentário..."
            className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={handleAddComment}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
          >
            Enviar
          </button>
        </div>
      </section>
    </div>
  );
}
