import { useEvents, type EventWithResponses } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { NextEventCard } from "@/components/NextEventCard";
import { EventListItem } from "@/components/EventListItem";
import { ShareButton } from "@/components/ShareButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { parseDateOnly, startOfTodayLocal } from "@/lib/format";

const Index = () => {
  const { data: events, isLoading } = useEvents();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const today = startOfTodayLocal();
  const upcoming = (events || [])
    .filter((e) => parseDateOnly(e.date) >= today)
    .sort((a, b) => parseDateOnly(a.date).getTime() - parseDateOnly(b.date).getTime());

  const nextEvent = upcoming[0];
  const restEvents = upcoming.slice(1);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/ceifadora.jpeg" alt="Ceifadora" className="w-8 h-8 rounded-full object-cover" />
            <h1 className="heading-display text-2xl text-foreground">Convocatórias</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {user ? (
              <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-1">
                <LogIn className="w-4 h-4" />
                Entrar
              </Button>
            )}
          </div>
        </div>

        {!user && (
          <div className="bg-card rounded-card p-4 card-shadow mb-4">
            <p className="text-sm text-muted-foreground">
              Você está como <strong className="text-foreground">convidado</strong>. 
              {" "}<button onClick={() => navigate("/auth")} className="text-accent font-semibold hover:underline">Entre</button> para criar convocatórias e receber notificações.
            </p>
          </div>
        )}

        {isLoading && (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        )}

        {!isLoading && upcoming.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Nenhuma convocatória ainda</p>
            {user && <p className="text-sm text-muted-foreground">Crie a primeira usando o botão "Criar" abaixo</p>}
          </div>
        )}

        {nextEvent && (
          <div className="mb-4" onClick={() => navigate(`/evento/${nextEvent.id}`)} role="button">
            <NextEventCard event={nextEvent} />
            <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <ShareButton shareToken={nextEvent.share_token} />
            </div>
          </div>
        )}

        {restEvents.length > 0 && (
          <div>
            <h2 className="text-label text-muted-foreground mb-3">Próximos</h2>
            <div className="space-y-3">
              {restEvents.map((event, i) => (
                <div key={event.id} onClick={() => navigate(`/evento/${event.id}`)} role="button">
                  <EventListItem event={event} index={i} />
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <ShareButton shareToken={event.share_token} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
