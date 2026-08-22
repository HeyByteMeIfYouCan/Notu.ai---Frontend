/**
 * Pin Events - Simple event emitter for realtime pin/unpin sync
 * Used to sync pin state between cards and sidebar
 */

type PinEventType = 'meeting' | 'board';

interface PinEvent {
  type: PinEventType;
  id: string;
  pinned: boolean;
}

type PinEventCallback = (event: PinEvent) => void;

class PinEventEmitter {
  private listeners: PinEventCallback[] = [];

  subscribe(callback: PinEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emit(event: PinEvent): void {
    this.listeners.forEach(callback => callback(event));
  }
}

export const pinEvents = new PinEventEmitter();

export function emitPinChange(type: PinEventType, id: string, pinned: boolean): void {
  pinEvents.emit({ type, id, pinned });
}
