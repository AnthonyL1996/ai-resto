import { API_CONFIG } from '../config/api';

export interface TranslationData {
  translations: Record<string, { name: string; description: string }>;
}

export class TranslationService {
  private baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async updateMenuItemTranslations(itemId: string, translations: Record<string, { name: string; description: string }>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/translations/menu-item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update menu item translations:', error);
      throw new Error('Failed to update translations. Please try again.');
    }
  }

  async updateCategoryTranslations(categoryId: string, translations: Record<string, { name: string; description: string }>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/translations/category/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to update category translations:', error);
      throw new Error('Failed to update translations. Please try again.');
    }
  }
}

export const translationService = new TranslationService();