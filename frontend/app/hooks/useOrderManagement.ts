import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderItem } from '../types/order.types';
import type { OrderFormData } from '../types/form.types';
import { orderService } from '../services/OrderService'; // Adjust path
import { menuItemService, type MenuItem } from '../services/MenuItemService'; // Adjust path
import type { IOrderService } from '~/types/service.types';
import { useSSE } from './useSSE';

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

  // SSE integration for real-time order updates
  const { status: sseStatus, connect, disconnect } = useSSE({
    autoConnect: true,
    onOrderCreated: useCallback((event) => {
      console.log('SSE: New order created', event);
      if (event.order_data) {
        const newOrder = transformOrderData(event.order_data);
        setOrders(prev => [newOrder, ...prev]);
      }
    }, []),
    onOrderStatusChanged: useCallback((event) => {
      console.log('SSE: Order status changed', event);
      if (event.order_data) {
        const updatedOrder = transformOrderData(event.order_data);
        setOrders(prev => prev.map(o => o.id === event.order_id ? updatedOrder : o));
      }
    }, []),
    onOrderDeleted: useCallback((event) => {
      console.log('SSE: Order deleted', event);
      if (event.order_id) {
        setOrders(prev => prev.filter(o => o.id !== event.order_id));
      }
    }, []),
    enableAudio: true
  });

  // Transform order data from SSE event to Order type
  const transformOrderData = useCallback((orderData: any): Order => {
    return {
      id: orderData.id || orderData.order_id,
      customerName: orderData.customer_name || '',
      customerPhone: orderData.phone || '',
      items: orderData.items || [],
      paymentMethod: orderData.payment_method || 'card',
      source: orderData.source || 'manual',
      notes: orderData.notes || '',
      status: orderData.status as OrderStatus || 'Nieuw',
      timestamp: orderData.created_at || new Date().toISOString(),
      total: orderData.items ? orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) : 0,
      requestedReadyTime: orderData.time_slot ? new Date(orderData.time_slot) : undefined
    };
  }, []);

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
    isWebSocketConnected: sseStatus.connected,
    sseStatus,
    sseConnect: connect,
    sseDisconnect: disconnect,
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