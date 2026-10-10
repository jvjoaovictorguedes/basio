"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { FORMAT_LABELS, FORMAT_OPTIONS, CHANNEL_LABELS, CHANNEL_OPTIONS } from "@/lib/labels";
import {
  addCommentAction,
  deleteAttachmentAction,
  deleteCardAction,
  getCardDetailAction,
  updateCardAction,
  uploadAttachmentAction,
} from "./actions";

type Pillar = { id: string; name: string; color: string | null };
type TeamMember = { id: string; name: string };

type CardDetail = NonNullable<Awaited<ReturnType<typeof getCardDetailAction>>>;

function toDateTimeInputValue(date: Date | string | null) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function CardDrawer({
  cardId,
  pillars,
  team,
  onClose,
}: {
  cardId: string;
  clientId: string;
  pillars: Pillar[];
  team: TeamMember[];
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const [isPending, startTransition] = useTransition();
  const [commentDraft, setCommentDraft] = useState("");

  const reload = useCallback(() => {
    getCardDetailAction(cardId).then((d) => setDetail(d));
  }, [cardId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function handleSave(formData: FormData) {
    startTransition(async () => {
      await updateCardAction(cardId, formData);
      reload();
    });
  }

  function handleDelete() {
    if (!confirm("Excluir este cartão de conteúdo?")) return;
    startTransition(async () => {
      await deleteCardAction(cardId);
      onClose();
    });
  }

  function handleAddComment() {
    if (!commentDraft.trim()) return;
    const formData = new FormData();
    formData.set("body", commentDraft);
    setCommentDraft("");
    startTransition(async () => {
      await addCommentAction(cardId, formData);
      reload();
    });
  }

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      await uploadAttachmentAction(cardId, formData);
      reload();
    });
  }

  function handleDeleteAttachment(attachmentId: string) {
    startTransition(async () => {
      await deleteAttachmentAction(attachmentId);
      reload();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl overflow-y-auto bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Cartão de conteúdo
          </h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            ✕
          </button>
        </div>

        {!detail ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : (
          <form action={handleSave} className="space-y-4">
            <div>
              <input
                name="title"
                defaultValue={detail.title}
                className="w-full rounded-md border border-border px-3 py-2 text-base font-medium outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Formato</label>
                <select
                  name="format"
                  defaultValue={detail.format}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {FORMAT_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Canal</label>
                <select
                  name="channel"
                  defaultValue={detail.channel}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                >
                  {CHANNEL_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {CHANNEL_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Pilar</label>
                <select
                  name="pillarId"
                  defaultValue={detail.pillarId ?? ""}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                >
                  <option value="">Sem pilar</option>
                  {pillars.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Responsável</label>
                <select
                  name="responsibleId"
                  defaultValue={detail.responsibleId ?? ""}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                >
                  <option value="">Ninguém</option>
                  {team.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-muted">
                  Data de publicação
                </label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  defaultValue={toDateTimeInputValue(detail.scheduledAt)}
                  className="w-full rounded-md border border-border px-2 py-1.5 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Roteiro</label>
              <textarea
                name="script"
                defaultValue={detail.script ?? ""}
                rows={3}
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Legenda</label>
              <textarea
                name="caption"
                defaultValue={detail.caption ?? ""}
                rows={3}
                className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name="visibleToClient"
                defaultChecked={detail.visibleToClient}
                className="h-4 w-4 rounded border-border"
              />
              Visível para o cliente
            </label>

            <div className="rounded-md border border-dashed border-border bg-background p-3">
              <label className="mb-1 block text-xs font-medium text-muted">
                Notas internas (nunca aparecem para o cliente)
              </label>
              <textarea
                name="internalNotes"
                defaultValue={detail.internalNotes ?? ""}
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-sm text-danger hover:underline"
              >
                Excluir cartão
              </button>
            </div>
          </form>
        )}

        {detail && (
          <>
            <section className="mt-6 border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Anexos</h3>
              <div className="space-y-1.5">
                {detail.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between rounded-md border border-border px-2 py-1.5 text-sm"
                  >
                    <a
                      href={`/api/files/${att.fileId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-primary hover:underline"
                    >
                      {att.file.filename}
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-xs text-muted hover:text-danger"
                    >
                      remover
                    </button>
                  </div>
                ))}
                {detail.attachments.length === 0 && (
                  <p className="text-sm text-muted">Nenhum anexo ainda.</p>
                )}
              </div>
              <form action={handleUpload} className="mt-2 flex items-center gap-2">
                <input type="file" name="file" required className="text-sm" />
                <button
                  type="submit"
                  className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-background"
                >
                  Enviar
                </button>
              </form>
            </section>

            <section className="mt-6 border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Histórico de aprovação
              </h3>
              <ul className="space-y-1 text-sm text-muted">
                {detail.stageHistory.map((h) => (
                  <li key={h.id}>
                    {h.fromStage ? `${h.fromStage.name} → ${h.toStage.name}` : `Criado em ${h.toStage.name}`}
                    {h.changedBy ? ` · ${h.changedBy.name}` : ""}
                    {" · "}
                    {new Date(h.createdAt).toLocaleString("pt-BR")}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 border-t border-border pt-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Comentários</h3>
              <div className="space-y-2">
                {detail.comments.map((c) => (
                  <div key={c.id} className="rounded-md bg-background p-2 text-sm">
                    <p className="font-medium text-foreground">{c.author?.name ?? "Usuário"}</p>
                    <p className="text-foreground">{c.body}</p>
                    <p className="text-[11px] text-muted">
                      {new Date(c.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
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
          </>
        )}
      </div>
    </div>
  );
}
