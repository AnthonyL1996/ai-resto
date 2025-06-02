import type { OrderStatus } from '../types/order.types';

export const getStatusColor = (status: OrderStatus): string => {
  const statusColorMap: Record<OrderStatus, string> = {
    new: 'red',
    preparing: 'yellow',
    ready: 'green',
    completed: 'gray'
  };
  return statusColorMap[status];
};

export const getStatusText = (status: OrderStatus): string => {
  const statusTextMap: Record<OrderStatus, string> = {
    new: 'New',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed'
  };
  return statusTextMap[status];
};

export const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
        new: 'preparing',
        preparing: 'ready',
        ready: 'completed',
        completed: null
    };
    return statusFlow[currentStatus];
};