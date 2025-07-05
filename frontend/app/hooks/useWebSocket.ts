import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketService, type WebSocketCallbacks, type WebSocketMessage } from '../services/WebSocketService';

export interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onNewOrder?: (order: any) => void;
  onOrderUpdate?: (orderId: string, status: string) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = 'ws://localhost:8000/ws',
    autoConnect = true,
    onNewOrder,
    onOrderUpdate,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<number>(WebSocket.CLOSED);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  
  const wsRef = useRef<WebSocketService | null>(null);

  const callbacks: WebSocketCallbacks = {
    onConnect: useCallback(() => {
      setIsConnected(true);
      setConnectionState(WebSocket.OPEN);
      setError(null);
      onConnect?.();
    }, [onConnect]),

    onDisconnect: useCallback(() => {
      setIsConnected(false);
      setConnectionState(WebSocket.CLOSED);
      onDisconnect?.();
    }, [onDisconnect]),

    onError: useCallback((error: Event) => {
      setError(error);
      onError?.(error);
    }, [onError]),

    onMessage: useCallback((message: WebSocketMessage) => {
      setLastMessage(message);
      onMessage?.(message);
    }, [onMessage]),

    onNewOrder: useCallback((order: any) => {
      onNewOrder?.(order);
    }, [onNewOrder]),

    onOrderUpdate: useCallback((orderId: string, status: string) => {
      onOrderUpdate?.(orderId, status);
    }, [onOrderUpdate])
  };

  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocketService(url, callbacks);
    } else {
      wsRef.current.updateCallbacks(callbacks);
    }

    if (autoConnect) {
      // Add a small delay to avoid blocking initial render
      setTimeout(() => {
        wsRef.current?.connect();
      }, 100);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
      }
    };
  }, [url, autoConnect]);

  // Update callbacks when individual callback functions change
  useEffect(() => {
    if (wsRef.current) {
      wsRef.current.updateCallbacks(callbacks);
    }
  }, [onNewOrder, onOrderUpdate, onMessage, onConnect, onDisconnect, onError]);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current) {
      wsRef.current.send(message);
    }
  }, []);

  const getConnectionState = useCallback(() => {
    return wsRef.current?.getConnectionState() ?? WebSocket.CLOSED;
  }, []);

  return {
    isConnected,
    connectionState,
    lastMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    getConnectionState
  };
}

export default useWebSocket;