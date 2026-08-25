type Send = (data: unknown, peerId?: string) => void;

let send: Send | null = null;
let selfId = "";

export function bindNet(next: { send: Send; selfId: string } | null) {
  send = next?.send ?? null;
  selfId = next?.selfId ?? "";
}

export function netSend(data: unknown, peerId?: string) {
  send?.(data, peerId);
}

export function netSelfId() {
  return selfId;
}
