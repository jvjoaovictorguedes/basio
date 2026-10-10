"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createListItemAction,
  deleteListItemAction,
  deletePageAction,
  deletePageFileAction,
  movePageAction,
  renamePageAction,
  toggleListItemAction,
  updateTextContentAction,
  uploadPageFileAction,
} from "@/app/(authenticated)/paginas/actions";

type ListItem = { id: string; title: string; done: boolean };
type FileEntry = { id: string; file: { id: string; filename: string; sizeBytes: number } };

type PageData = {
  id: string;
  title: string;
  type: "TEXT" | "LIST" | "FOLDER";
  textContent: { content: string } | null;
  listItems: ListItem[];
  files: FileEntry[];
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CustomPageView({ page }: { page: PageData }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleRename(title: string) {
    if (!title.trim()) return;
    startTransition(async () => {
      await renamePageAction(page.id, title.trim());
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Excluir esta página? Essa ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await deletePageAction(page.id);
    });
  }

  function handleMove(direction: -1 | 1) {
    startTransition(async () => {
      await movePageAction(page.id, direction);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <div className="mb-4 flex items-center gap-2">
        <input
          defaultValue={page.title}
          onBlur={(e) => handleRename(e.target.value)}
          className="flex-1 rounded-md border border-transparent px-1 text-lg font-semibold text-foreground outline-none hover:border-border focus:border-primary"
        />
        <button
          onClick={() => handleMove(-1)}
          className="rounded px-2 py-1 text-sm text-muted hover:bg-surface"
          title="Mover para cima"
        >
          ↑
        </button>
        <button
          onClick={() => handleMove(1)}
          className="rounded px-2 py-1 text-sm text-muted hover:bg-surface"
          title="Mover para baixo"
        >
          ↓
        </button>
        <button onClick={handleDelete} className="text-sm text-danger hover:underline">
          Excluir
        </button>
      </div>

      {page.type === "TEXT" && <TextPageBody pageId={page.id} content={page.textContent?.content ?? ""} />}
      {page.type === "LIST" && <ListPageBody pageId={page.id} items={page.listItems} />}
      {page.type === "FOLDER" && <FolderPageBody pageId={page.id} files={page.files} />}
    </div>
  );
}

function TextPageBody({ pageId, content }: { pageId: string; content: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateTextContentAction(pageId, formData);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={handleSave} className="space-y-3">
      <textarea
        name="content"
        defaultValue={content}
        rows={16}
        className="w-full resize-y rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
      />
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
  );
}

function ListPageBody({ pageId, items }: { pageId: string; items: ListItem[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [, startTransition] = useTransition();

  function handleAdd() {
    if (!draft.trim()) return;
    const title = draft.trim();
    setDraft("");
    startTransition(async () => {
      await createListItemAction(pageId, title);
      router.refresh();
    });
  }

  function handleToggle(itemId: string, done: boolean) {
    startTransition(async () => {
      await toggleListItemAction(itemId, done);
      router.refresh();
    });
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      await deleteListItemAction(itemId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
        >
          <input
            type="checkbox"
            defaultChecked={item.done}
            onChange={(e) => handleToggle(item.id, e.target.checked)}
            className="h-4 w-4 flex-none"
          />
          <span className={item.done ? "flex-1 text-sm text-muted line-through" : "flex-1 text-sm text-foreground"}>
            {item.title}
          </span>
          <button onClick={() => handleDelete(item.id)} className="text-xs text-muted hover:text-danger">
            excluir
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Novo item"
          className="flex-1 rounded-md border border-border px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={handleAdd}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

function FolderPageBody({ pageId, files }: { pageId: string; files: FileEntry[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      await uploadPageFileAction(pageId, formData);
      router.refresh();
    });
  }

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deletePageFileAction(entryId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {files.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
        >
          <a
            href={`/api/files/${entry.file.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            📄 <span className="truncate">{entry.file.filename}</span>
            <span className="flex-none text-xs text-muted">{formatSize(entry.file.sizeBytes)}</span>
          </a>
          <button onClick={() => handleDelete(entry.id)} className="text-xs text-muted hover:text-danger">
            excluir
          </button>
        </div>
      ))}
      {files.length === 0 && <p className="text-sm text-muted">Nenhum arquivo ainda.</p>}

      <form action={handleUpload} className="flex items-center gap-2 pt-2">
        <input type="file" name="file" required className="text-sm" />
        <button
          type="submit"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-background"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
