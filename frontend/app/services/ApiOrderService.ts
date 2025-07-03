import type { IOrderService } from '../types/service.types';
import type { Order, OrderItem, OrderStatus } from '../types/order.types';
import type { OrderFormData } from '../types/form.types';
import { MENU_ITEMS } from '../config/constants';
import { API_CONFIG } from '../config/api';

// Backend API order interface
interface ApiOrderItem {
  item_id: string;
  quantity: number;
  special_requests?: string;
}

interface ApiOrderCreate {
  customer_id?: string;
  customer_name?: string;
  phone?: string;
  items: ApiOrderItem[];
  payment_method: string;
  time_slot?: string;
  source: string;
  notes?: string;
}

interface ApiOrderResponse {
  order_id: string;
  customer_id?: string;
  customer_name?: string;
  phone?: string;
  items: ApiOrderItem[];
  payment_method: string;
  time_slot?: string;
  source: string;
  notes?: string;
  status: string;
  created_at: string;
  print_status: string;
  print_attempts: number;
}

export class ApiOrderService implements IOrderService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Convert frontend OrderItem to backend ApiOrderItem
  private toApiOrderItem(item: OrderItem): ApiOrderItem {
    return {
      item_id: item.name, // Using name as item_id for now
      quantity: item.quantity,
      special_requests: item.modifications?.join(', ') || undefined
    };
  }

  // Convert backend ApiOrderResponse to frontend Order
  private fromApiOrder(apiOrder: ApiOrderResponse): Order {
    const items: OrderItem[] = (apiOrder.items || []).map(item => {
      const menuItem = MENU_ITEMS.find(m => m.name === item.item_id);
      return {
        name: item.item_id,
        quantity: item.quantity,
        modifications: item.special_requests ? item.special_requests.split(', ') : [],
        price: menuItem?.price || 10 // Use actual price from menu or default
      };
    });

    return {
      id: apiOrder.order_id,
      orderNumber: parseInt(apiOrder.order_id.slice(-3)) || 1, // Extract number from ID
      timestamp: new Date(apiOrder.created_at),
      status: apiOrder.status as OrderStatus,
      customerName: apiOrder.customer_name || 'Unknown',
      customerPhone: apiOrder.phone,
      items,
      paymentMethod: apiOrder.payment_method as 'cash' | 'card',
      total: this.calculateOrderTotal(items),
      estimatedTime: 15, // Default estimate
      source: apiOrder.source as 'manual' | 'kiosk' | 'website',
      notes: apiOrder.notes,
      requestedReadyTime: apiOrder.time_slot ? new Date(apiOrder.time_slot) : undefined
    };
  }

  async getOrders(): Promise<Order[]> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiOrders: ApiOrderResponse[] = await response.json();
      return apiOrders.map(order => this.fromApiOrder(order));
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      return [];
    }
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}/${id}`);
      if (!response.ok) {
        if (response.status === 404) return undefined;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const apiOrder: ApiOrderResponse = await response.json();
      return this.fromApiOrder(apiOrder);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      return undefined;
    }
  }

  calculateOrderTotal(items: OrderItem[]): number {
    return items.reduce((total, item) => {
      const menuItem = MENU_ITEMS.find(m => m.name === item.name);
      const price = menuItem?.price || item.price || 10; // Use menu price, item price, or default
      return total + (price * item.quantity);
    }, 0);
  }

  generateOrderId(): string {
    return `ORD${Date.now()}`; // Simple ID generation
  }

  getNextOrderNumber(currentOrders: Order[]): number {
    return currentOrders.length + 1;
  }

  async createOrder(formData: OrderFormData, items: OrderItem[]): Promise<Order> {
    const apiOrder: ApiOrderCreate = {
      customer_name: formData.customerName,
      phone: formData.customerPhone,
      items: items.map(item => this.toApiOrderItem(item)),
      payment_method: formData.paymentMethod,
      time_slot: formData.requestedReadyTime?.toISOString(),
      source: formData.source,
      notes: formData.notes
    };

    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiOrder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const apiOrderResponse: ApiOrderResponse = await response.json();
      return this.fromApiOrder(apiOrderResponse);
    } catch (error) {
      console.error('Failed to create order:', error);
      throw new Error('Failed to create order. Please try again.');
    }
  }

  async updateOrder(orderId: string, formData: OrderFormData, items: OrderItem[]): Promise<Order> {
    const apiOrder: ApiOrderCreate = {
      customer_name: formData.customerName,
      phone: formData.customerPhone,
      items: items.map(item => this.toApiOrderItem(item)),
      payment_method: formData.paymentMethod,
      time_slot: formData.requestedReadyTime?.toISOString(),
      source: formData.source,
      notes: formData.notes
    };

    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiOrder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const apiOrderResponse: ApiOrderResponse = await response.json();
      return this.fromApiOrder(apiOrderResponse);
    } catch (error) {
      console.error('Failed to update order:', error);
      throw new Error('Failed to update order. Please try again.');
    }
  }

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        if (response.status === 404) return undefined;
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const apiOrderResponse: ApiOrderResponse = await response.json();
      return this.fromApiOrder(apiOrderResponse);
    } catch (error) {
      console.error('Failed to update order status:', error);
      return undefined;
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${API_CONFIG.ENDPOINTS.ORDERS}/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 404) return; // Already deleted
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw new Error('Failed to delete order. Please try again.');
    }
  }
}

// Export both services for flexibility
export const apiOrderService = new ApiOrderService();