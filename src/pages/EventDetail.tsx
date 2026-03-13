import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUpdateEvent, useDeleteEvent, type EventWithResponses } from "@/hooks/useEvents";
import { useAuth } from "@/hooks/useAuth";
import { formatEventDate, getInitials, getEventStatus, getEventStatusLabel } from "@/lib/format";
import { Clock, MapPin, ExternalLink, ArrowLeft, Check, X, Pencil, Trash2, Save, Play, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareButton } from "@/components/ShareButton";
import { RsvpSegment } from "@/components/RsvpSegment";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function useEventById(id: string | undefined) {
  return useQuery({
    queryKey: ["event-detail", id],
    enabled: !!id,
    queryFn: async (): Promise<EventWithResponses | null> => {
      const { data: events, error } = await supabase.from("events").select("*").eq("id", id!).limit(1);
      if (error) throw error;
      if (!events || events.length === 0) return null;
      const event = events[0];
      const { data: responses } = await supabase.from("event_responses").select("*").eq("event_id", event.id);
      const userIds = (responses || []).filter(r => r.user_id).map(r => r.user_id!);
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
        if (profiles) profiles.forEach(p => { profileMap[p.id] = p.display_name; });
      }
      return {
        ...event,
        total_price: Number(event.total_price),
        responses: (responses || []).map(r => ({
          ...r,
          guest_name: r.user_id ? (profileMap[r.user_id] || r.guest_name) : r.guest_name,
        })),
      };
    },
  });
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: event, isLoading } = useEventById(id);
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ type: "", date: "", time: "", location: "", maps_link: "", max_players: "10" });

  const isOwner = user && event && user.id === event.created_by;

  const startEditing = () => {
    if (!event) return;
    setEditData({ type: event.type, date: event.date, time: event.time, location: event.location, maps_link: event.maps_link || "", max_players: String(event.max_players) });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!event) return;
    try {
      await updateEvent.mutateAsync({ id: event.id, type: editData.type, date: editData.date, time: editData.time, location: editData.location, maps_link: editData.maps_link || null, max_players: Number(editData.max_players) });
      toast.success("Convocatória atualizada!");
      setEditing(false);
    } catch (err: any) { toast.error(err.message || "Erro ao atualizar"); }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success("Convocatória excluída!");
      navigate("/");
    } catch (err: any) { toast.error(err.message || "Erro ao excluir"); }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!event) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Evento não encontrado</p></div>;

  const confirmed = event.responses.filter((r) => r.status === "sim");
  const declined = event.responses.filter((r) => r.status === "nao");
  const userResponse = user ? event.responses.find((r) => r.user_id === user.id) : null;
  const status = getEventStatus(event.date, event.time);
  const statusLabel = getEventStatusLabel(status);
  const canEdit = isOwner && !editing && status === "upcoming";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button variant="ghost" size="icon" onClick={startEditing} title="Editar"><Pencil className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir convocatória?</AlertDialogTitle>
                      <AlertDialogDescription>Essa ação não pode ser desfeita. Todas as respostas serão perdidas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <ShareButton shareToken={event.share_token} compact />
          </div>
        </div>

        <motion.div className="bg-card rounded-card p-6 card-shadow-elevated mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", duration: 0.4, bounce: 0 }}>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="text-label text-muted-foreground block mb-2">Tipo</label>
                <div className="flex bg-background-secondary rounded-inner p-1 gap-1">
                  {(["treino", "jogo"] as const).map((t) => (
                    <button key={t} type="button" className={`flex-1 py-2 text-sm font-semibold rounded-[6px] transition-default ${editData.type === t ? "bg-card card-shadow text-foreground" : "text-muted-foreground"}`} onClick={() => setEditData({ ...editData, type: t })}>
                      {t === "treino" ? "Treino" : "Amistoso"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label text-muted-foreground block mb-2">Data</label>
                <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
              </div>
              <div>
                <label className="text-label text-muted-foreground block mb-2">Hora</label>
                <input type="time" value={editData.time} onChange={(e) => setEditData({ ...editData, time: e.target.value })} className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
              </div>
              <div>
                <label className="text-label text-muted-foreground block mb-2">Local</label>
                <input type="text" value={editData.location} onChange={(e) => setEditData({ ...editData, location: e.target.value })} className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
              </div>
              <div>
                <label className="text-label text-muted-foreground block mb-2">Link Maps</label>
                <input type="url" value={editData.maps_link} onChange={(e) => setEditData({ ...editData, maps_link: e.target.value })} placeholder="Opcional" className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
              </div>
              <div>
                <label className="text-label text-muted-foreground block mb-2">Vagas</label>
                <input type="number" min="2" max="30" value={editData.max_players} onChange={(e) => setEditData({ ...editData, max_players: e.target.value })} className="w-full h-11 px-4 bg-background-secondary rounded-inner text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-ring transition-default" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 gap-1" disabled={updateEvent.isPending}><Save className="w-4 h-4" />{updateEvent.isPending ? "Salvando..." : "Salvar"}</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-label text-muted-foreground">{event.type === "treino" ? "Treino" : "Amistoso"}</span>
                <span className={`text-label flex items-center gap-1 ${
                  status === "in-progress" ? "text-accent" : status === "finished" ? "text-muted-foreground" : "text-foreground"
                }`}>
                  {status === "in-progress" && <Play className="w-3 h-3" />}
                  {status === "finished" && <CircleCheck className="w-3 h-3" />}
                  {statusLabel}
                </span>
              </div>
              <h1 className="heading-display text-3xl text-foreground mt-2 mb-4">{formatEventDate(new Date(event.date))}</h1>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" /><span className="font-medium">{event.time}h</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /><span className="font-medium">{event.location}</span>
                  {event.maps_link && (
                    <a href={event.maps_link} target="_blank" rel="noopener noreferrer" className="text-foreground hover:opacity-70 transition-default">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
              {user && status === "upcoming" && <RsvpSegment eventId={event.id} initialValue={(userResponse?.status as "sim" | "nao") || null} />}
              {status === "in-progress" && (
                <div className="bg-accent/10 rounded-inner p-3 text-center">
                  <p className="text-sm font-semibold text-accent">🏐 Evento em andamento!</p>
                </div>
              )}
              {status === "finished" && (
                <div className="bg-muted rounded-inner p-3 text-center">
                  <p className="text-sm font-semibold text-muted-foreground">Evento finalizado</p>
                </div>
              )}
            </>
          )}
        </motion.div>

        <ResponseSection title="Confirmados" icon={<Check className="w-4 h-4" />} responses={confirmed} accentClass="text-accent" delay={0.05} />
        <ResponseSection title="Não vão" icon={<X className="w-4 h-4" />} responses={declined} accentClass="text-destructive" delay={0.1} />
      </div>
    </div>
  );
}

function ResponseSection({ title, icon, responses, accentClass, delay }: {
  title: string; icon: React.ReactNode;
  responses: { id: string; guest_name: string | null; user_id: string | null }[];
  accentClass: string; delay: number;
}) {
  if (responses.length === 0) return null;
  return (
    <motion.div className="bg-card rounded-card p-5 card-shadow mb-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, type: "spring", duration: 0.4, bounce: 0 }}>
      <div className={`flex items-center gap-2 mb-3 ${accentClass}`}>
        {icon}<span className="text-label">{title} ({responses.length})</span>
      </div>
      <div className="space-y-2">
        {responses.map((r) => (
          <div key={r.id} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-background-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
              {getInitials(r.guest_name || "Membro")}
            </div>
            <span className="text-sm font-medium text-foreground">{r.guest_name || "Membro"}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
