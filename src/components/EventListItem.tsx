import { motion } from "framer-motion";
import { EventWithResponses } from "@/hooks/useEvents";
import { formatEventDate, parseDateOnly } from "@/lib/format";
import { Clock, MapPin, Users } from "lucide-react";

interface EventListItemProps {
  event: EventWithResponses;
  index: number;
}

export function EventListItem({ event, index }: EventListItemProps) {
  const confirmed = event.responses.filter((r) => r.status === "sim");
  const pricePerPlayer = confirmed.length > 0
    ? Math.ceil(event.total_price / confirmed.length)
    : event.total_price;

  return (
    <motion.div
      className="bg-card rounded-card p-5 card-shadow hover:card-shadow-hover transition-default cursor-pointer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", duration: 0.4, bounce: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-label text-muted-foreground">
          {event.type === "treino" ? "Treino" : "Amistoso"}
        </span>
        <span className="text-sm font-semibold text-accent">
          {confirmed.length}/{event.max_players}
        </span>
      </div>
      <h3 className="font-bold text-lg text-foreground mb-2">
        {formatEventDate(parseDateOnly(event.date))}
      </h3>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{event.time}h</span>
        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{event.location}</span>
        {event.total_price > 0 && (
          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />R${pricePerPlayer}/p</span>
        )}
      </div>
    </motion.div>
  );
}
