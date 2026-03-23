import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useMarkNotificationsRead } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications(user?.id);
  const { mutate: markRead } = useMarkNotificationsRead();

  useEffect(() => {
    if (user?.id) {
      markRead(user.id);
    }
  }, [user?.id, markRead]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="heading-display text-2xl text-foreground">Notificações</h1>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-center py-12">Carregando...</p>
        )}

        {!isLoading && (!notifications || notifications.length === 0) && (
          <div className="text-center py-12">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">Nenhuma notificação</p>
          </div>
        )}

        <div className="space-y-2">
          {(notifications || []).map((n, i) => (
            <motion.div
              key={n.id}
              className={`bg-card rounded-card p-4 card-shadow ${!n.read ? "border-l-2 border-accent" : ""}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: "spring", duration: 0.4, bounce: 0 }}
            >
              <p className="text-sm font-medium text-foreground">{n.message}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
