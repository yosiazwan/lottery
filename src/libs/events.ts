type Listener = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, Listener[]> = {};

  on(event: string, callback: Listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

export const eventBus = new EventEmitter();