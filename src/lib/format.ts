import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatEventDate(date: Date): string {
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "EEEE, d 'de' MMM", { locale: ptBR });
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getEventStatus(date: string, time: string): "upcoming" | "in-progress" | "finished" {
  const now = new Date();
  const eventStart = new Date(`${date}T${time}`);
  const eventEnd = new Date(`${date}T23:59:59`);

  if (now < eventStart) return "upcoming";
  if (now >= eventStart && now <= eventEnd) return "in-progress";
  return "finished";
}

export function getEventStatusLabel(status: "upcoming" | "in-progress" | "finished"): string {
  switch (status) {
    case "upcoming": return "Agendado";
    case "in-progress": return "Em andamento";
    case "finished": return "Finalizado";
  }
}
