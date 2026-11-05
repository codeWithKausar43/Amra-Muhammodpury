/**
 * Robust, resilient WebSocket client for Amra Muhammadpuri
 * Supports automatic reconnection with exponential backoff,
 * heartbeat keep-alive, channel subscriptions, and event deduplication.
 */

export type RealtimeCallback<T = any> = (data: T, eventId: string) => void;

export class RealtimeClient {
  private static instance: RealtimeClient;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private shouldConnect = false;

  private listeners = new Map<string, Set<RealtimeCallback>>();
  private subscribedChannels = new Set<string>();
  private seenEventIds = new Set<string>();

  public status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' = 'DISCONNECTED';
  private statusListeners = new Set<(status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') => void>();

  private constructor() {
    // Default channels
    this.subscribedChannels.add('public');
  }

  public static getInstance(): RealtimeClient {
    if (!RealtimeClient.instance) {
      RealtimeClient.instance = new RealtimeClient();
    }
    return RealtimeClient.instance;
  }

  /**
   * Determine the backend WebSocket URL
   */
  private getWsUrl(): string {
    if (typeof window === 'undefined') return '';

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const envApi = process.env.NEXT_PUBLIC_API_URL;

    if (envApi) {
      // Replace http/https with ws/wss and append /api/v1/realtime/ws
      const cleanApi = envApi.replace(/\/api\/v1\/?$/, '').replace(/^http/, 'ws');
      return `${cleanApi}/api/v1/realtime/ws`;
    }

    // Default development fallback: port 5000
    const host = window.location.hostname || 'localhost';
    return `${protocol}//${host}:5000/api/v1/realtime/ws`;
  }

  /**
   * Connect to the WebSocket server
   */
  public connect() {
    if (typeof window === 'undefined') return;
    this.shouldConnect = true;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');
    const url = this.getWsUrl();

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        this.startPing();

        // Resubscribe to all tracked channels
        for (const channel of this.subscribedChannels) {
          this.send({ type: 'SUBSCRIBE', channel });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);

          // Handle system control messages
          if (raw.type === 'PONG') {
            return;
          }

          if (raw.type === 'CONNECTED') {
            return;
          }

          // Handle envelope broadcast
          if (raw.eventId && raw.event) {
            // Deduplication check
            if (this.seenEventIds.has(raw.eventId)) {
              return;
            }
            this.seenEventIds.add(raw.eventId);
            if (this.seenEventIds.size > 200) {
              const first = this.seenEventIds.values().next().value;
              if (first) this.seenEventIds.delete(first);
            }

            // Dispatch to registered event listeners
            const eventCallbacks = this.listeners.get(raw.event);
            if (eventCallbacks) {
              for (const cb of eventCallbacks) {
                try {
                  cb(raw.data, raw.eventId);
                } catch (e) {
                  console.error('Error in realtime listener callback:', e);
                }
              }
            }

            // Also dispatch to wildcard listener '*'
            const wildcardCallbacks = this.listeners.get('*');
            if (wildcardCallbacks) {
              for (const cb of wildcardCallbacks) {
                try {
                  cb(raw, raw.eventId);
                } catch (e) {
                  console.error('Error in wildcard realtime listener:', e);
                }
              }
            }
          }
        } catch {
          // Ignore parse errors for malformed frames
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        this.setStatus('DISCONNECTED');
        if (this.shouldConnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // ws.onclose will fire after onerror
      };
    } catch {
      this.setStatus('DISCONNECTED');
      if (this.shouldConnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect() {
    this.shouldConnect = false;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }

  /**
   * Subscribe to a channel (e.g. 'public', 'campaign:123', 'admin')
   */
  public subscribe(channel: string) {
    this.subscribedChannels.add(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'SUBSCRIBE', channel });
    }
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(channel: string) {
    this.subscribedChannels.delete(channel);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'UNSUBSCRIBE', channel });
    }
  }

  /**
   * Register an event listener for a typed event name
   */
  public on<T = any>(event: string, callback: RealtimeCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unbind function
    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Listen to connection status changes
   */
  public onStatusChange(callback: (status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch {
        // Send failure
      }
    }
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING' });
      }
    }, 25000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    this.reconnectAttempts++;
    // Exponential backoff: 1s, 2s, 4s, 8s, max 15s with jitter
    const baseDelay = Math.min(1000 * Math.pow(1.6, this.reconnectAttempts), 15000);
    const jitter = Math.random() * 500;
    const delay = baseDelay + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.shouldConnect) {
        this.connect();
      }
    }, delay);
  }

  private cleanup() {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED') {
    this.status = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch {
        // Ignore listener error
      }
    }
  }
}

export const realtimeClient = RealtimeClient.getInstance();
