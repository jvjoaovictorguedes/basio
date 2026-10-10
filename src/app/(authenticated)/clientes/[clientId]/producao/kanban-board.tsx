"use client";

import { useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FORMAT_LABELS, CHANNEL_LABELS } from "@/lib/labels";
import {
  createCardAction,
  createStageAction,
  deleteStageAction,
  moveCardAction,
  renameStageAction,
  reorderStagesAction,
} from "./actions";
import { CardDrawer } from "./card-drawer";

type Pillar = { id: string; name: string; color: string | null };
type TeamMember = { id: string; name: string };

type CardLite = {
  id: string;
  title: string;
  format: string;
  channel: string;
  scheduledAt: Date | null;
  position: number;
  pillar: Pillar | null;
  responsible: TeamMember | null;
};

type StageWithCards = {
  id: string;
  name: string;
  position: number;
  color: string | null;
  cards: CardLite[];
};

function computePosition(prev: number | null, next: number | null) {
  if (prev === null && next === null) return 0;
  if (prev === null) return (next as number) - 1;
  if (next === null) return prev + 1;
  return (prev + next) / 2;
}

export function KanbanBoard({
  clientId,
  initialStages,
  pillars,
  team,
  isAdmin,
}: {
  clientId: string;
  initialStages: StageWithCards[];
  pillars: Pillar[];
  team: TeamMember[];
  isAdmin: boolean;
}) {
  const [stages, setStages] = useState(initialStages);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [, startTransition] = useTransition();
  const tempIdCounter = useRef(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function findStageOf(cardId: string) {
    return stages.find((s) => s.cards.some((c) => c.id === cardId));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveCardId(String(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const sourceStage = findStageOf(activeId);
    if (!sourceStage) return;

    const destStage =
      stages.find((s) => s.id === overId) || findStageOf(overId) || sourceStage;

    if (sourceStage.id === destStage.id) return;

    setStages((prev) => {
      const next = prev.map((s) => ({ ...s, cards: [...s.cards] }));
      const src = next.find((s) => s.id === sourceStage.id)!;
      const dst = next.find((s) => s.id === destStage.id)!;
      const cardIndex = src.cards.findIndex((c) => c.id === activeId);
      if (cardIndex === -1) return prev;
      const [card] = src.cards.splice(cardIndex, 1);
      const overIndex = dst.cards.findIndex((c) => c.id === overId);
      dst.cards.splice(overIndex >= 0 ? overIndex : dst.cards.length, 0, card);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const destStage = stages.find((s) => s.id === overId) || findStageOf(overId);
    if (!destStage) return;

    const cardIndex = destStage.cards.findIndex((c) => c.id === activeId);
    if (cardIndex === -1) return;

    const prevCard = destStage.cards[cardIndex - 1];
    const nextCard = destStage.cards[cardIndex + 1];
    const newPosition = computePosition(prevCard?.position ?? null, nextCard?.position ?? null);

    setStages((prev) =>
      prev.map((s) =>
        s.id === destStage.id
          ? {
              ...s,
              cards: s.cards.map((c) => (c.id === activeId ? { ...c, position: newPosition } : c)),
            }
          : s,
      ),
    );

    startTransition(async () => {
      await moveCardAction(activeId, destStage.id, {
        prev: prevCard?.position ?? null,
        next: nextCard?.position ?? null,
      });
    });
  }

  function handleAddCard(stageId: string, title: string) {
    if (!title.trim()) return;
    tempIdCounter.current += 1;
    const tempId = `temp-${tempIdCounter.current}`;
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? {
              ...s,
              cards: [
                ...s.cards,
                {
                  id: tempId,
                  title,
                  format: "POST",
                  channel: "INSTAGRAM",
                  scheduledAt: null,
                  position: (s.cards.at(-1)?.position ?? -1) + 1,
                  pillar: null,
                  responsible: null,
                },
              ],
            }
          : s,
      ),
    );
    startTransition(async () => {
      const id = await createCardAction(clientId, stageId, title);
      setStages((prev) =>
        prev.map((s) =>
          s.id === stageId
            ? { ...s, cards: s.cards.map((c) => (c.id === tempId ? { ...c, id } : c)) }
            : s,
        ),
      );
    });
  }

  function handleAddStage() {
    if (!newStageName.trim()) return;
    const name = newStageName.trim();
    setNewStageName("");
    startTransition(async () => {
      await createStageAction(clientId, name);
    });
  }

  function handleRenameStage(stageId: string, name: string) {
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, name } : s)));
    startTransition(async () => {
      await renameStageAction(stageId, name);
    });
  }

  function handleDeleteStage(stageId: string) {
    if (!confirm("Excluir esta etapa? Só é possível se ela não tiver cartões.")) return;
    startTransition(async () => {
      try {
        await deleteStageAction(stageId);
        setStages((prev) => prev.filter((s) => s.id !== stageId));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Não foi possível excluir a etapa.");
      }
    });
  }

  function moveStage(stageId: string, direction: -1 | 1) {
    const index = stages.findIndex((s) => s.id === stageId);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= stages.length) return;

    const next = [...stages];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setStages(next);
    startTransition(async () => {
      await reorderStagesAction(clientId, next.map((s) => s.id));
    });
  }

  const activeCard = activeCardId
    ? stages.flatMap((s) => s.cards).find((c) => c.id === activeCardId)
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full items-start gap-3">
            {stages.map((stage, index) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                isAdmin={isAdmin}
                isFirst={index === 0}
                isLast={index === stages.length - 1}
                onAddCard={(title) => handleAddCard(stage.id, title)}
                onRename={(name) => handleRenameStage(stage.id, name)}
                onDelete={() => handleDeleteStage(stage.id)}
                onMove={(dir) => moveStage(stage.id, dir)}
                onOpenCard={(cardId) => setOpenCardId(cardId)}
              />
            ))}

            {isAdmin && (
              <div className="w-64 flex-none">
                <div className="rounded-lg border border-dashed border-border bg-surface/60 p-2">
                  <input
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                    placeholder="+ Adicionar etapa"
                    className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm outline-none focus:border-border"
                  />
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeCard && <CardPreview card={activeCard} />}
          </DragOverlay>
        </DndContext>
      </div>

      {openCardId && (
        <CardDrawer
          cardId={openCardId}
          clientId={clientId}
          pillars={pillars}
          team={team}
          onClose={() => setOpenCardId(null)}
        />
      )}
    </div>
  );
}

function StageColumn({
  stage,
  isAdmin,
  isFirst,
  isLast,
  onAddCard,
  onRename,
  onDelete,
  onMove,
  onOpenCard,
}: {
  stage: StageWithCards;
  isAdmin: boolean;
  isFirst: boolean;
  isLast: boolean;
  onAddCard: (title: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onOpenCard: (cardId: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const { setNodeRef } = useDroppable({ id: stage.id, data: { type: "stage" } });

  return (
    <div ref={setNodeRef} className="flex h-full w-72 flex-none flex-col rounded-lg bg-surface">
      <div className="flex items-center justify-between gap-1 px-3 py-2">
        {isAdmin ? (
          <input
            defaultValue={stage.name}
            onBlur={(e) => e.target.value.trim() && onRename(e.target.value.trim())}
            className="min-w-0 flex-1 truncate rounded px-1 py-0.5 text-sm font-semibold text-foreground outline-none hover:bg-background focus:bg-background"
          />
        ) : (
          <span className="truncate text-sm font-semibold text-foreground">{stage.name}</span>
        )}
        <span className="flex-none text-xs text-muted">{stage.cards.length}</span>
        {isAdmin && (
          <div className="flex flex-none items-center gap-0.5">
            <button
              disabled={isFirst}
              onClick={() => onMove(-1)}
              className="rounded px-1 text-xs text-muted hover:bg-background disabled:opacity-30"
              title="Mover para a esquerda"
            >
              ←
            </button>
            <button
              disabled={isLast}
              onClick={() => onMove(1)}
              className="rounded px-1 text-xs text-muted hover:bg-background disabled:opacity-30"
              title="Mover para a direita"
            >
              →
            </button>
            <button
              onClick={onDelete}
              className="rounded px-1 text-xs text-muted hover:bg-background"
              title="Excluir etapa"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        <SortableContext
          items={stage.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {stage.cards.map((card) => (
            <KanbanCard key={card.id} card={card} onOpen={() => onOpenCard(card.id)} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2">
        {adding ? (
          <div className="rounded-md border border-border bg-background p-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onAddCard(draft);
                  setDraft("");
                }
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="Título do cartão"
              className="w-full resize-none bg-transparent text-sm outline-none"
              rows={2}
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => {
                  onAddCard(draft);
                  setDraft("");
                }}
                className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-white hover:bg-primary-hover"
              >
                Adicionar
              </button>
              <button
                onClick={() => setAdding(false)}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-background"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted hover:bg-background"
          >
            + Adicionar cartão
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ card, onOpen }: { card: CardLite; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className="cursor-pointer rounded-md border border-border bg-white p-2.5 shadow-sm hover:shadow-md"
    >
      <p className="text-sm font-medium text-foreground">{card.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted">
          {FORMAT_LABELS[card.format] ?? card.format}
        </span>
        <span className="rounded bg-background px-1.5 py-0.5 text-[11px] text-muted">
          {CHANNEL_LABELS[card.channel] ?? card.channel}
        </span>
        {card.pillar && (
          <span
            className="rounded px-1.5 py-0.5 text-[11px] text-white"
            style={{ backgroundColor: card.pillar.color || "#5e6c84" }}
          >
            {card.pillar.name}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
        <span>
          {card.scheduledAt
            ? new Date(card.scheduledAt).toLocaleDateString("pt-BR")
            : "Sem data"}
        </span>
        {card.responsible && <span className="truncate">{card.responsible.name}</span>}
      </div>
    </div>
  );
}

function CardPreview({ card }: { card: CardLite }) {
  return (
    <div className="w-64 rounded-md border border-border bg-white p-2.5 shadow-lg">
      <p className="text-sm font-medium text-foreground">{card.title}</p>
    </div>
  );
}
