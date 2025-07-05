export interface WebSocketMessage {
  type: string;
  data?: any;
  order?: any;
  play_sound?: boolean;
  order_id?: string;
  status?: string;
}

export interface WebSocketCallbacks {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (orderId: string, status: string) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;

  constructor(
    private url: string = 'ws://localhost:8000/ws',
    callbacks?: WebSocketCallbacks
  ) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket:', this.url);
    this.isManualClose = false;
    
    try {
      this.ws = new WebSocket(this.url);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      return;
    }

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.callbacks.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      // Use requestAnimationFrame to prevent blocking the UI
      requestAnimationFrame(() => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          // Always call the general message handler
          this.callbacks.onMessage?.(message);

          // Handle specific message types for backwards compatibility
          switch (message.type) {
            case 'new_order':
              this.callbacks.onNewOrder?.(message.data || message.order);
              if (message.play_sound) {
                // Defer audio playback to prevent blocking
                setTimeout(() => this.playNotificationSound(), 0);
              }
              break;
            case 'order_update':
            case 'order_status_update':
            case 'kds_status_update':
              this.callbacks.onOrderUpdate?.(message.data?.id || message.order_id!, message.data?.status || message.status!);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event);
      this.callbacks.onDisconnect?.();
      
      if (!this.isManualClose) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.callbacks.onError?.(error);
    };
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Use exponential backoff to avoid flooding
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 10000);
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  private playNotificationSound(): void {
    // Use setTimeout to make audio playback non-blocking
    setTimeout(() => {
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch((error) => {
          console.warn('Could not play notification sound:', error);
        });
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    }, 0);
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Cannot send message:', message);
    }
  }

  updateCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  getConnectionState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default WebSocketService;