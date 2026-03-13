import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index.tsx";
import CreateEvent from "./pages/CreateEvent.tsx";
import AuthPage from "./pages/Auth.tsx";
import PublicEvent from "./pages/PublicEvent.tsx";
import EventDetail from "./pages/EventDetail.tsx";
import NotificationsPage from "./pages/Notifications.tsx";
import HistoryPage from "./pages/History.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/auth"
          element={loading ? <div className="min-h-screen bg-background" /> : user ? <Navigate to="/" replace /> : <AuthPage />}
        />
        <Route path="/e/:token" element={<PublicEvent />} />
        <Route path="/" element={<Index />} />
        <Route path="/evento/:id" element={<EventDetail />} />
        <Route path="/historico" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/criar" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
        <Route path="/notificacoes" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
