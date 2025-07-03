import { API_CONFIG } from '../config/api';
import type { Allergen, DietaryOption } from '../types/order.types';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string;
  prep_time: number;
  allergens?: Allergen[];
  dietary_options?: DietaryOption[];
  translations?: Record<string, { name: string; description: string }>;
}

export interface MenuItemCreate {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available?: boolean;
  image_url?: string;
  prep_time?: number;
  allergens?: Allergen[];
  dietary_options?: DietaryOption[];
}

export interface MenuItemUpdate {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  is_available?: boolean;
  image_url?: string;
  prep_time?: number;
  allergens?: Allergen[];
  dietary_options?: DietaryOption[];
}

export class MenuItemService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getMenuItems(category?: string, language?: string): Promise<MenuItem[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (language) params.append('language', language);
      
      const url = `${this.baseUrl}/menu${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch menu items:', error);
      return [];
    }
  }

  async getMenuItem(id: string): Promise<MenuItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/menu/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch menu item:', error);
      return null;
    }
  }

  async createMenuItem(item: MenuItemCreate): Promise<MenuItem> {
    try {
      const response = await fetch(`${this.baseUrl}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create menu item:', error);
      throw new Error('Failed to create menu item. Please try again.');
    }
  }

  async updateMenuItem(id: string, item: MenuItemUpdate): Promise<MenuItem> {
    try {
      const response = await fetch(`${this.baseUrl}/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update menu item:', error);
      throw new Error('Failed to update menu item. Please try again.');
    }
  }

  async deleteMenuItem(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/menu/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete menu item:', error);
      throw new Error('Failed to delete menu item. Please try again.');
    }
  }
}

export const menuItemService = new MenuItemService();