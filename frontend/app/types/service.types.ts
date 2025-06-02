import type { OrderFormData } from './form.types';
import type { Order, OrderItem, OrderStatus } from './order.types';

export interface IOrderService {
  getOrders: () => Promise<Order[]>; // Simulating async for future API calls
  getOrderById: (id: string) => Promise<Order | undefined>;
  createOrder: (formData: OrderFormData, items: OrderItem[]) => Promise<Order>;
  updateOrder: (orderId: string, formData: OrderFormData, items: OrderItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => Promise<Order | undefined>;
  deleteOrder: (orderId: string) => Promise<void>;
  calculateOrderTotal: (items: OrderItem[]) => number;
  generateOrderId: () => string;
  getNextOrderNumber: (orders: Order[]) => number;
}

export interface IPrintingService {
  printOrder: (orderId: string, order: Order) => Promise<void>; // Order details might be needed
}

export interface INotificationService {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  // Potentially more types of notifications
}

export interface ISoundService {
  playSound: (soundType: 'newOrder' | 'genericNotification') => void;
  isSoundEnabled: () => boolean;
  toggleSound: () => void;
}