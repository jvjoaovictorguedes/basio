"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatDatePtBR } from "@/lib/dates";
import { createNoteAction, deleteNoteAction } from "./actions";

type NoteAttachment = { id: string; file: { id: string; filename: string } };
type Note = {
  id: string;
  title: string | null;
  content: string;
  noteDate: string | Date;
  attachments: NoteAttachment[];
};

function todayInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NotesView({
  clientId,
  initialNotes,
}: {
  clientId: string;
  initialNotes: Note[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createNoteAction(clientId, formData);
      router.refresh();
    });
    setShowForm(false);
  }

  function handleDelete(noteId: string) {
    if (!confirm("Excluir esta anotação?")) return;
    startTransition(async () => {
      await deleteNoteAction(noteId);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Anotações</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Nova anotação
        </button>
      </div>

      {showForm && (
        <form
          action={handleCreate}
          className="mb-4 space-y-3 rounded-lg border border-border bg-surface p-4"
        >
          <div className="flex gap-2">
            <input
              name="title"
              placeholder="Título (opcional)"
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              type="date"
              name="noteDate"
              defaultValue={todayInputValue()}
              className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <textarea
            name="content"
            required
            rows={4}
            autoFocus
            placeholder="O que foi discutido/observado..."
            className="w-full resize-y rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <input type="file" name="file" className="text-sm" />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Salvar
          </button>
        </form>
      )}

      <div className="space-y-3">
        {initialNotes.map((note) => (
          <div key={note.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {note.title || formatDatePtBR(new Date(note.noteDate))}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">{formatDatePtBR(new Date(note.noteDate))}</span>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-xs text-muted hover:text-danger"
                >
                  excluir
                </button>
              </div>
            </div>
            <p className="whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
            {note.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {note.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/files/${att.file.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-background px-2 py-1 text-xs text-primary hover:underline"
                  >
                    📎 {att.file.filename}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {initialNotes.length === 0 && (
          <p className="text-sm text-muted">Nenhuma anotação registrada ainda.</p>
        )}
      </div>
    </div>
  );
}
