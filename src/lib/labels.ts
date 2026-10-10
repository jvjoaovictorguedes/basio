export const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const PRIORITY_OPTIONS = ["BAIXA", "MEDIA", "ALTA"];

export const PRIORITY_COLORS: Record<string, string> = {
  BAIXA: "#5e6c84",
  MEDIA: "#ff8b00",
  ALTA: "#c9372c",
};

export const STRATEGY_LABELS: Record<string, string> = {
  POSICIONAMENTO: "Posicionamento",
  PERSONA: "Persona",
  TOM_DE_VOZ: "Tom de voz",
  PILARES: "Pilares de conteúdo",
};

export type Semaphore = "EM_DIA" | "ATENCAO" | "ATRASADO";

export const SEMAPHORE_LABELS: Record<Semaphore, string> = {
  EM_DIA: "Em dia",
  ATENCAO: "Atenção",
  ATRASADO: "Atrasado",
};

export const SEMAPHORE_COLORS: Record<Semaphore, string> = {
  EM_DIA: "#36b37e",
  ATENCAO: "#ff8b00",
  ATRASADO: "#c9372c",
};
