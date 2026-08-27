import { SwitchRow, SWITCH_PANEL } from "@/components/ui/switch-row";
import { requestSetRoomPin } from "@/lib/game/online-actions";
import { ROOM_PIN_LIVE, pinReady } from "@/lib/game/pin";
import { useOnline } from "@/lib/game/online-store";
import { cn } from "@/lib/utils";

export function HostPinPanel({ className }: { className?: string }) {
  const role = useOnline((s) => s.role);
  const roomPin = useOnline((s) => s.roomPin);
  if (!ROOM_PIN_LIVE) return null;
  if (role !== "host") return null;
  const on = pinReady(roomPin);
  return (
    <div className={cn("mt-5", SWITCH_PANEL, className)}>
      <SwitchRow
        label="PIN"
        hint={
          on
            ? "Beitreten braucht Raumcode und diese PIN. Die PIN steht nicht im Link."
            : "Nur der Raumcode reicht zum Beitreten."
        }
        on={on}
        onChange={(next) => requestSetRoomPin(next)}
      />
      {on ? (
        <p className="py-3 text-center font-mono text-3xl tracking-[0.28em] text-fg">{roomPin}</p>
      ) : null}
    </div>
  );
}
