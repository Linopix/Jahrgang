import { EMOTE_SRC, isHiddenEmote, type ReactionId } from "@/lib/game/reactions";
import { cn } from "@/lib/utils";

export function EmoteMark({
  id,
  className,
}: {
  id: ReactionId;
  className?: string;
}) {
  if (isHiddenEmote(id)) {
    return (
      <img
        src={EMOTE_SRC[id]}
        alt="Schweinebein"
        className={cn("inline-block rounded-sm object-cover", className)}
      />
    );
  }
  return <span className={className}>{id}</span>;
}
