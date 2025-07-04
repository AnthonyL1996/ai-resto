import { API_CONFIG } from '../config/api';

export interface Event {
  id: string;
  type: string;
  data: any;
  timestamp: string;
  consumed: boolean;
  consumer_id?: string;
}

export interface EventPollingOptions {
  consumerID: string;
  pollIntervalMs?: number;
  onNewOrder?: (orderData: any) => void;
  onOrderUpdate?: (orderId: string, status: string, orderData?: any) => void;
  onOrderDelete?: (orderId: string) => void;
  onEvent?: (event: Event) => void;
  onError?: (error: Error) => void;
  onConnectionChange?: (connected: boolean) => void;
  autoStart?: boolean;
}

export class EventPollingService {
  private consumerID: string;
  private pollIntervalMs: number;
  private callbacks: Required<Pick<EventPollingOptions, 'onNewOrder' | 'onOrderUpdate' | 'onOrderDelete' | 'onEvent' | 'onError' | 'onConnectionChange'>>;
  private polling: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;
  private lastEventTime: string | null = null;
  private baseURL: string;
  private consecutiveErrors: number = 0;
  private maxConsecutiveErrors: number = 5;
  private backoffMultiplier: number = 1.5;
  private maxBackoffMs: number = 30000; // 30 seconds
  
  constructor(options: EventPollingOptions) {
    this.consumerID = options.consumerID;
    this.pollIntervalMs = options.pollIntervalMs || 2000; // Default 2 seconds
    this.baseURL = API_CONFIG.BASE_URL;
    
    // Set up callbacks with defaults
    this.callbacks = {
      onNewOrder: options.onNewOrder || (() => {}),
      onOrderUpdate: options.onOrderUpdate || (() => {}),
      onOrderDelete: options.onOrderDelete || (() => {}),
      onEvent: options.onEvent || (() => {}),
      onError: options.onError || (() => {}),
      onConnectionChange: options.onConnectionChange || (() => {})
    };
    
    // Auto-start if requested
    if (options.autoStart !== false) {
      this.start();
    }
  }
  
  /**
   * Start polling for events
   */
  start(): void {
    if (this.polling) {
      console.log('EventPollingService: Already polling');
      return;
    }
    
    console.log(`EventPollingService: Starting polling for consumer ${this.consumerID}`);
    this.polling = true;
    this.callbacks.onConnectionChange(true);
    this.scheduleNextPoll();
  }
  
  /**
   * Stop polling for events
   */
  stop(): void {
    if (!this.polling) {
      return;
    }
    
    console.log(`EventPollingService: Stopping polling for consumer ${this.consumerID}`);
    this.polling = false;
    this.callbacks.onConnectionChange(false);
    
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }
  
  /**
   * Check if currently polling
   */
  isPolling(): boolean {
    return this.polling;
  }
  
  /**
   * Update callbacks
   */
  updateCallbacks(newCallbacks: Partial<EventPollingOptions>): void {
    if (newCallbacks.onNewOrder) this.callbacks.onNewOrder = newCallbacks.onNewOrder;
    if (newCallbacks.onOrderUpdate) this.callbacks.onOrderUpdate = newCallbacks.onOrderUpdate;
    if (newCallbacks.onOrderDelete) this.callbacks.onOrderDelete = newCallbacks.onOrderDelete;
    if (newCallbacks.onEvent) this.callbacks.onEvent = newCallbacks.onEvent;
    if (newCallbacks.onError) this.callbacks.onError = newCallbacks.onError;
    if (newCallbacks.onConnectionChange) this.callbacks.onConnectionChange = newCallbacks.onConnectionChange;
  }
  
  /**
   * Get current consumer ID
   */
  getConsumerID(): string {
    return this.consumerID;
  }
  
  /**
   * Get polling statistics
   */
  getStats(): { polling: boolean; consumerID: string; lastEventTime: string | null; consecutiveErrors: number } {
    return {
      polling: this.polling,
      consumerID: this.consumerID,
      lastEventTime: this.lastEventTime,
      consecutiveErrors: this.consecutiveErrors
    };
  }
  
  /**
   * Force a poll immediately
   */
  async forcePoll(): Promise<void> {
    if (!this.polling) {
      throw new Error('EventPollingService is not currently polling');
    }
    
    await this.pollForEvents();
  }
  
  /**
   * Schedule the next poll with backoff logic
   */
  private scheduleNextPoll(): void {
    if (!this.polling) {
      return;
    }
    
    // Calculate backoff delay
    let delay = this.pollIntervalMs;
    if (this.consecutiveErrors > 0) {
      delay = Math.min(
        this.pollIntervalMs * Math.pow(this.backoffMultiplier, this.consecutiveErrors),
        this.maxBackoffMs
      );
    }
    
    this.pollTimer = setTimeout(async () => {
      if (this.polling) {
        await this.pollForEvents();
        this.scheduleNextPoll();
      }
    }, delay);
  }
  
  /**
   * Poll for events from the server
   */
  private async pollForEvents(): Promise<void> {
    try {
      const url = new URL(`${this.baseURL}/events/kds`);
      url.searchParams.append('consumer_id', this.consumerID);
      
      if (this.lastEventTime) {
        url.searchParams.append('since', this.lastEventTime);
      }
      
      // Add cache busting parameter
      url.searchParams.append('_t', Date.now().toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store', // Prevent browser caching
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const events: Event[] = await response.json();
      
      // Reset error counter on successful poll
      this.consecutiveErrors = 0;
      
      // Process events
      if (events.length > 0) {
        console.log(`EventPollingService: Received ${events.length} events`);
        
        for (const event of events) {
          this.processEvent(event);
          this.lastEventTime = event.timestamp;
        }
        
        // Mark events as consumed (optional - for precise tracking)
        await this.markEventsConsumed(events.map(e => e.id));
      }
      
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`EventPollingService: Polling error (${this.consecutiveErrors}):`, error);
      
      // Stop polling if too many consecutive errors
      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(`EventPollingService: Too many consecutive errors, stopping polling`);
        this.stop();
        this.callbacks.onConnectionChange(false);
      }
      
      this.callbacks.onError(error as Error);
    }
  }
  
  /**
   * Process a single event
   */
  private processEvent(event: Event): void {
    console.log(`EventPollingService: Processing event ${event.type}:`, event.data);
    
    // Call generic event callback
    this.callbacks.onEvent(event);
    
    // Call specific callbacks based on event type
    switch (event.type) {
      case 'new_order':
        this.callbacks.onNewOrder(event.data);
        
        // Play sound if metadata indicates it
        if (event.data._metadata?.play_sound) {
          this.playNotificationSound();
        }
        break;
        
      case 'order_update':
        this.callbacks.onOrderUpdate(
          event.data.order_id,
          event.data.status,
          event.data
        );
        break;
        
      case 'order_delete':
        this.callbacks.onOrderDelete(event.data.order_id);
        break;
        
      default:
        console.warn(`EventPollingService: Unknown event type: ${event.type}`);
    }
  }
  
  /**
   * Mark events as consumed
   */
  private async markEventsConsumed(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) {
      return;
    }
    
    try {
      const response = await fetch(`${this.baseURL}/events/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_ids: eventIds,
          consumer_id: this.consumerID
        })
      });
      
      if (!response.ok) {
        console.warn(`Failed to mark events as consumed: ${response.status}`);
      }
      
    } catch (error) {
      console.warn('Error marking events as consumed:', error);
    }
  }
  
  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch((error) => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }
}

export default EventPollingService;