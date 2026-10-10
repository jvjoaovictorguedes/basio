import { addDays, endOfDay, endOfWeek, startOfDay } from "date-fns";
import type { Semaphore } from "@/lib/labels";

export type DueBucket = "HOJE" | "SEMANA" | "DEPOIS";

export function bucketForDate(date: Date | null, now: Date = new Date()): DueBucket {
  if (!date) return "DEPOIS";
  const endToday = endOfDay(now);
  if (date <= endToday) return "HOJE";
  const endWeek = endOfWeek(now, { weekStartsOn: 1 });
  if (date <= endWeek) return "SEMANA";
  return "DEPOIS";
}

export function calculateSemaphore(dueDates: (Date | null)[], now: Date = new Date()): Semaphore {
  const today = startOfDay(now);
  const soonLimit = endOfDay(addDays(now, 3));

  let hasOverdue = false;
  let hasSoon = false;

  for (const date of dueDates) {
    if (!date) continue;
    if (date < today) hasOverdue = true;
    else if (date <= soonLimit) hasSoon = true;
  }

  if (hasOverdue) return "ATRASADO";
  if (hasSoon) return "ATENCAO";
  return "EM_DIA";
}

export function formatDatePtBR(date: Date | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("pt-BR");
}
