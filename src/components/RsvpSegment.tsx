import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useRespondToEvent } from "@/hooks/useEvents";

interface RsvpSegmentProps {
  eventId: string;
  initialValue?: "sim" | "nao" | null;
  guestName?: string;
}

const options = [
  { key: "sim" as const, label: "Vou" },
  { key: "nao" as const, label: "Não vou" },
];

export function RsvpSegment({ eventId, initialValue = null, guestName }: RsvpSegmentProps) {
  const [selected, setSelected] = useState<"sim" | "nao" | null>(initialValue);
  const { user } = useAuth();
  const respondMutation = useRespondToEvent();

  const handleSelect = (key: "sim" | "nao") => {
    setSelected(key);
    respondMutation.mutate({
      event_id: eventId,
      status: key,
      user_id: user?.id,
      guest_name: guestName,
    });
  };

  return (
    <div className="relative flex bg-background-secondary rounded-inner p-1 gap-1">
      {options.map((opt) => (
        <button
          key={opt.key}
          className="relative flex-1 py-2 text-sm font-semibold text-center z-10 transition-default rounded-[6px]"
          style={{ color: selected === opt.key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
          onClick={() => handleSelect(opt.key)}
        >
          {selected === opt.key && (
            <motion.div
              layoutId={`rsvp-${eventId}`}
              className="absolute inset-0 bg-card rounded-[6px] card-shadow"
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
