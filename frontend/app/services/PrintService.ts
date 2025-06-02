import type { IPrintingService } from '../types/service.types';
import type { Order } from '../types/order.types';

export class ConsolePrintingService implements IPrintingService {
  async printOrder(orderId: string, order: Order): Promise<void> {
    console.log(`--- Printing Order #${order.orderNumber} (ID: ${orderId}) ---`);
    console.log(`Customer: ${order.customerName}`);
    console.log(`Total: €${order.total.toFixed(2)}`);
    console.log("Items:");
    order.items.forEach(item => {
      console.log(`  - ${item.quantity}x ${item.name}`);
      if (item.modifications.length > 0) {
        console.log(`    (${item.modifications.join(', ')})`);
      }
    });
    console.log("-------------------------------");
    // In a real scenario, this would interface with a printer API or OS print dialog
    return Promise.resolve();
  }
}

export const printService = new ConsolePrintingService();