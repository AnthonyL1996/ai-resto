import { useCallback } from 'react';
import { PRINTER_TYPES } from '../config/constants';
import type { OrderItem } from '../types/order.types';

interface PrintOptions {
  copies?: number;
  headers?: boolean;
}

export function usePrintService() {
  const printTo = useCallback(
    async (printerType: string, items: OrderItem[], options?: PrintOptions) => {
      try {
        const response = await fetch('/api/print', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printerType,
            items,
            options,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to print');
        }

        return await response.json();
      } catch (error) {
        console.error('Printing error:', error);
        throw error;
      }
    },
    []
  );

  return { printTo };
}