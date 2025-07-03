import React, { useState } from 'react';
import { Grid, Card, Image, Text, Button, Group, Badge, NumberInput, Container, Title, Box, ActionIcon } from '@mantine/core';
import { ShoppingCart, Plus, Minus, ArrowLeft } from 'lucide-react';
import type { OrderItem } from '../../types/order.types';
import { formatCurrency } from '../../utils/formatting';
import { MENU_ITEMS } from '../../config/constants';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description?: string;
  allergens?: string[];
  dietary?: string[];
}

interface KioskMenuViewProps {
  cart: OrderItem[];
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onUpdateCartItem: (index: number, quantity: number) => void;
  onRemoveFromCart: (index: number) => void;
  onProceedToCheckout: () => void;
  onGoBack: () => void;
  language: string;
}

const menuItems: MenuItem[] = MENU_ITEMS.map((item, index) => ({
  id: `item-${index}`,
  name: item.name,
  price: item.price,
  category: item.category,
  image: `/images/menu/${item.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  description: `Delicious ${item.name.toLowerCase()} prepared fresh daily`,
  allergens: ['gluten', 'dairy'],
  dietary: item.category === 'Main Course' ? ['spicy'] : ['vegetarian'],
}));

export const KioskMenuView: React.FC<KioskMenuViewProps> = ({
  cart,
  onAddToCart,
  onUpdateCartItem,
  onRemoveFromCart,
  onProceedToCheckout,
  onGoBack,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(0, quantity) }));
  };

  const handleAddToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    onAddToCart(item, quantity);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  return (
    <Container size="xl" p="md">
      <Group justify="space-between" mb="lg">
        <Group>
          <ActionIcon size="lg" onClick={onGoBack}>
            <ArrowLeft size={20} />
          </ActionIcon>
          <Title order={2}>Our Menu</Title>
        </Group>
        
        <Button
          leftSection={<ShoppingCart size={18} />}
          onClick={onProceedToCheckout}
          size="lg"
          disabled={cartItemCount === 0}
        >
          Cart ({cartItemCount}) - {formatCurrency(cartTotal)}
        </Button>
      </Group>

      {/* Category Filter */}
      <Group mb="xl" justify="center">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'filled' : 'outline'}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </Group>

      {/* Menu Items Grid */}
      <Grid>
        {filteredItems.map((item) => (
          <Grid.Col key={item.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card shadow="md" padding="lg" radius="md" h="100%">
              <Card.Section>
                <Image
                  src={item.image}
                  height={160}
                  alt={item.name}
                  fallbackSrc="https://via.placeholder.com/300x160?text=Menu+Item"
                />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={500} size="lg">{item.name}</Text>
                <Text fw={700} c="blue">{formatCurrency(item.price)}</Text>
              </Group>

              <Text size="sm" c="dimmed" mb="md" lineClamp={2}>
                {item.description}
              </Text>

              <Group mb="md">
                {item.dietary?.map(diet => (
                  <Badge key={diet} size="xs" variant="light" color="green">
                    {diet}
                  </Badge>
                ))}
              </Group>

              <Group>
                <NumberInput
                  value={quantities[item.id] || 1}
                  onChange={(value) => handleQuantityChange(item.id, Number(value))}
                  min={1}
                  max={10}
                  w={80}
                />
                <Button
                  flex={1}
                  onClick={() => handleAddToCart(item)}
                  leftSection={<Plus size={16} />}
                >
                  Add
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      {/* Floating Cart Summary */}
      {cartItemCount > 0 && (
        <Box
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            minWidth: 250,
          }}
        >
          <Text fw={500} mb="xs">Cart Summary</Text>
          {cart.map((item, index) => (
            <Group key={index} justify="space-between" mb="xs">
              <Text size="sm">{item.quantity}x {item.name}</Text>
              <Group gap="xs">
                <ActionIcon size="xs" onClick={() => onUpdateCartItem(index, item.quantity - 1)}>
                  <Minus size={12} />
                </ActionIcon>
                <Text size="sm">{formatCurrency(item.price * item.quantity)}</Text>
                <ActionIcon size="xs" onClick={() => onRemoveFromCart(index)}>
                  ×
                </ActionIcon>
              </Group>
            </Group>
          ))}
          <Button fullWidth mt="sm" onClick={onProceedToCheckout}>
            Checkout - {formatCurrency(cartTotal)}
          </Button>
        </Box>
      )}
    </Container>
  );
};