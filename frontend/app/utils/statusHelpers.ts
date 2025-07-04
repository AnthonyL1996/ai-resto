import type { OrderStatus } from '../types/order.types';

export const getStatusColor = (status: OrderStatus): string => {
  const statusColorMap: Record<OrderStatus, string> = {
    'Nieuw': 'red',
    'In bereiding': 'yellow',
    'Klaar': 'green',
    'Voltooid': 'gray',
    'Geannuleerd': 'gray'
  };
  return statusColorMap[status] || 'gray';
};

export const getStatusText = (status: OrderStatus): string => {
  const statusTextMap: Record<OrderStatus, string> = {
    'Nieuw': 'New',
    'In bereiding': 'Preparing',
    'Klaar': 'Ready',
    'Voltooid': 'Completed',
    'Geannuleerd': 'Cancelled'
  };
  return statusTextMap[status] || status;
};

export const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
        'Nieuw': 'In bereiding',
        'In bereiding': 'Klaar',
        'Klaar': 'Voltooid',
        'Voltooid': null,
        'Geannuleerd': null
    };
    return statusFlow[currentStatus];
};