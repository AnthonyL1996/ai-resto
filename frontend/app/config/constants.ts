import type { Order } from "~/types/order.types";


export const CUSTOMER_NAMES: readonly string[] = [
  'Peter Van Der Berg',
  'Sophie Martin',
  'Klaus Weber',
  'Emma Johnson',
  'Liam Smith',
  'Olivia Johnson',
  'Noah Williams',
  'Ava Garcia',
  'Elijah Miller',
  'Sophia Davis',
  'James Rodriguez',
  'Isabella Martinez',
  'Kenji Tanaka',
  'Yuna Kim',
] as const;

export const MENU_ITEMS: readonly { name: string; price: number; category: string }[] = [
  { name: 'Chicken Curry', price: 12.50, category: 'Main Course' },
  { name: 'Beef Rendang', price: 14.00, category: 'Main Course' },
  { name: 'Green Curry', price: 11.50, category: 'Main Course' },
  { name: 'Pad Thai', price: 10.50, category: 'Main Course' },
  { name: 'Nasi Goreng', price: 9.50, category: 'Main Course' },
  { name: 'Tom Yum Soup', price: 7.50, category: 'Soup' },
  { name: 'Spring Rolls', price: 6.00, category: 'Appetizer' },
  { name: 'Jasmine Rice', price: 3.50, category: 'Side' },
  { name: 'Coconut Rice', price: 4.00, category: 'Side' }
] as const;

export const ORDER_SIMULATION_INTERVAL = 15000;
export const ORDER_SIMULATION_PROBABILITY = 0.15;
export const ALERT_DURATION = 3000;

export const STATUS_COLOR_MAP: Record<Order['status'], string> = { // Example if you move status colors here
  new: 'red',
  preparing: 'yellow',
  ready: 'green',
  completed: 'gray'
};