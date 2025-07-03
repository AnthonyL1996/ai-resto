// routes/kiosk.tsx
import React, { useState, useEffect } from 'react';
import { AppShell, Container, Stack, Group, Text, Button, Badge, Card, Grid, Box, TextInput, Select, Textarea, Notification } from '@mantine/core';
import { ShoppingCart, ArrowLeft, Plus, Minus, X, Check, CreditCard, Clock, User, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatting';
import { menuItemService, type MenuItem } from '../services/MenuItemService';
import { orderService } from '../services/OrderServiceFactory';
import type { OrderItem, Allergen, DietaryOption } from '../types/order.types';
import type { OrderFormData } from '../types/form.types';
import '../styles/kiosk.css';

interface KioskOrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  allergens: Allergen[];
  dietary_options: DietaryOption[];
  modifications?: string[];
}

const getAllergenDisplayName = (allergen: string): string => {
  const allergenMap: Record<string, string> = {
    'gluten': 'Gluten',
    'lactose': 'Lactose', 
    'nuts': 'Nuts',
    'soy': 'Soy',
    'egg': 'Egg',
    'fish': 'Fish',
    'shellfish': 'Shellfish'
  };
  return allergenMap[allergen] || allergen;
};

const getDietaryDisplayName = (option: string): string => {
  const dietaryMap: Record<string, string> = {
    'vegetarian': 'Vegetarian',
    'vegan': 'Vegan', 
    'glutenFree': 'Gluten Free'
  };
  return dietaryMap[option] || option;
};

export default function KioskPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<KioskOrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [currentStep, setCurrentStep] = useState<'menu' | 'checkout' | 'confirmation'>('menu');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  
  // Checkout form data
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [pickupTime, setPickupTime] = useState<string>('asap');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Confirmation
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<number>(15);

  // Unique categories from menu items
  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];

  useEffect(() => {
    loadMenuItems();
  }, [i18n.language]);

  const loadMenuItems = async () => {
    try {
      setIsLoading(true);
      const langMap: Record<string, string> = {
        'en': 'en',
        'nl': 'nl', 
        'fr': 'fr',
        'zh': 'zh-HK',
        'zh-HK': 'zh-HK'
      };
      
      const currentLang = i18n.language;
      const apiLangCode = langMap[currentLang] || currentLang;
      
      const items = await menuItemService.getMenuItems(undefined, apiLangCode);
      setMenuItems(items.filter(item => item.is_available));
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMenuItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const addToCart = (menuItem: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === menuItem.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          id: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          price: menuItem.price,
          allergens: menuItem.allergens || [],
          dietary_options: menuItem.dietary_options || []
        }];
      }
    });
  };

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCart(prev => prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const submitOrder = async () => {
    setIsSubmittingOrder(true);
    try {
      // Convert cart items to order items format
      const orderItems: OrderItem[] = cart.map(cartItem => {
        const menuItem = menuItems.find(m => m.id === cartItem.id);
        return {
          id: cartItem.id,
          name: cartItem.name,
          quantity: cartItem.quantity,
          modifications: cartItem.modifications || [],
          price: cartItem.price,
          category: menuItem?.category || 'main',
          preparationTime: menuItem?.prep_time || 15,
          dietaryOptions: cartItem.dietary_options || [],
          allergens: cartItem.allergens || [],
          available: true,
          imageUrl: menuItem?.image_url,
          description: menuItem?.description
        };
      });

      // Create order form data
      const orderFormData: OrderFormData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod: paymentMethod,
        source: 'kiosk',
        notes: specialInstructions.trim(),
        items: orderItems,
        requestedReadyTime: pickupTime === 'asap' ? undefined : new Date(Date.now() + parseInt(pickupTime) * 60 * 1000)
      };

      // Submit order to backend
      const createdOrder = await orderService.createOrder(orderFormData, orderItems);
      
      // Set order details for confirmation
      setOrderNumber(createdOrder.orderNumber.toString());
      setEstimatedTime(createdOrder.estimatedTime);
      setCurrentStep('confirmation');
      
      // Clear cart after successful order
      setCart([]);
      
      console.log('Order created successfully:', createdOrder);
      
    } catch (error) {
      console.error('Failed to submit order:', error);
      // Handle error - show notification
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const resetKiosk = () => {
    setCart([]);
    setCurrentStep('menu');
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('card');
    setPickupTime('asap');
    setSpecialInstructions('');
    setSelectedCategory('all');
    setIsSubmittingOrder(false);
  };

  if (isLoading) {
    return (
      <AppShell>
        <AppShell.Main>
          <Container size="xl" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text size="xl">Loading menu...</Text>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  if (currentStep === 'menu') {
    return (
      <AppShell styles={{ main: { padding: 0, height: '100vh', overflow: 'hidden' } }}>
        <AppShell.Main className="kiosk-interface" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Header */}
          <Box style={{ 
            padding: '24px', 
            borderBottom: '2px solid var(--mantine-color-gray-2)',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Group justify="space-between" align="center">
              <Text size="2xl" fw={700} c="blue">Restaurant Kiosk</Text>
              <Button
                size="xl"
                leftSection={<ShoppingCart size={24} />}
                onClick={() => setShowCart(true)}
                disabled={cart.length === 0}
                variant="filled"
                styles={{
                  root: {
                    minHeight: '60px',
                    fontSize: '18px',
                    minWidth: '200px'
                  }
                }}
              >
                Cart ({getTotalItems()}) - {formatCurrency(getTotalPrice())}
              </Button>
            </Group>
          </Box>

          {/* Category Filters */}
          <Box style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid var(--mantine-color-gray-2)',
            backgroundColor: 'var(--mantine-color-gray-0)'
          }}>
            <Group gap="md">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'filled' : 'outline'}
                  size="lg"
                  onClick={() => setSelectedCategory(category)}
                  styles={{
                    root: {
                      minHeight: '50px',
                      fontSize: '16px',
                      textTransform: 'capitalize'
                    }
                  }}
                >
                  {category === 'all' ? 'All Items' : category}
                </Button>
              ))}
            </Group>
          </Box>

          {/* Menu Items Grid */}
          <Box style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            <Grid gutter="xl">
              {filteredMenuItems.map((item) => (
                <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3, xl: 3 }}>
                  <Card
                    withBorder
                    shadow="md"
                    radius="lg"
                    style={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      minHeight: '320px',
                      touchAction: 'manipulation' // Better touch performance
                    }}
                    styles={{
                      root: {
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
                        },
                        '&:active': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                        }
                      }
                    }}
                  >
                    <Stack gap="md" style={{ height: '100%' }}>
                      {/* Item Image Placeholder */}
                      <Box
                        style={{
                          height: '120px',
                          backgroundColor: 'var(--mantine-color-gray-1)',
                          borderRadius: 'var(--mantine-radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text c="dimmed">📷</Text>
                      </Box>

                      {/* Item Info */}
                      <Box style={{ flex: 1 }}>
                        <Text fw={700} size="lg" mb="xs" lineClamp={2}>{item.name}</Text>
                        <Text size="xl" fw={700} c="blue" mb="sm">{formatCurrency(item.price)}</Text>
                        
                        {item.description && (
                          <Text size="sm" c="dimmed" mb="sm" lineClamp={2}>{item.description}</Text>
                        )}

                        {/* Allergen Information */}
                        {(item.allergens && item.allergens.length > 0) && (
                          <Box mb="sm">
                            <Text size="xs" c="dimmed" mb="xs" fw={500}>⚠️ Contains:</Text>
                            <Group gap="xs">
                              {item.allergens.map((allergen) => (
                                <Badge
                                  key={allergen}
                                  size="sm"
                                  color="red"
                                  variant="filled"
                                  styles={{ root: { fontSize: '10px' } }}
                                >
                                  {getAllergenDisplayName(allergen)}
                                </Badge>
                              ))}
                            </Group>
                          </Box>
                        )}

                        {/* Dietary Options */}
                        {(item.dietary_options && item.dietary_options.length > 0) && (
                          <Box mb="sm">
                            <Text size="xs" c="dimmed" mb="xs" fw={500}>🌱 Suitable for:</Text>
                            <Group gap="xs">
                              {item.dietary_options.map((option) => (
                                <Badge
                                  key={option}
                                  size="sm"
                                  color="green"
                                  variant="filled"
                                  styles={{ root: { fontSize: '10px' } }}
                                >
                                  {getDietaryDisplayName(option)}
                                </Badge>
                              ))}
                            </Group>
                          </Box>
                        )}
                      </Box>

                      {/* Add to Cart Button */}
                      <Button
                        size="xl"
                        fullWidth
                        leftSection={<Plus size={20} />}
                        onClick={() => addToCart(item)}
                        variant="filled"
                        styles={{
                          root: {
                            minHeight: '60px',
                            fontSize: '18px',
                            fontWeight: 600,
                            touchAction: 'manipulation',
                            '&:active': {
                              transform: 'scale(0.98)'
                            }
                          }
                        }}
                      >
                        Add to Cart
                      </Button>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          </Box>
        </AppShell.Main>

        {/* Cart Modal/Sidebar */}
        {showCart && (
          <Box
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '500px',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Cart Header */}
            <Box style={{ 
              padding: '24px', 
              borderBottom: '2px solid var(--mantine-color-gray-2)',
              backgroundColor: 'var(--mantine-color-blue-0)'
            }}>
              <Group justify="space-between" align="center">
                <Text size="xl" fw={700}>Your Order</Text>
                <Button
                  variant="subtle"
                  size="lg"
                  onClick={() => setShowCart(false)}
                  leftSection={<X size={20} />}
                >
                  Close
                </Button>
              </Group>
            </Box>

            {/* Cart Items */}
            <Box style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {cart.length === 0 ? (
                <Text ta="center" c="dimmed" size="lg" mt="xl">
                  Your cart is empty
                </Text>
              ) : (
                <Stack gap="md">
                  {cart.map((item) => (
                    <Card key={item.id} withBorder p="lg">
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Box style={{ flex: 1 }}>
                          <Text fw={600} size="lg" mb="xs">{item.name}</Text>
                          <Text size="md" c="blue" fw={600}>{formatCurrency(item.price)} each</Text>
                        </Box>
                        
                        <Stack gap="xs" align="center">
                          <Group gap="xs">
                            <Button
                              size="md"
                              variant="outline"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                              styles={{ root: { minWidth: '50px', minHeight: '50px' } }}
                            >
                              <Minus size={16} />
                            </Button>
                            <Text fw={700} size="xl" style={{ minWidth: '40px', textAlign: 'center' }}>
                              {item.quantity}
                            </Text>
                            <Button
                              size="md"
                              variant="outline"
                              onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                              styles={{ root: { minWidth: '50px', minHeight: '50px' } }}
                            >
                              <Plus size={16} />
                            </Button>
                          </Group>
                          <Text fw={700} size="lg" c="blue">
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <Box style={{ 
                padding: '24px', 
                borderTop: '2px solid var(--mantine-color-gray-2)',
                backgroundColor: 'var(--mantine-color-gray-0)'
              }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="xl" fw={700}>Total:</Text>
                    <Text size="2xl" fw={700} c="blue">{formatCurrency(getTotalPrice())}</Text>
                  </Group>
                  <Button
                    size="xl"
                    fullWidth
                    leftSection={<Check size={24} />}
                    onClick={() => {
                      setShowCart(false);
                      setCurrentStep('checkout');
                    }}
                    styles={{
                      root: {
                        minHeight: '70px',
                        fontSize: '20px'
                      }
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}
      </AppShell>
    );
  }

  // Checkout Step
  if (currentStep === 'checkout') {
    return (
      <AppShell styles={{ main: { padding: 0, height: '100vh', overflow: 'hidden' } }}>
        <AppShell.Main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Checkout Header */}
          <Box style={{ 
            padding: '24px', 
            borderBottom: '2px solid var(--mantine-color-gray-2)',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Group justify="space-between" align="center">
              <Group>
                <Button
                  variant="subtle"
                  size="lg"
                  leftSection={<ArrowLeft size={20} />}
                  onClick={() => setCurrentStep('menu')}
                >
                  Back to Menu
                </Button>
                <Text size="2xl" fw={700} c="blue">Checkout</Text>
              </Group>
              <Text size="xl" fw={600}>
                Total: {formatCurrency(getTotalPrice())}
              </Text>
            </Group>
          </Box>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Side - Customer Information Form */}
            <Box style={{ 
              flex: '1', 
              padding: '32px', 
              overflow: 'auto',
              backgroundColor: 'var(--mantine-color-gray-0)'
            }}>
              <Stack gap="xl">
                <Text size="xl" fw={700} mb="md">Customer Information</Text>
                
                <TextInput
                  label="Name"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.currentTarget.value)}
                  leftSection={<User size={20} />}
                  size="xl"
                  required
                  styles={{
                    input: { fontSize: '18px', minHeight: '60px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />

                <TextInput
                  label="Phone Number"
                  placeholder="Enter your phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.currentTarget.value)}
                  leftSection={<Phone size={20} />}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '60px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />

                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(value) => setPaymentMethod(value as 'card' | 'cash')}
                  data={[
                    { value: 'card', label: '💳 Card Payment' },
                    { value: 'cash', label: '💵 Cash Payment' }
                  ]}
                  leftSection={<CreditCard size={20} />}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '60px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />

                <Select
                  label="Pickup Time"
                  value={pickupTime}
                  onChange={(value) => setPickupTime(value || 'asap')}
                  data={[
                    { value: 'asap', label: 'As soon as possible' },
                    { value: '15', label: 'In 15 minutes' },
                    { value: '30', label: 'In 30 minutes' },
                    { value: '45', label: 'In 45 minutes' },
                    { value: '60', label: 'In 1 hour' }
                  ]}
                  leftSection={<Clock size={20} />}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '60px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />

                <Textarea
                  label="Special Instructions (Optional)"
                  placeholder="Any special requests or modifications..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.currentTarget.value)}
                  rows={4}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '100px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />
              </Stack>
            </Box>

            {/* Right Side - Order Summary */}
            <Box style={{ 
              width: '500px', 
              padding: '32px',
              backgroundColor: 'white',
              borderLeft: '2px solid var(--mantine-color-gray-2)',
              overflow: 'auto'
            }}>
              <Stack gap="lg">
                <Text size="xl" fw={700} mb="md">Order Summary</Text>
                
                {cart.map((item) => (
                  <Card key={item.id} withBorder p="md">
                    <Group justify="space-between" align="flex-start">
                      <Box>
                        <Text fw={600} size="md">{item.name}</Text>
                        <Text size="sm" c="dimmed">
                          {formatCurrency(item.price)} × {item.quantity}
                        </Text>
                      </Box>
                      <Text fw={600} size="md">
                        {formatCurrency(item.price * item.quantity)}
                      </Text>
                    </Group>
                  </Card>
                ))}

                <Card withBorder p="lg" style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                  <Group justify="space-between">
                    <Text size="xl" fw={700}>Total:</Text>
                    <Text size="xl" fw={700} c="blue">{formatCurrency(getTotalPrice())}</Text>
                  </Group>
                </Card>

                <Button
                  size="xl"
                  fullWidth
                  onClick={submitOrder}
                  disabled={!customerName.trim() || isSubmittingOrder}
                  loading={isSubmittingOrder}
                  leftSection={!isSubmittingOrder ? <Check size={24} /> : undefined}
                  styles={{
                    root: {
                      minHeight: '80px',
                      fontSize: '20px'
                    }
                  }}
                >
                  {isSubmittingOrder ? 'Placing Order...' : 'Place Order'}
                </Button>
              </Stack>
            </Box>
          </div>
        </AppShell.Main>
      </AppShell>
    );
  }

  // Confirmation Step
  if (currentStep === 'confirmation') {
    return (
      <AppShell styles={{ main: { padding: 0, height: '100vh', overflow: 'hidden' } }}>
        <AppShell.Main style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'var(--mantine-color-green-0)'
        }}>
          <Container size="md">
            <Card 
              shadow="xl" 
              radius="xl" 
              p="3xl"
              style={{ textAlign: 'center', backgroundColor: 'white' }}
            >
              <Stack gap="xl">
                <div style={{ fontSize: '80px' }}>✅</div>
                
                <Text size="3xl" fw={700} c="green">
                  Order Confirmed!
                </Text>
                
                <Text size="2xl" fw={600}>
                  Order #{orderNumber}
                </Text>
                
                <Box>
                  <Text size="lg" c="dimmed" mb="sm">
                    Estimated preparation time:
                  </Text>
                  <Text size="2xl" fw={700} c="blue">
                    {estimatedTime} minutes
                  </Text>
                </Box>

                <Card withBorder p="lg" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                  <Text size="md" fw={500}>
                    Thank you, {customerName}!
                  </Text>
                  {customerPhone && (
                    <Text size="sm" c="dimmed" mt="xs">
                      We'll send updates to {customerPhone}
                    </Text>
                  )}
                </Card>

                <Group justify="center" gap="lg" mt="xl">
                  <Button
                    size="xl"
                    variant="outline"
                    onClick={resetKiosk}
                    styles={{
                      root: {
                        minHeight: '70px',
                        fontSize: '18px',
                        minWidth: '200px'
                      }
                    }}
                  >
                    Start New Order
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Container>
        </AppShell.Main>
      </AppShell>
    );
  }

  return null;
}