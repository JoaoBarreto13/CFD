import { motion } from "framer-motion";
import { EventWithResponses } from "@/hooks/useEvents";
import { formatEventDate, getInitials, getEventStatus, getEventStatusLabel, parseDateOnly } from "@/lib/format";
import { MapPin, Clock, Play, CircleCheck } from "lucide-react";
import { RsvpSegment } from "./RsvpSegment";

interface NextEventCardProps {
  event: EventWithResponses;
}

export function NextEventCard({ event }: NextEventCardProps) {
  const confirmed = event.responses.filter((r) => r.status === "sim");
  const status = getEventStatus(event.date, event.time);

  return (
    <motion.div
      className="bg-card rounded-card p-6 card-shadow-elevated"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.4, bounce: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-label text-muted-foreground">
          {event.type === "treino" ? "Próximo Treino" : "Próximo Amistoso"}
        </span>
        <span className={`text-label flex items-center gap-1 ${
          status === "in-progress" ? "text-accent" : status === "finished" ? "text-muted-foreground" : "text-accent"
        }`}>
          {status === "in-progress" && <Play className="w-3 h-3" />}
          {status === "finished" && <CircleCheck className="w-3 h-3" />}
          {status === "upcoming" ? `${confirmed.length}/${event.max_players} Confirmados` : getEventStatusLabel(status)}
        </span>
      </div>

      <h2 className="heading-display text-3xl mb-4 text-foreground">
        {formatEventDate(parseDateOnly(event.date))}
      </h2>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-medium">{event.time}h</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{event.location}</span>
        </div>
      </div>

      {confirmed.length > 0 && (
        <div className="flex items-center gap-1 mb-6">
          {confirmed.slice(0, 8).map((r, i) => (
            <div
              key={r.id}
              className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-xs font-bold text-muted-foreground border-2 border-card"
              style={{ marginLeft: i > 0 ? "-6px" : 0, zIndex: 10 - i }}
              title={r.guest_name || "Membro"}
            >
              {getInitials(r.guest_name || "U")}
            </div>
          ))}
          {confirmed.length > 8 && (
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-xs font-bold text-card border-2 border-card" style={{ marginLeft: "-6px" }}>
              +{confirmed.length - 8}
            </div>
          )}
        </div>
      )}

      {status === "upcoming" && <RsvpSegment eventId={event.id} />}
      {status === "in-progress" && (
        <div className="bg-accent/10 rounded-inner p-3 text-center">
          <p className="text-sm font-semibold text-accent">🏐 Em andamento!</p>
        </div>
      )}
    </motion.div>
  );
}
