import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  id: string;
  user_id: string;
  event_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
  });
}

export function useUnreadCount(userId: string | undefined) {
  const { data: notifications } = useNotifications(userId);
  return (notifications || []).filter((n) => !n.read).length;
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true } as Record<string, unknown>)
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export async function createNotification(params: {
  user_id: string;
  event_id: string;
  message: string;
}) {
  const { error } = await supabase
    .from("notifications")
    .insert([{
      user_id: params.user_id,
      event_id: params.event_id,
      message: params.message,
    }]);
  if (error) console.error("Notification error:", error);
}
