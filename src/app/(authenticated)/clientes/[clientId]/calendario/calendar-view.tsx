"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import clsx from "clsx";
import { CHANNEL_LABELS, FORMAT_LABELS } from "@/lib/labels";
import { rescheduleCardAction } from "./actions";
import { CardDrawer } from "../producao/card-drawer";

type Pillar = { id: string; name: string; color: string | null };
type TeamMember = { id: string; name: string };

type CardLite = {
  id: string;
  title: string;
  format: string;
  channel: string;
  scheduledAt: Date | string | null;
  pillar: Pillar | null;
  responsible: TeamMember | null;
  stage: { id: string; name: string };
};

export function CalendarView({
  clientId,
  initialCards,
  pillars,
  team,
}: {
  clientId: string;
  initialCards: CardLite[];
  pillars: Pillar[];
  team: TeamMember[];
}) {
  const [cards, setCards] = useState(initialCards);
  const [mode, setMode] = useState<"month" | "week">("month");
  const [refDate, setRefDate] = useState(new Date());
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const days = useMemo(() => {
    if (mode === "week") {
      const start = startOfWeek(refDate, { weekStartsOn: 1 });
      const end = endOfWeek(refDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
    const start = startOfWeek(startOfMonth(refDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(refDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [mode, refDate]);

  const cardsByDay = useMemo(() => {
    const map = new Map<string, CardLite[]>();
    for (const card of cards) {
      if (!card.scheduledAt) continue;
      const key = format(new Date(card.scheduledAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), card]);
    }
    return map;
  }, [cards]);

  function goPrev() {
    setRefDate((d) => (mode === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  }
  function goNext() {
    setRefDate((d) => (mode === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const cardId = String(active.id);
    const dayKey = String(over.id);

    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              scheduledAt: new Date(`${dayKey}T${format(new Date(c.scheduledAt!), "HH:mm:ss")}`),
            }
          : c,
      ),
    );

    startTransition(async () => {
      await rescheduleCardAction(cardId, dayKey);
    });
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goPrev}
            className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface"
          >
            ‹
          </button>
          <span className="min-w-36 text-center text-sm font-medium text-foreground capitalize">
            {mode === "month"
              ? format(refDate, "MMMM yyyy", { locale: ptBR })
              : `Semana de ${format(startOfWeek(refDate, { weekStartsOn: 1 }), "dd/MM", { locale: ptBR })}`}
          </span>
          <button
            onClick={goNext}
            className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface"
          >
            ›
          </button>
          <button
            onClick={() => setRefDate(new Date())}
            className="ml-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface"
          >
            Hoje
          </button>
        </div>

        <div className="flex gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={() => setMode("month")}
            className={clsx(
              "rounded px-2 py-1 text-xs font-medium",
              mode === "month" ? "bg-primary text-white" : "text-muted",
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setMode("week")}
            className={clsx(
              "rounded px-2 py-1 text-xs font-medium",
              mode === "week" ? "bg-primary text-white" : "text-muted",
            )}
          >
            Semanal
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-1.5 text-xs font-medium text-muted">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
            <div key={d} className="px-1">
              {d}
            </div>
          ))}
        </div>
        <div
          className={clsx(
            "mt-1 grid flex-1 grid-cols-7 gap-1.5 overflow-y-auto",
            mode === "month" && "auto-rows-fr",
          )}
        >
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              isCurrentMonth={mode === "week" || isSameMonth(day, refDate)}
              cards={cardsByDay.get(format(day, "yyyy-MM-dd")) ?? []}
              onOpenCard={setOpenCardId}
            />
          ))}
        </div>
      </DndContext>

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

function DayCell({
  day,
  isCurrentMonth,
  cards,
  onOpenCard,
}: {
  day: Date;
  isCurrentMonth: boolean;
  cards: CardLite[];
  onOpenCard: (id: string) => void;
}) {
  const dayKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: dayKey });
  const today = isSameDay(day, new Date());

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "min-h-24 rounded-md border p-1.5",
        isOver ? "border-primary bg-primary/5" : "border-border bg-surface",
        !isCurrentMonth && "opacity-40",
      )}
    >
      <div
        className={clsx(
          "mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
          today ? "bg-primary text-white" : "text-muted",
        )}
      >
        {format(day, "d")}
      </div>
      <div className="space-y-1">
        {cards.map((card) => (
          <DraggableCardChip key={card.id} card={card} onOpen={() => onOpenCard(card.id)} />
        ))}
      </div>
    </div>
  );
}

function DraggableCardChip({ card, onOpen }: { card: CardLite; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style = {
    ...(transform
      ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
      : {}),
    backgroundColor: card.pillar?.color ? `${card.pillar.color}22` : "var(--background)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className={clsx(
        "cursor-pointer truncate rounded px-1.5 py-1 text-[11px] shadow-sm",
        isDragging ? "opacity-50" : "",
      )}
      title={`${card.title} · ${FORMAT_LABELS[card.format]} · ${CHANNEL_LABELS[card.channel]}`}
    >
      <span className="font-medium text-foreground">{card.title}</span>
    </div>
  );
}
