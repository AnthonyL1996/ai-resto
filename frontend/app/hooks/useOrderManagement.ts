import { useState, useEffect, useCallback } from 'react';
import type { Order, OrderStatus, OrderItem } from '../types/order.types';
import type { OrderFormData } from '../types/form.types';
import { orderService } from '../services/OrderService'; // Adjust path
import { menuItemService, type MenuItem } from '../services/MenuItemService'; // Adjust path
import type { IOrderService } from '~/types/service.types';

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderForm, setOrderForm] = useState<OrderFormData>(initialOrderFormData);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

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
  const addItemToForm = useCallback((menuItemName: string) => {
    const menuItem = menuItems.find(m => m.name === menuItemName);
    if (!menuItem) return;

    setOrderForm(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.name === menuItem.name);
      let newItems: OrderItem[];
      if (existingItemIndex >= 0) {
        newItems = prev.items.map((item, index) =>
          index === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...prev.items, { 
          id: crypto.randomUUID(),
          name: menuItem.name, 
          quantity: 1, 
          modifications: [], 
          price: menuItem.price,
          category: menuItem.category,
          preparationTime: menuItem.prep_time,
          dietaryOptions: [],
          allergens: [],
          available: menuItem.is_available
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
    stats: {
        totalOrders: orders.length,
        activeOrders: orders.filter(o => o.status !== 'Voltooid').length,
        completedToday: orders.filter(o => o.status === 'Voltooid' /* && isToday(o.timestamp) */).length, // Add date check for "today"
        totalRevenue: orders.filter(o => o.status === 'Voltooid').reduce((sum, o) => sum + o.total, 0)
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