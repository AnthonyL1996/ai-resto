import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Order, OrderStatus } from '../types/order.types';

interface KDSWebSocketProps {
  onNewOrder?: (order: Order) => void;
  onOrderUpdate?: (orderId: string, status: OrderStatus) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function KDSWebSocket({ 
  onNewOrder, 
  onOrderUpdate, 
  onConnectionChange 
}: KDSWebSocketProps) {
  const { isConnected, connect, disconnect } = useWebSocket({
    autoConnect: false,
    onNewOrder: useCallback((orderData: any) => {
      console.log('KDS WebSocket: New order received', orderData);
      
      if (onNewOrder) {
        const newOrder: Order = {
          id: orderData.order_id,
          orderNumber: orderData.order_id.slice(-6),
          customerName: orderData.customer_name || 'Anonymous',
          customerPhone: orderData.phone || '',
          items: orderData.items || [],
          total: orderData.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0,
          status: orderData.status,
          paymentMethod: orderData.payment_method,
          source: orderData.source,
          notes: orderData.notes || '',
          timestamp: new Date(orderData.created_at),
          requestedReadyTime: orderData.time_slot ? new Date(orderData.time_slot) : undefined
        };
        
        onNewOrder(newOrder);
      }
    }, [onNewOrder]),
    
    onOrderUpdate: useCallback((orderId: string, status: string) => {
      console.log('KDS WebSocket: Order update received', orderId, status);
      if (onOrderUpdate) {
        onOrderUpdate(orderId, status as OrderStatus);
      }
    }, [onOrderUpdate]),
    
    onConnect: useCallback(() => {
      console.log('KDS WebSocket: Connected');
      onConnectionChange?.(true);
    }, [onConnectionChange]),
    
    onDisconnect: useCallback(() => {
      console.log('KDS WebSocket: Disconnected');
      onConnectionChange?.(false);
    }, [onConnectionChange]),
    
    onError: useCallback((error: Event) => {
      console.error('KDS WebSocket error:', error);
      onConnectionChange?.(false);
    }, [onConnectionChange])
  });

  // Auto-connect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('KDS WebSocket: Attempting to connect...');
      connect();
    }, 1000); // Delay to ensure backend is ready

    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Notify parent of connection changes
  useEffect(() => {
    onConnectionChange?.(isConnected);
  }, [isConnected, onConnectionChange]);

  // This component doesn't render anything
  return null;
}

export default KDSWebSocket;