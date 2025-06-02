import type { IOrderService } from '../types/service.types';
import type { Order, OrderItem, OrderStatus } from '../types/order.types';

import { generateOrderId as genId, getNextOrderNumber as genNextNum } from '../utils/idGenerators'; // Adjust path
import type { OrderFormData } from '~/types/form.types';

// This class would manage the state of orders or interact with a backend.
// For now, let's imagine it's used by a hook that manages the actual React state.
export class LocalOrderService implements IOrderService {
  private orders: Order[] = [ // Initial seed data can be passed or loaded
    // ... initial orders from your example
        {
          id: 'ORD001', orderNumber: 1, timestamp: new Date(Date.now() - 5 * 60000), status: 'new',
          customerName: 'Jan Janssen', customerPhone: '+32 9 123 4567',
          items: [
            { name: 'Chicken Curry', quantity: 2, modifications: ['Extra spicy', 'No mushrooms'], price: 12.50 },
            { name: 'Nasi Goreng', quantity: 1, modifications: ['Vegetarian'], price: 9.50 },
            { name: 'Spring Rolls', quantity: 3, modifications: [], price: 6.00 }
          ],
          paymentMethod: 'card', total: 52.50, estimatedTime: 15, source: 'kiosk', notes: 'Customer is allergic to nuts',
          requestedReadyTime: new Date(Date.now() + 30 * 60000)
        },
        {
          id: 'ORD002', orderNumber: 2, timestamp: new Date(Date.now() - 3 * 60000), status: 'preparing',
          customerName: 'Marie Dupont',
          items: [ { name: 'Pad Thai', quantity: 1, modifications: ['No peanuts'], price: 10.50 }, { name: 'Tom Yum Soup', quantity: 2, modifications: ['Extra vegetables'], price: 7.50 } ],
          paymentMethod: 'cash', total: 25.50, estimatedTime: 10, source: 'website',
          requestedReadyTime: new Date(Date.now() + 45 * 60000)
        }
  ];

  async getOrders(): Promise<Order[]> {
    return Promise.resolve([...this.orders]);
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return Promise.resolve(this.orders.find(order => order.id === id));
  }

  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  generateOrderId(): string {
      return genId();
  }

  getNextOrderNumber(currentOrders: Order[]): number { // Pass current orders if needed
      return genNextNum(currentOrders.length > 0 ? currentOrders : this.orders);
  }

  async createOrder(formData: OrderFormData, items: OrderItem[]): Promise<Order> {
    const newOrder: Order = {
      id: this.generateOrderId(),
      orderNumber: this.getNextOrderNumber(this.orders),
      timestamp: new Date(),
      status: 'new',
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || undefined,
      items: items,
      paymentMethod: formData.paymentMethod,
      total: this.calculateOrderTotal(items),
      estimatedTime: 10 + Math.floor(Math.random() * 15), // Could be more sophisticated
      source: formData.source,
      notes: formData.notes || undefined,
      requestedReadyTime: formData.requestedReadyTime ? new Date(formData.requestedReadyTime) : undefined,
    };
    this.orders = [newOrder, ...this.orders];
    return Promise.resolve(newOrder);
  }

  async updateOrder(orderId: string, formData: OrderFormData, items: OrderItem[]): Promise<Order> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");

    const updatedOrder: Order = {
      ...this.orders[orderIndex],
      customerName: formData.customerName,
      customerPhone: formData.customerPhone || undefined,
      items: items,
      paymentMethod: formData.paymentMethod,
      total: this.calculateOrderTotal(items),
      source: formData.source,
      notes: formData.notes || undefined,
      requestedReadyTime: formData.requestedReadyTime ? new Date(formData.requestedReadyTime) : undefined,
    };
    this.orders[orderIndex] = updatedOrder;
    return Promise.resolve(updatedOrder);
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined> {
    const orderIndex = this.orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return Promise.resolve(undefined);

    this.orders[orderIndex] = { ...this.orders[orderIndex], status: newStatus };
    return Promise.resolve(this.orders[orderIndex]);
  }

  async deleteOrder(orderId: string): Promise<void> {
    this.orders = this.orders.filter(order => order.id !== orderId);
    return Promise.resolve();
  }
}

// You would typically export an instance or a factory function
export const orderService = new LocalOrderService();