export type DietaryOption = 'vegetarian' | 'vegan' | 'glutenFree';
export type Allergen = 'gluten' | 'lactose' | 'nuts' | 'soy' | 'egg' | 'fish' | 'shellfish';
export type MenuCategory = 'pizza' | 'burgers' | 'fries' | 'drinks' | 'desserts';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifications: string[];
  price: number;
  category: string;
  preparationTime: number; // in minutes
  dietaryOptions: DietaryOption[];
  allergens: Allergen[];
  available: boolean;
  imageUrl?: string;
  description?: string;
}

export type OrderStatus = 'Nieuw' | 'In bereiding' | 'Klaar' | 'Voltooid' | 'Geannuleerd';
export type PaymentMethod = 'card' | 'cash';
export type OrderSource = 'kiosk' | 'website' | 'manual';
export type OrderType = 'pickup' | 'delivery';

export interface Order {
  id: string;
  orderNumber: number;
  timestamp: Date;
  pickupTime?: Date;
  status: OrderStatus;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  total: number;
  estimatedTime: number;
  source: OrderSource;
  notes?: string;
  requestedReadyTime?: Date;
  btwPercentage: number;
  language: 'NL' | 'FR' | 'DE' | 'EN' | 'Cantonese';
}