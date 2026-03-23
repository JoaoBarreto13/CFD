import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useEventByToken, useRespondToEvent } from "@/hooks/useEvents";
import { formatEventDate, getInitials, parseDateOnly } from "@/lib/format";
import { Clock, MapPin, Users, ExternalLink, Check, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function PublicEvent() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { data: event, isLoading } = useEventByToken(token);
  const respondMutation = useRespondToEvent();
  const { user, isAnonymous } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [selected, setSelected] = useState<"sim" | "nao" | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Convocatória não encontrada</p>
      </div>
    );
  }

  const confirmed = event.responses.filter((r) => r.status === "sim");
  const declined = event.responses.filter((r) => r.status === "nao");
  const pricePerPlayer = confirmed.length > 0
    ? Math.ceil(event.total_price / confirmed.length)
    : event.total_price;

  const handleSubmit = async () => {
    const normalizedGuestName = guestName.trim();

    if ((!user || isAnonymous) && !normalizedGuestName) {
      toast.error("Digite seu nome");
      return;
    }
    if (!selected) {
      toast.error("Selecione sua resposta");
      return;
    }

    try {
      await respondMutation.mutateAsync({
        event_id: event.id,
        status: selected,
        user_id: user?.id,
        guest_name: normalizedGuestName || undefined,
      });
      setSubmitted(true);
      toast.success("Resposta registrada!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao responder";
      toast.error(message);
    }
  };

  const options = [
    { key: "sim" as const, label: "Vou" },
    { key: "nao" as const, label: "Não vou" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => navigate(user && !isAnonymous ? "/" : "/auth")}
          >
            <Home className="w-4 h-4" />
            Home
          </Button>
        </div>

        <motion.div
          className="bg-card rounded-card p-6 card-shadow-elevated mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0 }}
        >
          <span className="text-label text-muted-foreground">
            {event.type === "treino" ? "Treino" : "Amistoso"}
          </span>

          <h1 className="heading-display text-3xl text-foreground mt-2 mb-4">
            {formatEventDate(parseDateOnly(event.date))}
          </h1>

          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{event.time}h</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{event.location}</span>
              {event.maps_link && (
                <a href={event.maps_link} target="_blank" rel="noopener noreferrer"
                  className="text-foreground hover:opacity-70 transition-default">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {event.total_price > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="font-medium">R${pricePerPlayer}/pessoa</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 text-sm mb-6">
            <span className="text-accent font-semibold">{confirmed.length} confirmados</span>
            <span className="text-destructive">{declined.length} não vão</span>
            <span className="text-muted-foreground">de {event.max_players} vagas</span>
          </div>

          {confirmed.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {confirmed.map((r) => (
                <div key={r.id} className="flex items-center gap-1.5 bg-background-secondary rounded-full px-3 py-1">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent-foreground" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{r.guest_name || "Membro"}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {!submitted ? (
          <motion.div
            className="bg-card rounded-card p-6 card-shadow"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", duration: 0.4, bounce: 0 }}
          >
            <h2 className="font-bold text-lg text-foreground mb-4">Confirmar presença</h2>

            <div className="mb-4">
              <label className="text-label text-muted-foreground block mb-2">Seu Nome</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Como te chamam?"
                className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default"
                maxLength={50}
                required={!user || isAnonymous}
              />
            </div>

            <div className="mb-4">
              <label className="text-label text-muted-foreground block mb-2">Vai?</label>
              <div className="relative flex bg-background-secondary rounded-inner p-1 gap-1">
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    className="relative flex-1 py-2 text-sm font-semibold text-center z-10 transition-default rounded-[6px]"
                    style={{ color: selected === opt.key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    onClick={() => setSelected(opt.key)}
                    type="button"
                  >
                    {selected === opt.key && (
                      <motion.div
                        layoutId="rsvp-public"
                        className="absolute inset-0 bg-card rounded-[6px] card-shadow"
                        transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={respondMutation.isPending}
            >
              {respondMutation.isPending ? "Enviando..." : "Confirmar"}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            className="bg-card rounded-card p-6 card-shadow text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-accent-foreground" />
            </div>
            <h2 className="font-bold text-lg text-foreground">Resposta registrada!</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {guestName}, você respondeu: <strong>{selected === "sim" ? "Vou" : "Não vou"}</strong>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
