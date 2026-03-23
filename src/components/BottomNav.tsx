import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, Plus, Bell, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCount } from "@/hooks/useNotifications";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const unreadCount = useUnreadCount(user?.id);

  // Hide on auth page and public event page
  if (location.pathname === "/auth" || location.pathname.startsWith("/e/")) return null;

  type NavTab = {
    path: string;
    icon: typeof CalendarDays;
    label: string;
    badge?: number;
  };

  const tabs: NavTab[] = [
    { path: "/", icon: CalendarDays, label: "Convocatórias" },
    ...(user ? [
      { path: "/criar", icon: Plus, label: "Criar" },
      { path: "/historico", icon: History, label: "Histórico" },
      { path: "/notificacoes", icon: Bell, label: "Alertas", badge: unreadCount },
    ] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`relative flex flex-col items-center gap-0.5 px-4 py-1 transition-default ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{tab.label}</span>
              {!!tab.badge && tab.badge > 0 && (
                <span className="absolute -top-0.5 right-2 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
