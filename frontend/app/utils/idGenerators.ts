import type { Order } from '../types/order.types';

export const generateOrderId = (): string => {
  return `ORD${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
};

export const getNextOrderNumber = (orders: Order[]): number => {
  if (orders.length === 0) return 1;
  return Math.max(...orders.map(o => o.orderNumber)) + 1;
};