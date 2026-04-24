import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Clock, MapPin, Link2, Users } from "lucide-react";
import { useCreateEvent } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { getTodayDateInputValue } from "@/lib/format";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createEvent = useCreateEvent();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [type, setType] = useState<"treino" | "jogo">("treino");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Faça login para criar uma convocatória");
      return;
    }

    // Validate date/time not in the past
    const now = new Date();
    const eventDateTime = new Date(`${date}T${time}`);
    if (eventDateTime < now) {
      toast.error("Não é possível criar uma convocatória no passado. Escolha uma data e hora futuras.");
      return;
    }

    try {
      await createEvent.mutateAsync({
        type,
        date,
        time,
        location,
        maps_link: mapsLink || undefined,
        total_price: 0,
        max_players: Number(maxPlayers),
        created_by: user.id,
      });
      toast.success("Convocatória criada!");
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar convocatória";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="heading-display text-2xl text-foreground">
            Nova Convocatória
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-label text-muted-foreground block mb-2">Tipo</label>
            <div className="flex bg-background-secondary rounded-inner p-1 gap-1">
              {(["treino", "jogo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`relative flex-1 py-2.5 text-sm font-semibold text-center rounded-[6px] transition-default ${type === t ? "bg-card card-shadow text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setType(t)}
                >
                  {t === "treino" ? "Treino" : "Amistoso"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-label text-muted-foreground block mb-2">Data</label>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={getTodayDateInputValue()}
                className="w-full h-11 pl-10 pr-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" required />
            </div>
          </div>

          <div>
            <label className="text-label text-muted-foreground block mb-2">Hora</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" required />
            </div>
          </div>

          <div>
            <label className="text-label text-muted-foreground block mb-2">Local</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="Nome ou endereço do local"
                className="w-full h-11 pl-10 pr-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default" required />
            </div>
          </div>

          <div>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="url" value={mapsLink} onChange={(e) => setMapsLink(e.target.value)}
                placeholder="Link do Google Maps (opcional)"
                className="w-full h-11 pl-10 pr-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
            </div>
          </div>

          <div>
            <label className="text-label text-muted-foreground block mb-2">Nº de Vagas</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="number" min="2" max="48" value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" required />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Número máximo de jogadores</p>
          </div>

          <Button type="submit" size="lg" className="w-full mt-4" disabled={createEvent.isPending}>
            {createEvent.isPending ? "Criando..." : "Criar Convocatória"}
          </Button>
        </form>
      </div>
    </div>
  );
}
