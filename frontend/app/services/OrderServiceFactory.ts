import type { IOrderService } from '../types/service.types';
import { API_CONFIG } from '../config/api';
import { LocalOrderService } from './OrderService';
import { ApiOrderService } from './ApiOrderService';

export class OrderServiceFactory {
  static createOrderService(): IOrderService {
    if (API_CONFIG.USE_API) {
      console.log('Using API Order Service - connecting to backend');
      return new ApiOrderService();
    } else {
      console.log('Using Local Order Service - mock data');
      return new LocalOrderService();
    }
  }
}

// Export a singleton instance
export const orderService = OrderServiceFactory.createOrderService();