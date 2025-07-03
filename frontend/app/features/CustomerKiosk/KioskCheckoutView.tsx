import React, { useState } from 'react';
import { Container, Title, Grid, Card, Text, Button, Group, Divider, Stack, TextInput, Select, Radio, Box, ActionIcon } from '@mantine/core';
import { ArrowLeft, CreditCard, Banknote, Calendar, Clock } from 'lucide-react';
import { DateTimePicker } from '@mantine/dates';
import type { OrderItem, PaymentMethod } from '../../types/order.types';
import { formatCurrency } from '../../utils/formatting';

interface KioskCheckoutViewProps {
  cart: OrderItem[];
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone?: string;
    paymentMethod: PaymentMethod;
    pickupTime?: Date;
    notes?: string;
  }) => void;
  onGoBack: () => void;
}

export const KioskCheckoutView: React.FC<KioskCheckoutViewProps> = ({
  cart,
  onPlaceOrder,
  onGoBack,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [pickupTime, setPickupTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.21; // Belgian VAT
  const total = subtotal + tax;

  const handleSubmit = () => {
    if (!customerName.trim()) return;
    
    onPlaceOrder({
      customerName,
      customerPhone: customerPhone || undefined,
      paymentMethod,
      pickupTime: pickupTime || undefined,
      notes: notes || undefined,
    });
  };

  const generateQuickPickupTimes = () => {
    const times = [];
    const now = new Date();
    for (let i = 1; i <= 6; i++) {
      const time = new Date(now.getTime() + (i * 15 * 60000)); // 15-minute intervals
      times.push(time);
    }
    return times;
  };

  return (
    <Container size="lg" p="md">
      <Group mb="lg">
        <ActionIcon size="lg" onClick={onGoBack}>
          <ArrowLeft size={20} />
        </ActionIcon>
        <Title order={2}>Checkout</Title>
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card shadow="sm" padding="lg" radius="md" mb="md">
            <Title order={3} mb="md">Customer Information</Title>
            <Stack>
              <TextInput
                label="Name"
                placeholder="Enter your name"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.currentTarget.value)}
                size="lg"
              />
              <TextInput
                label="Phone Number (Optional)"
                placeholder="For order updates"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.currentTarget.value)}
                size="lg"
              />
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" mb="md">
            <Title order={3} mb="md">Pickup Time</Title>
            <Stack>
              <Text size="sm" c="dimmed">When would you like to pick up your order?</Text>
              
              <Group>
                {generateQuickPickupTimes().map((time, index) => (
                  <Button
                    key={index}
                    variant={pickupTime?.getTime() === time.getTime() ? 'filled' : 'outline'}
                    onClick={() => setPickupTime(time)}
                    leftSection={<Clock size={16} />}
                  >
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Button>
                ))}
              </Group>
              
              <DateTimePicker
                label="Or choose custom time"
                placeholder="Pick date and time"
                value={pickupTime}
                onChange={setPickupTime}
                leftSection={<Calendar size={16} />}
                minDate={new Date()}
                size="lg"
              />
            </Stack>
          </Card>

          <Card shadow="sm" padding="lg" radius="md" mb="md">
            <Title order={3} mb="md">Payment Method</Title>
            <Radio.Group
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value as PaymentMethod)}
            >
              <Stack>
                <Radio
                  value="card"
                  label={
                    <Group>
                      <CreditCard size={20} />
                      <Text>Card Payment</Text>
                    </Group>
                  }
                />
                <Radio
                  value="cash"
                  label={
                    <Group>
                      <Banknote size={20} />
                      <Text>Cash Payment</Text>
                    </Group>
                  }
                />
              </Stack>
            </Radio.Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card shadow="sm" padding="lg" radius="md" pos="sticky" style={{ top: 20 }}>
            <Title order={3} mb="md">Order Summary</Title>
            
            <Stack gap="xs" mb="md">
              {cart.map((item, index) => (
                <Group key={index} justify="space-between">
                  <Box>
                    <Text fw={500}>{item.quantity}x {item.name}</Text>
                    {item.modifications.length > 0 && (
                      <Text size="xs" c="dimmed">
                        {item.modifications.join(', ')}
                      </Text>
                    )}
                  </Box>
                  <Text>{formatCurrency(item.price * item.quantity)}</Text>
                </Group>
              ))}
            </Stack>

            <Divider mb="md" />

            <Group justify="space-between" mb="xs">
              <Text>Subtotal</Text>
              <Text>{formatCurrency(subtotal)}</Text>
            </Group>
            <Group justify="space-between" mb="md">
              <Text>Tax (21%)</Text>
              <Text>{formatCurrency(tax)}</Text>
            </Group>
            
            <Divider mb="md" />
            
            <Group justify="space-between" mb="lg">
              <Text fw={700} size="lg">Total</Text>
              <Text fw={700} size="lg">{formatCurrency(total)}</Text>
            </Group>

            <Button
              fullWidth
              size="lg"
              onClick={handleSubmit}
              disabled={!customerName.trim()}
            >
              Place Order
            </Button>
            
            <Text size="xs" c="dimmed" ta="center" mt="sm">
              Estimated preparation time: 15-25 minutes
            </Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Container>
  );
};