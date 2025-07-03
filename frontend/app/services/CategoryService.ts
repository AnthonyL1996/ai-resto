import { API_CONFIG } from '../config/api';

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  color: string;
  description?: string;
  translations?: Record<string, { name: string; description: string }>;
}

export interface CategoryCreate {
  name: string;
  display_order?: number;
  is_active?: boolean;
  color?: string;
  description?: string;
}

export interface CategoryUpdate {
  name?: string;
  display_order?: number;
  is_active?: boolean;
  color?: string;
  description?: string;
}

export class CategoryService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getCategories(language?: string): Promise<MenuCategory[]> {
    try {
      const url = language 
        ? `${this.baseUrl}/categories?language=${encodeURIComponent(language)}`
        : `${this.baseUrl}/categories`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  async createCategory(category: CategoryCreate): Promise<MenuCategory> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create category:', error);
      throw new Error('Failed to create category. Please try again.');
    }
  }

  async updateCategory(id: string, category: CategoryUpdate): Promise<MenuCategory> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update category:', error);
      throw new Error('Failed to update category. Please try again.');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw new Error('Failed to delete category. Please try again.');
    }
  }

  async reorderCategory(id: string, newOrder: number): Promise<MenuCategory> {
    try {
      const response = await fetch(`${this.baseUrl}/categories/${id}/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_order: newOrder }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to reorder category:', error);
      throw new Error('Failed to reorder category. Please try again.');
    }
  }
}

export const categoryService = new CategoryService();