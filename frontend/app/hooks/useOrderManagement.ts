import { useState, useEffect, useCallback, useRef } from 'react';
import type { Order, OrderStatus, OrderItem, PaymentMethod, OrderType, OrderSource, BackendOrderData } from '../types/order.types';
import type { OrderFormData } from '../types/form.types';
import { orderService } from '../services/OrderService'; // Adjust path
import { menuItemService, type MenuItem } from '../services/MenuItemService'; // Adjust path
import type { IOrderService } from '~/types/service.types';
import { useWebSocket } from './useWebSocket';

const initialOrderFormData: OrderFormData = {
  customerName: '',
  customerPhone: '',
  paymentMethod: 'card',
  source: 'manual',
  notes: '',
  items: [],
  requestedReadyTime: undefined,
};

export function useOrderManagement(injectedOrderService: IOrderService = orderService) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormData>(initialOrderFormData);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Debounce refs for preventing excessive updates
  const updateTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Helper function to map backend status to frontend status
  const mapBackendStatusToFrontend = useCallback((backendStatus: string): OrderStatus => {
    const statusMapping: { [key: string]: OrderStatus } = {
      'new': 'Nieuw',
      'received': 'Nieuw',
      'preparing': 'In bereiding',
      'ready': 'Klaar',
      'completed': 'Voltooid',
      'cancelled': 'Geannuleerd'
    };
    
    return statusMapping[backendStatus] || 'Nieuw';
  }, []);

  // Helper function to convert backend order data to frontend format
  const convertBackendOrderToFrontend = useCallback((orderData: BackendOrderData): Order => {
    return {
      id: orderData.id,
      orderNumber: orderData.order_number,
      timestamp: new Date(orderData.created_at),
      status: mapBackendStatusToFrontend(orderData.status),
      customerName: orderData.customer_name,
      customerPhone: orderData.phone,
      items: orderData.items,
      paymentMethod: orderData.payment_method as PaymentMethod,
      orderType: 'pickup',
      total: orderData.total,
      estimatedTime: 15,
      source: orderData.source as OrderSource,
      notes: orderData.notes,
      requestedReadyTime: orderData.time_slot ? new Date(orderData.time_slot) : undefined,
      btwPercentage: 21,
      language: 'NL'
    };
  }, [mapBackendStatusToFrontend]);

  // WebSocket handlers - optimized for non-blocking updates
  const handleNewOrder = useCallback((orderData: BackendOrderData) => {
    console.log('New order received:', orderData);
    
    // Use requestIdleCallback for non-blocking processing
    const processOrder = () => {
      try {
        // Convert the order data to match frontend Order type
        const newOrder = convertBackendOrderToFrontend(orderData);
        
        // Add new order to the beginning of the list
        setOrders(prevOrders => {
          const existingIndex = prevOrders.findIndex(order => order.id === newOrder.id);
          if (existingIndex !== -1) {
            // Update existing order
            return prevOrders.map((order, index) => 
              index === existingIndex ? newOrder : order
            );
          } else {
            // Add new order
            return [newOrder, ...prevOrders];
          }
        });
      } catch (error) {
        console.error('Error processing new order:', error);
      }
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processOrder, { timeout: 100 });
    } else {
      setTimeout(processOrder, 0);
    }
  }, [convertBackendOrderToFrontend]);

  const handleOrderUpdate = useCallback((orderData: BackendOrderData) => {
    console.log('Order update received:', orderData);
    
    // Use requestIdleCallback for non-blocking processing
    const processOrderUpdate = () => {
      try {
        // Convert the order data to match frontend Order type
        const updatedOrder = convertBackendOrderToFrontend(orderData);
        
        // Update existing order
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      } catch (error) {
        console.error('Error processing order update:', error);
      }
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processOrderUpdate, { timeout: 100 });
    } else {
      setTimeout(processOrderUpdate, 0);
    }
  }, [convertBackendOrderToFrontend]);

  const handleOrderDeleted = useCallback((orderData: BackendOrderData) => {
    console.log('Order deleted:', orderData);
    
    // Use requestIdleCallback for non-blocking processing
    const processOrderDeletion = () => {
      try {
        // Remove order from list
        setOrders(prevOrders => 
          prevOrders.filter(order => order.id !== orderData.id)
        );
      } catch (error) {
        console.error('Error processing order deletion:', error);
      }
    };
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(processOrderDeletion, { timeout: 50 });
    } else {
      setTimeout(processOrderDeletion, 0);
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('WebSocket message received:', message);
    
    // Debounce message handling to prevent UI flooding
    const orderId = message.data?.id || 'unknown';
    const debounceKey = `${message.type}_${orderId}`;
    
    // Clear existing timeout for this order
    const existingTimeout = updateTimeoutsRef.current.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new debounced timeout
    const timeout = setTimeout(() => {
      switch (message.type) {
        case 'new_order':
          handleNewOrder(message.data);
          break;
        case 'order_update':
        case 'order_status_update':
        case 'kds_status_update':
          handleOrderUpdate(message.data);
          break;
        case 'order_deleted':
          handleOrderDeleted(message.data);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
      updateTimeoutsRef.current.delete(debounceKey);
    }, 100); // Increased debounce to 100ms for better performance
    
    updateTimeoutsRef.current.set(debounceKey, timeout);
  }, [handleNewOrder, handleOrderUpdate, handleOrderDeleted]);

  // Initialize WebSocket connection
  const { isConnected: isWebSocketConnected, connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8000/ws',
    autoConnect: true,
    onMessage: handleWebSocketMessage,
    onConnect: () => console.log('WebSocket connected'),
    onDisconnect: () => console.log('WebSocket disconnected'),
    onError: (error) => console.error('WebSocket error:', error)
  });



  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const fetchedOrders = await injectedOrderService.getOrders();
        setOrders(fetchedOrders);
        setError(null);
      } catch (e) {
        setError("Failed to load orders.");
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
    loadMenuItems();
    
    // Cleanup timeouts on unmount
    return () => {
      updateTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      updateTimeoutsRef.current.clear();
    };
  }, [injectedOrderService]);

  const loadMenuItems = async (language?: string) => {
    try {
      const items = await menuItemService.getMenuItems(undefined, language);
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedOrders = await injectedOrderService.getOrders();
      setOrders(fetchedOrders);
      setError(null);
    } catch (e) {
      setError("Failed to refresh orders.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [injectedOrderService]);


  const resetOrderForm = useCallback(() => {
    setOrderForm(initialOrderFormData);
  }, []);

  const handleCreateOrder = useCallback(async () => {
    if (!orderForm.customerName || orderForm.items.length === 0) return null;
    try {
      const finalFormData = {
        ...orderForm,
        requestedReadyTime: orderForm.requestedReadyTime ? new Date(orderForm.requestedReadyTime) : undefined,
      };

      const newOrder = await injectedOrderService.createOrder(finalFormData, finalFormData.items);
      setOrders(prev => [newOrder, ...prev]); // Or refreshOrders()
      setIsModalOpen(false);
      resetOrderForm();
      return newOrder;
    } catch (e) {
      console.error("Failed to create order:", e);
      setError("Failed to create order.");
      return null;
    }
  }, [injectedOrderService, orderForm, resetOrderForm]);

  const handleUpdateOrder = useCallback(async () => {
    if (!editingOrder || !orderForm.customerName || orderForm.items.length === 0) return null;
    try {
        const finalFormData = {
        ...orderForm,
        requestedReadyTime: orderForm.requestedReadyTime ? new Date(orderForm.requestedReadyTime) : undefined,
      };
      const updated = await injectedOrderService.updateOrder(editingOrder.id, finalFormData, finalFormData.items);
      setOrders(prev => prev.map(o => (o.id === editingOrder.id ? updated : o))); // Or refreshOrders()
      setEditingOrder(null);
      setIsModalOpen(false);
      resetOrderForm();
      return updated;
    } catch (e) {
      console.error("Failed to update order:", e);
      setError("Failed to update order.");
      return null;
    }
  }, [injectedOrderService, editingOrder, orderForm, resetOrderForm]);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    try {
      await injectedOrderService.deleteOrder(orderId);
      setOrders(prev => prev.filter(order => order.id !== orderId)); // Or refreshOrders()
    } catch (e) {
      console.error("Failed to delete order:", e);
      setError("Failed to delete order.");
    }
  }, [injectedOrderService]);

  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updatedOrder = await injectedOrderService.updateOrderStatus(orderId, newStatus);
      if (updatedOrder) {
        setOrders(prev => prev.map(o => (o.id === orderId ? updatedOrder : o))); // Or refreshOrders()
      }
    } catch (e) {
      console.error("Failed to update order status:", e);
      setError("Failed to update order status.");
    }
  }, [injectedOrderService]);

  const handleStartEditOrder = useCallback((order: Order) => {
    setEditingOrder(order);
    setOrderForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone || '',
      paymentMethod: order.paymentMethod,
      source: order.source,
      notes: order.notes || '',
      items: [...order.items],
      requestedReadyTime: order.requestedReadyTime ? new Date(order.requestedReadyTime) : undefined,
    });
    setIsModalOpen(true);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingOrder(null);
    resetOrderForm();
    setIsModalOpen(true);
  }, [resetOrderForm]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingOrder(null);
    resetOrderForm();
  }, [resetOrderForm]);

  // Form item manipulations
  const addItemToForm = useCallback(async (menuItemName: string) => {
    // First try to find in current menuItems
    let menuItem = menuItems.find(m => m.name === menuItemName);
    
    // If not found, try to fetch fresh menu items
    if (!menuItem) {
      try {
        const freshMenuItems = await menuItemService.getMenuItems();
        menuItem = freshMenuItems.find(m => m.name === menuItemName);
        // Update the hook's menu items with fresh data
        setMenuItems(freshMenuItems);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
        return;
      }
    }
    
    if (!menuItem) {
      console.error('Menu item not found:', menuItemName);
      return;
    }

    setOrderForm(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.name === menuItem!.name);
      let newItems: OrderItem[];
      if (existingItemIndex >= 0) {
        newItems = prev.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...prev.items, { 
          id: crypto.randomUUID(),
          name: menuItem!.name, 
          quantity: 1, 
          modifications: [], 
          price: menuItem!.price,
          category: menuItem!.category,
          preparationTime: menuItem!.prep_time,
          dietaryOptions: menuItem!.dietary_options || [],
          allergens: menuItem!.allergens || [],
          available: menuItem!.is_available
        }];
      }
      return { ...prev, items: newItems };
    });
  }, [menuItems]);

  const removeItemFromForm = useCallback((index: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }, []);

  const updateItemQuantityInForm = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromForm(index);
      return;
    }
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, quantity } : item)),
    }));
  }, [removeItemFromForm]);

  const calculateTotal = useCallback((items: OrderItem[]) => {
    return items.reduce((total, item) => {
      // Get current price from menu items in case it was updated
      const currentMenuItem = menuItems.find(m => m.name === item.name);
      const price = currentMenuItem ? currentMenuItem.price : item.price;
      return total + (price * item.quantity);
    }, 0);
  }, [menuItems]);

  return {
    orders,
    isLoading,
    error,
    activeOrders: orders.filter(o => o.status !== 'Voltooid'),
    completedOrders: orders.filter(o => o.status === 'Voltooid'),
    orderForm,
    setOrderForm, // Expose directly if needed for complex field updates
    isModalOpen,
    editingOrder,
    isWebSocketConnected,
    stats: {
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status !== 'Voltooid').length,
        completedToday: orders.filter(o => {
          if (o.status !== 'Voltooid') return false;
          const orderDate = new Date(o.timestamp);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).length,
        totalRevenue: orders.filter(o => {
          if (o.status !== 'Voltooid') return false;
          const orderDate = new Date(o.timestamp);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).reduce((sum, o) => sum + o.total, 0)
    },
    createOrder: handleCreateOrder,
    updateOrder: handleUpdateOrder,
    deleteOrder: handleDeleteOrder,
    updateOrderStatus: handleStatusUpdate,
    addItemToOrderForm: addItemToForm,
    removeItemFromOrderForm: removeItemFromForm,
    updateItemQuantityInForm,
    calculateTotal,
    startEditOrder: handleStartEditOrder,
    openCreateModal: handleOpenCreateModal,
    closeModal: handleCloseModal,
    refreshOrders,
  };
}