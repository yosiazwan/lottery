export class CrossTabEvent {
  private channel: BroadcastChannel | null = null;
  private listeners: Record<string, ((data: any) => void)[]> = {};

  constructor(channelName: string = 'app-events') {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(channelName);

      this.channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (this.listeners[type]) {
          this.listeners[type].forEach(cb => cb(payload));
        }
      };
    }
  }

  on(type: string, callback: (payload: any) => void) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  }

  off(type: string, callback: (payload: any) => void) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
    }
  }

  emit(type: string, payload?: any) {
    // Kirim ke semua tab lain via BroadcastChannel
    if (this.channel) {
      this.channel.postMessage({ type, payload });
    }

    // Juga trigger listener di tab ini sendiri (karena BroadcastChannel tidak fire ke pengirim)
    if (this.listeners[type]) {
      this.listeners[type].forEach(cb => cb(payload));
    }
  }

  close() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

export const crossTabBus = new CrossTabEvent('my-next-app');