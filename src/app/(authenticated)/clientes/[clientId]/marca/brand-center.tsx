"use client";

import { useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  createBrandPageAction,
  createSectionAction,
  deleteBrandPageAction,
  deleteSectionAction,
  renameBrandPageAction,
  updateSectionAction,
} from "./actions";

type Section = { id: string; heading: string; content: string; position: number };
type Page = { id: string; title: string; position: number; sections: Section[] };

export function BrandCenter({
  clientId,
  initialPages,
  isAdmin,
}: {
  clientId: string;
  initialPages: Page[];
  isAdmin: boolean;
}) {
  const [pages, setPages] = useState(initialPages);
  const [activeId, setActiveId] = useState(initialPages[0]?.id ?? null);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [, startTransition] = useTransition();
  const tempIdCounter = useRef(0);

  const activePage = pages.find((p) => p.id === activeId);

  function handleCreatePage() {
    if (!newPageTitle.trim()) return;
    const title = newPageTitle.trim();
    setNewPageTitle("");
    setAddingPage(false);
    startTransition(async () => {
      const id = await createBrandPageAction(clientId, title);
      setPages((prev) => [
        ...prev,
        { id, title, position: prev.length, sections: [{ id: `temp-${id}`, heading: title, content: "", position: 0 }] },
      ]);
      setActiveId(id);
    });
  }

  function handleRenamePage(pageId: string, title: string) {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, title } : p)));
    startTransition(async () => {
      await renameBrandPageAction(pageId, title);
    });
  }

  function handleDeletePage(pageId: string) {
    if (!confirm("Excluir esta página e todas as suas seções?")) return;
    startTransition(async () => {
      await deleteBrandPageAction(pageId);
    });
    setPages((prev) => prev.filter((p) => p.id !== pageId));
    if (activeId === pageId) setActiveId(pages[0]?.id ?? null);
  }

  function handleAddSection(pageId: string) {
    const heading = prompt("Título da nova seção:");
    if (!heading?.trim()) return;
    startTransition(async () => {
      await createSectionAction(pageId, heading.trim());
    });
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId
          ? {
              ...p,
              sections: [
                ...p.sections,
                {
                  id: `temp-${(tempIdCounter.current += 1)}`,
                  heading: heading.trim(),
                  content: "",
                  position: p.sections.length,
                },
              ],
            }
          : p,
      ),
    );
  }

  function handleDeleteSection(pageId: string, sectionId: string) {
    if (!confirm("Excluir esta seção?")) return;
    startTransition(async () => {
      await deleteSectionAction(sectionId);
    });
    setPages((prev) =>
      prev.map((p) =>
        p.id === pageId ? { ...p, sections: p.sections.filter((s) => s.id !== sectionId) } : p,
      ),
    );
  }

  function handleSaveSection(sectionId: string, formData: FormData) {
    startTransition(async () => {
      await updateSectionAction(sectionId, formData);
    });
  }

  return (
    <div className="flex h-full">
      <aside className="w-56 flex-none border-r border-border p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Páginas
          </span>
        </div>
        <ul className="space-y-0.5">
          {pages.map((page) => (
            <li key={page.id} className="group flex items-center gap-1">
              <button
                onClick={() => setActiveId(page.id)}
                className={clsx(
                  "flex-1 truncate rounded-md px-2 py-1.5 text-left text-sm",
                  activeId === page.id
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-foreground hover:bg-background",
                )}
              >
                {page.title}
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="hidden text-xs text-muted hover:text-danger group-hover:block"
                  title="Excluir página"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>

        {isAdmin && (
          <div className="mt-3">
            {addingPage ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreatePage()}
                  placeholder="Nome da página"
                  className="w-full rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary"
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingPage(true)}
                className="text-sm text-primary hover:underline"
              >
                + Nova página
              </button>
            )}
          </div>
        )}
      </aside>

      <section className="flex-1 overflow-y-auto p-6">
        {!activePage ? (
          <p className="text-sm text-muted">Nenhuma página ainda.</p>
        ) : (
          <div className="mx-auto max-w-2xl space-y-6">
            {isAdmin ? (
              <input
                defaultValue={activePage.title}
                onBlur={(e) => e.target.value.trim() && handleRenamePage(activePage.id, e.target.value.trim())}
                className="w-full rounded-md border border-transparent px-1 text-xl font-semibold text-foreground outline-none hover:border-border focus:border-primary"
              />
            ) : (
              <h1 className="text-xl font-semibold text-foreground">{activePage.title}</h1>
            )}

            {activePage.sections.map((section) => (
              <form
                key={section.id}
                action={(formData) => handleSaveSection(section.id, formData)}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <input
                    name="heading"
                    defaultValue={section.heading}
                    readOnly={!isAdmin}
                    className="flex-1 rounded-md border border-transparent px-1 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-primary"
                  />
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSection(activePage.id, section.id)}
                      className="text-xs text-muted hover:text-danger"
                    >
                      excluir
                    </button>
                  )}
                </div>
                <textarea
                  name="content"
                  defaultValue={section.content}
                  rows={6}
                  placeholder="Escreva aqui..."
                  className="w-full resize-y rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-md border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-background"
                >
                  Salvar
                </button>
              </form>
            ))}

            {isAdmin && (
              <button
                onClick={() => handleAddSection(activePage.id)}
                className="text-sm text-primary hover:underline"
              >
                + Nova seção
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
