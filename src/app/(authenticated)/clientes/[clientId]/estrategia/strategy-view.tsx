"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { STRATEGY_LABELS } from "@/lib/labels";
import type { StrategyKey } from "@/generated/prisma/client";
import { updateStrategyPageAction } from "./actions";

type StrategyPageData = { key: StrategyKey; content: string };

export function StrategyView({
  clientId,
  pages,
}: {
  clientId: string;
  pages: StrategyPageData[];
}) {
  const [activeKey, setActiveKey] = useState<StrategyKey>(pages[0]?.key ?? "POSICIONAMENTO");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const activePage = pages.find((p) => p.key === activeKey);

  function handleSave(formData: FormData) {
    setSaved(false);
    startTransition(async () => {
      await updateStrategyPageAction(clientId, activeKey, formData);
      setSaved(true);
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <div className="mb-4 flex gap-1 border-b border-border">
        {pages.map((page) => (
          <button
            key={page.key}
            onClick={() => {
              setActiveKey(page.key);
              setSaved(false);
            }}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-medium",
              activeKey === page.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground",
            )}
          >
            {STRATEGY_LABELS[page.key]}
          </button>
        ))}
      </div>

      {activePage && (
        <form action={handleSave} key={activePage.key} className="space-y-3">
          <textarea
            name="content"
            defaultValue={activePage.content}
            rows={14}
            placeholder={`Escreva aqui sobre ${STRATEGY_LABELS[activePage.key].toLowerCase()}...`}
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
      )}
    </div>
  );
}
