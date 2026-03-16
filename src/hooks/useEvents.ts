import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertPresenceNotification } from "@/hooks/useNotifications";

export interface EventWithResponses {
  id: string;
  created_by: string;
  type: string;
  date: string;
  time: string;
  location: string;
  maps_link: string | null;
  total_price: number;
  max_players: number;
  share_token: string;
  created_at: string;
  responses: {
    id: string;
    guest_name: string | null;
    user_id: string | null;
    status: string;
  }[];
}

async function hydrateResponsesWithProfileNames(
  responses: {
    id: string;
    event_id: string;
    guest_name: string | null;
    user_id: string | null;
    status: string;
  }[],
) {
  const allUserIds = responses.filter((response) => response.user_id).map((response) => response.user_id!);

  if (allUserIds.length === 0) {
    return responses;
  }

  const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", allUserIds);

  const profileMap: Record<string, string> = {};
  if (profiles) {
    profiles.forEach((profile) => {
      profileMap[profile.id] = profile.display_name;
    });
  }

  return responses.map((response) => ({
    ...response,
    guest_name: response.user_id ? (profileMap[response.user_id] || response.guest_name) : response.guest_name,
  }));
}

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventWithResponses[]> => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      const { data: responses, error: respError } = await supabase
        .from("event_responses")
        .select("*");

      if (respError) throw respError;

      const hydratedResponses = await hydrateResponsesWithProfileNames(responses || []);

      return (events || []).map((e) => ({
        ...e,
        total_price: Number(e.total_price),
        responses: hydratedResponses.filter((r) => r.event_id === e.id),
      }));
    },
  });
}

export function useEventByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["event", token],
    enabled: !!token,
    queryFn: async (): Promise<EventWithResponses | null> => {
      const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("share_token", token!)
        .limit(1);

      if (error) throw error;
      if (!events || events.length === 0) return null;

      const event = events[0];
      const { data: responses } = await supabase
        .from("event_responses")
        .select("*")
        .eq("event_id", event.id);

      const hydratedResponses = await hydrateResponsesWithProfileNames(responses || []);

      return {
        ...event,
        total_price: Number(event.total_price),
        responses: hydratedResponses,
      };
    },
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: {
      type: string;
      date: string;
      time: string;
      location: string;
      maps_link?: string;
      total_price: number;
      max_players: number;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      type?: string;
      date?: string;
      time?: string;
      location?: string;
      maps_link?: string | null;
      total_price?: number;
      max_players?: number;
    }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event-detail"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useRespondToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (response: {
      event_id: string;
      status: string;
      user_id?: string;
      guest_name?: string;
    }) => {
      let eventCreatorId: string | null = null;
      const normalizedGuestName = response.guest_name?.trim() || undefined;

      // Get event creator for notification
      const { data: eventData } = await supabase
        .from("events")
        .select("created_by, type, date")
        .eq("id", response.event_id)
        .limit(1);

      if (eventData && eventData.length > 0) {
        eventCreatorId = eventData[0].created_by;
      }

      if (response.user_id && normalizedGuestName) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({ id: response.user_id, display_name: normalizedGuestName });

        if (profileError) throw profileError;
      }

      if (response.user_id) {
        const { data: existing } = await supabase
          .from("event_responses")
          .select("id")
          .eq("event_id", response.event_id)
          .eq("user_id", response.user_id)
          .limit(1);

        if (existing && existing.length > 0) {
          const updates: { status: string; guest_name?: string } = { status: response.status };
          if (normalizedGuestName) {
            updates.guest_name = normalizedGuestName;
          }

          const { error } = await supabase
            .from("event_responses")
            .update(updates)
            .eq("id", existing[0].id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("event_responses")
            .insert({
              event_id: response.event_id,
              status: response.status,
              user_id: response.user_id,
              guest_name: normalizedGuestName,
            });
          if (error) throw error;
        }
      } else if (normalizedGuestName) {
        const { data: existing } = await supabase
          .from("event_responses")
          .select("id")
          .eq("event_id", response.event_id)
          .eq("guest_name", normalizedGuestName)
          .limit(1);

        if (existing && existing.length > 0) {
          const { error } = await supabase
            .from("event_responses")
            .update({ status: response.status })
            .eq("id", existing[0].id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("event_responses")
            .insert({
              event_id: response.event_id,
              status: response.status,
              guest_name: normalizedGuestName,
            });
          if (error) throw error;
        }
      }

      // Keep one aggregated confirmation notification per event.
      if (eventCreatorId && response.status === "sim" && response.user_id) {
        try {
          await upsertPresenceNotification({
            user_id: eventCreatorId,
            event_id: response.event_id,
          });
        } catch {
          // notification failure shouldn't block the response
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
      queryClient.invalidateQueries({ queryKey: ["event-detail"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
