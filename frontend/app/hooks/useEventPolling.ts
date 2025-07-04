import { useEffect, useRef, useState, useCallback } from 'react';
import { EventPollingService, Event, EventPollingOptions } from '../services/EventPollingService';

export interface UseEventPollingOptions extends Omit<EventPollingOptions, 'consumerID'> {
  consumerID: string;
  enabled?: boolean;
}

export interface UseEventPollingReturn {
  isPolling: boolean;
  isConnected: boolean;
  lastEvent: Event | null;
  stats: {
    polling: boolean;
    consumerID: string;
    lastEventTime: string | null;
    consecutiveErrors: number;
  };
  start: () => void;
  stop: () => void;
  forcePoll: () => Promise<void>;
  updateCallbacks: (callbacks: Partial<EventPollingOptions>) => void;
}

/**
 * React hook for event polling service
 * 
 * @param options Configuration options for event polling
 * @returns Object with polling state and control functions
 */
export function useEventPolling(options: UseEventPollingOptions): UseEventPollingReturn {
  const {
    consumerID,
    enabled = true,
    pollIntervalMs = 2000,
    onNewOrder,
    onOrderUpdate,
    onOrderDelete,
    onEvent,
    onError,
    onConnectionChange,
    autoStart = true
  } = options;
  
  const [isPolling, setIsPolling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<Event | null>(null);
  const serviceRef = useRef<EventPollingService | null>(null);
  
  // Memoized callbacks to prevent unnecessary service updates
  const stableCallbacks = useCallback(() => ({
    onNewOrder: (orderData: any) => {
      console.log('useEventPolling: New order received', orderData);
      onNewOrder?.(orderData);
    },
    
    onOrderUpdate: (orderId: string, status: string, orderData?: any) => {
      console.log('useEventPolling: Order update received', orderId, status);
      onOrderUpdate?.(orderId, status, orderData);
    },
    
    onOrderDelete: (orderId: string) => {
      console.log('useEventPolling: Order delete received', orderId);
      onOrderDelete?.(orderId);
    },
    
    onEvent: (event: Event) => {
      setLastEvent(event);
      onEvent?.(event);
    },
    
    onError: (error: Error) => {
      console.error('useEventPolling: Error occurred', error);
      onError?.(error);
    },
    
    onConnectionChange: (connected: boolean) => {
      setIsConnected(connected);
      setIsPolling(connected);
      onConnectionChange?.(connected);
    }
  }), [onNewOrder, onOrderUpdate, onOrderDelete, onEvent, onError, onConnectionChange]);
  
  // Initialize service
  useEffect(() => {
    if (!enabled) {
      return;
    }
    
    console.log(`useEventPolling: Initializing for consumer ${consumerID}`);
    
    serviceRef.current = new EventPollingService({
      consumerID,
      pollIntervalMs,
      autoStart: false, // We'll control start/stop manually
      ...stableCallbacks()
    });
    
    // Auto-start if requested
    if (autoStart) {
      serviceRef.current.start();
    }
    
    return () => {
      if (serviceRef.current) {
        console.log(`useEventPolling: Cleaning up for consumer ${consumerID}`);
        serviceRef.current.stop();
        serviceRef.current = null;
      }
    };
  }, [consumerID, pollIntervalMs, enabled, autoStart]);
  
  // Update callbacks when they change
  useEffect(() => {
    if (serviceRef.current) {
      serviceRef.current.updateCallbacks(stableCallbacks());
    }
  }, [stableCallbacks]);
  
  // Control functions
  const start = useCallback(() => {
    if (serviceRef.current && enabled) {
      serviceRef.current.start();
    }
  }, [enabled]);
  
  const stop = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stop();
    }
  }, []);
  
  const forcePoll = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.forcePoll();
    }
  }, []);
  
  const updateCallbacks = useCallback((callbacks: Partial<EventPollingOptions>) => {
    if (serviceRef.current) {
      serviceRef.current.updateCallbacks(callbacks);
    }
  }, []);
  
  // Get current stats
  const stats = serviceRef.current?.getStats() || {
    polling: false,
    consumerID,
    lastEventTime: null,
    consecutiveErrors: 0
  };
  
  return {
    isPolling,
    isConnected,
    lastEvent,
    stats,
    start,
    stop,
    forcePoll,
    updateCallbacks
  };
}

export default useEventPolling;