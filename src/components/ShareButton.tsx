import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAppBaseUrl } from "@/lib/app-url";

interface ShareButtonProps {
  shareToken: string;
  compact?: boolean;
}

export function ShareButton({ shareToken, compact }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${getAppBaseUrl()}/e/${shareToken}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Convocatória", url });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (compact) {
    return (
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-default"
      >
        {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
        {copied ? "Copiado" : "Compartilhar"}
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-default py-2"
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Link copiado!" : "Compartilhar convocatória"}
    </button>
  );
}
