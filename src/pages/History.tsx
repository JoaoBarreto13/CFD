import { useEvents, type EventWithResponses } from "@/hooks/useEvents";
import { useNavigate } from "react-router-dom";
import { formatEventDate, getInitials } from "@/lib/format";
import { Clock, MapPin, Users, Check, HelpCircle, X } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const { data: events, isLoading } = useEvents();
  const navigate = useNavigate();

  const now = new Date();
  const past = (events || [])
    .filter((e) => new Date(e.date) < new Date(now.toDateString()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <img src="/ceifadora.jpeg" alt="Ceifadora" className="w-8 h-8 rounded-full object-cover" />
          <h1 className="heading-display text-2xl text-foreground">Histórico</h1>
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        )}

        {!isLoading && past.length === 0 && (
          <p className="text-muted-foreground text-center py-12">
            Nenhum evento passado ainda
          </p>
        )}

        <div className="space-y-3">
          {past.map((event, i) => {
            const confirmed = event.responses.filter((r) => r.status === "sim");
            const maybe = event.responses.filter((r) => r.status === "talvez");
            const declined = event.responses.filter((r) => r.status === "nao");

            return (
              <motion.div
                key={event.id}
                className="bg-card rounded-card p-5 card-shadow cursor-pointer hover:card-shadow-hover transition-default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", duration: 0.4, bounce: 0 }}
                onClick={() => navigate(`/evento/${event.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-label text-muted-foreground">
                      {event.type === "treino" ? "Treino" : "Amistoso"}
                    </span>
                    <h3 className="heading-display text-lg text-foreground mt-1">
                      {formatEventDate(new Date(event.date))}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {event.time}h
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {event.location}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-accent">
                    <Check className="w-3.5 h-3.5" /> {confirmed.length}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HelpCircle className="w-3.5 h-3.5" /> {maybe.length}
                  </span>
                  <span className="flex items-center gap-1 text-destructive">
                    <X className="w-3.5 h-3.5" /> {declined.length}
                  </span>
                </div>

                {confirmed.length > 0 && (
                  <div className="flex items-center gap-1 mt-3 -space-x-2">
                    {confirmed.slice(0, 6).map((r) => (
                      <div
                        key={r.id}
                        className="w-7 h-7 rounded-full bg-background-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground"
                        title={r.guest_name || "Membro"}
                      >
                        {getInitials(r.guest_name || "Membro")}
                      </div>
                    ))}
                    {confirmed.length > 6 && (
                      <div className="w-7 h-7 rounded-full bg-background-secondary border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        +{confirmed.length - 6}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
