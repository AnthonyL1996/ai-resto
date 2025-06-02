export interface OrderItem {
  name: string;
  quantity: number;
  modifications: string[];
  price: number;
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed';
export type PaymentMethod = 'card' | 'cash';
export type OrderSource = 'kiosk' | 'website' | 'manual';

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: Date;
  status: OrderStatus;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  total: number;
  estimatedTime: number;
  source: OrderSource;
  notes?: string;
  requestedReadyTime?: Date;
}