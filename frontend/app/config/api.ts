// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://api.yourdomain.com' 
    : 'http://localhost:8000',
  
  // Toggle between local mock service and real API
  USE_API: true,  // Set to false to use local service for development
  
  // API endpoints
  ENDPOINTS: {
    ORDERS: '/orders',
    MENU: '/menu',
    RESERVATIONS: '/reservations',
    PAYMENTS: '/payments',
    KDS: '/kds'
  }
} as const;

export default API_CONFIG;