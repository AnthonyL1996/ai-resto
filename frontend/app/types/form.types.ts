import type { OrderItem, PaymentMethod, OrderSource } from './order.types';

export interface OrderFormData {
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  source: OrderSource;
  notes: string;
  items: OrderItem[]; // Keep items here for form state
}