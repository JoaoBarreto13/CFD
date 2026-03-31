import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export interface Notification {
  id: string;
  user_id: string;
  event_id: string | null;
  kind: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function useNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

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
  kind?: string;
}) {
  const { error } = await supabase
    .from("notifications")
    .insert([{
      user_id: params.user_id,
      event_id: params.event_id,
      kind: params.kind || "generic",
      message: params.message,
    }]);
  if (error) console.error("Notification error:", error);
}

function buildPresenceMessage(names: string[]) {
  const total = names.length;
  if (total === 0) {
    return null;
  }

  if (total === 1) {
    return `${names[0]} confirmou presença.`;
  }

  const recent = names.slice(0, 3).join(", ");
  const suffix = total > 3 ? "..." : "";
  return `${recent}${suffix} Confirmaram presença.`;
}

export async function upsertPresenceNotification(params: {
  user_id: string;
  event_id: string;
}) {
  const { data: responses, error: responsesError } = await supabase
    .from("event_responses")
    .select("user_id, guest_name, updated_at")
    .eq("event_id", params.event_id)
    .eq("status", "sim")
    .order("updated_at", { ascending: false });

  if (responsesError) {
    console.error("Notification aggregate error:", responsesError);
    return;
  }

  const confirmed = responses || [];
  const userIds = confirmed.filter((response) => response.user_id).map((response) => response.user_id as string);

  const profileMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesError) {
      console.error("Notification aggregate error:", profilesError);
      return;
    }

    (profiles || []).forEach((profile) => {
      profileMap[profile.id] = profile.display_name;
    });
  }

  const names = confirmed
    .map((response) => {
      if (response.guest_name) {
        return response.guest_name;
      }
      if (response.user_id && profileMap[response.user_id]) {
        return profileMap[response.user_id];
      }
      return "Membro";
    })
    .filter((name, index, all) => all.indexOf(name) === index);

  const message = buildPresenceMessage(names);
  if (!message) {
    return;
  }

  const { data: existing, error: existingError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", params.user_id)
    .eq("event_id", params.event_id)
    .eq("kind", "presence_confirmation")
    .order("created_at", { ascending: false })
    .limit(1);

  if (existingError) {
    console.error("Notification lookup error:", existingError);
    return;
  }

  if (existing && existing.length > 0) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({
        message,
        read: false,
        created_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", existing[0].id);

    if (updateError) {
      console.error("Notification update error:", updateError);
    }
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .insert([
      {
        user_id: params.user_id,
        event_id: params.event_id,
        kind: "presence_confirmation",
        message,
      },
    ]);

  if (error) {
    console.error("Notification upsert error:", error);
  }
}
