import React from 'react';
import { Container, Title, Text, Card, Group, Button, Stack, Timeline, Badge } from '@mantine/core';
import { CheckCircle, Clock, ChefHat, Bell } from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/formatting';
import type { Order } from '../../types/order.types';

interface KioskConfirmationViewProps {
  order: Order;
  onStartNewOrder: () => void;
}

export const KioskConfirmationView: React.FC<KioskConfirmationViewProps> = ({
  order,
  onStartNewOrder,
}) => {
  return (
    <Container size="sm" p="md" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Stack align="center" gap="xl" py="xl">
        <CheckCircle size={80} color="#51cf66" />
        
        <Card shadow="lg" padding="xl" radius="md" w="100%">
          <Stack align="center" mb="xl">
            <Title order={1} c="green">Order Confirmed!</Title>
            <Text size="xl" fw={600}>Order #{order.orderNumber}</Text>
            <Text c="dimmed">Thank you, {order.customerName}</Text>
          </Stack>

          <Card withBorder p="md" mb="lg" bg="blue.0">
            <Group justify="center">
              <Clock size={24} color="#1971c2" />
              <Stack gap={0} align="center">
                <Text fw={600} c="blue">Estimated Ready Time</Text>
                <Text size="lg" fw={700} c="blue">
                  {order.requestedReadyTime 
                    ? order.requestedReadyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : `${order.estimatedTime} minutes`
                  }
                </Text>
              </Stack>
            </Group>
          </Card>

          <Timeline active={0} bulletSize={24} lineWidth={2} color="blue">
            <Timeline.Item bullet={<Bell size={12} />} title="Order Received">
              <Text c="dimmed" size="sm">
                Your order has been confirmed and sent to the kitchen
              </Text>
            </Timeline.Item>
            <Timeline.Item bullet={<ChefHat size={12} />} title="Preparing">
              <Text c="dimmed" size="sm">
                Our chefs are preparing your delicious meal
              </Text>
            </Timeline.Item>
            <Timeline.Item bullet={<CheckCircle size={12} />} title="Ready for Pickup">
              <Text c="dimmed" size="sm">
                You'll be notified when your order is ready
              </Text>
            </Timeline.Item>
          </Timeline>

          <Card withBorder mt="lg" p="md">
            <Text fw={600} mb="sm">Order Details</Text>
            {order.items.map((item, index) => (
              <Group key={index} justify="space-between" mb="xs">
                <Text>{item.quantity}x {item.name}</Text>
                <Text>{formatCurrency(item.price * item.quantity)}</Text>
              </Group>
            ))}
            <Group justify="space-between" pt="sm" style={{ borderTop: '1px solid #dee2e6' }}>
              <Text fw={700}>Total</Text>
              <Text fw={700}>{formatCurrency(order.total)}</Text>
            </Group>
          </Card>

          <Group justify="center" mt="xl">
            <Button size="lg" onClick={onStartNewOrder}>
              Place Another Order
            </Button>
          </Group>

          <Text size="sm" c="dimmed" ta="center" mt="md">
            Please keep this order number for reference.<br />
            You can pick up your order at the counter when ready.
          </Text>
        </Card>
      </Stack>
    </Container>
  );
};