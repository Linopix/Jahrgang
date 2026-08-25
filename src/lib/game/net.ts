type Send = (data: unknown, peerId?: string) => void;
type Drop = (peerId: string) => void;

let send: Send | null = null;
let drop: Drop | null = null;
let selfId = "";

export function bindNet(next: { send: Send; selfId: string; dropPeer?: Drop } | null) {
  send = next?.send ?? null;
  drop = next?.dropPeer ?? null;
  selfId = next?.selfId ?? "";
}

export function netSend(data: unknown, peerId?: string) {
  send?.(data, peerId);
}

export function netDrop(peerId: string) {
  drop?.(peerId);
}

export function netSelfId() {
  return selfId;
}
