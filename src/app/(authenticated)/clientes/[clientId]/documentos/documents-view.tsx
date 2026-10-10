"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createFolderAction,
  deleteDocumentAction,
  deleteFolderAction,
  uploadDocumentAction,
} from "./actions";

type Folder = { id: string; name: string; parentFolderId: string | null };
type Document = {
  id: string;
  name: string;
  folderId: string | null;
  file: { id: string; mimeType: string; sizeBytes: number };
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsView({
  clientId,
  folders,
  documents,
}: {
  clientId: string;
  folders: Folder[];
  documents: Document[];
}) {
  const router = useRouter();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const breadcrumb = useMemo(() => {
    const trail: Folder[] = [];
    let cursor = folders.find((f) => f.id === currentFolderId) ?? null;
    while (cursor) {
      trail.unshift(cursor);
      cursor = folders.find((f) => f.id === cursor!.parentFolderId) ?? null;
    }
    return trail;
  }, [folders, currentFolderId]);

  const childFolders = folders.filter((f) => f.parentFolderId === currentFolderId);
  const childDocuments = documents.filter((d) => d.folderId === currentFolderId);

  function handleCreateFolder() {
    const name = prompt("Nome da pasta:");
    if (!name?.trim()) return;
    startTransition(async () => {
      await createFolderAction(clientId, currentFolderId, name.trim());
      router.refresh();
    });
  }

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      await uploadDocumentAction(clientId, currentFolderId, formData);
      router.refresh();
    });
  }

  function handleDeleteFolder(folderId: string) {
    if (!confirm("Excluir esta pasta e tudo dentro dela?")) return;
    startTransition(async () => {
      await deleteFolderAction(folderId);
      router.refresh();
    });
  }

  function handleDeleteDocument(documentId: string) {
    if (!confirm("Excluir este arquivo?")) return;
    startTransition(async () => {
      await deleteDocumentAction(documentId);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-sm text-muted">
          <button onClick={() => setCurrentFolderId(null)} className="hover:text-primary">
            Documentos
          </button>
          {breadcrumb.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <span>/</span>
              <button onClick={() => setCurrentFolderId(f.id)} className="hover:text-primary">
                {f.name}
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCreateFolder}
            disabled={isPending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            + Nova pasta
          </button>
          <form action={handleUpload} className="flex items-center gap-1">
            <input type="file" name="file" required className="max-w-40 text-xs" />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-1">
        {childFolders.map((folder) => (
          <div
            key={folder.id}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
          >
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              📁 {folder.name}
            </button>
            <button
              onClick={() => handleDeleteFolder(folder.id)}
              className="text-xs text-muted hover:text-danger"
            >
              excluir
            </button>
          </div>
        ))}

        {childDocuments.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2"
          >
            <a
              href={`/api/files/${doc.file.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
            >
              📄 <span className="truncate">{doc.name}</span>
              <span className="flex-none text-xs text-muted">{formatSize(doc.file.sizeBytes)}</span>
            </a>
            <button
              onClick={() => handleDeleteDocument(doc.id)}
              className="text-xs text-muted hover:text-danger"
            >
              excluir
            </button>
          </div>
        ))}

        {childFolders.length === 0 && childDocuments.length === 0 && (
          <p className="text-sm text-muted">Nenhum arquivo nesta pasta ainda.</p>
        )}
      </div>
    </div>
  );
}
