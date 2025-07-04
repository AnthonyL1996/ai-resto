import React from 'react';
import { Card, Text, Badge, Button, Group, Stack, Avatar, Divider, Paper, ActionIcon, Box } from '@mantine/core';
import { Clock, Check, ChefHat, Printer, CalendarClock } from 'lucide-react';
import type { Order, OrderItem, OrderStatus } from '../../types/order.types'; // Adjust path
import { formatTime, formatCurrency, formatRequestedTime } from '../../utils/formatting'; // Adjust path
import { getStatusColor, getStatusText, getNextStatus } from '../../utils/statusHelpers'; // Adjust path

export interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: OrderStatus) => void;
  onPrint: (orderId: string) => void;
  // onEdit: (order: Order) => void; // If edit is initiated from card
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onStatusUpdate, onPrint }) => {
  console.log('OrderCard - Order status:', order.status);
  const nextStatus = getNextStatus(order.status);
  console.log('OrderCard - Next status:', nextStatus);

  const getActionButtonProps = (status: OrderStatus) => {
    const buttonConfig = {
      'Nieuw': { label: 'Start Cooking', icon: <ChefHat size={18} />, color: 'blue' },
      'In bereiding': { label: 'Mark Ready', icon: <Check size={18} />, color: 'green' },
      'Klaar': { label: 'Complete', icon: <Check size={18} />, color: 'gray' },
    };
    return buttonConfig[status as keyof typeof buttonConfig];
  };
  const actionButtonProps = nextStatus ? getActionButtonProps(order.status) : null;
  console.log('OrderCard - Action button props:', actionButtonProps);

  return (
    <Card shadow="md" padding="lg" radius="md" withBorder
      style={{
        borderColor: order.status === 'new' ? '#fa5252' : undefined, // Consider using theme colors
        borderWidth: order.status === 'new' ? 2 : 1,
        backgroundColor: order.status === 'new' ? '#fff5f5' : undefined, // Consider using theme colors
      }}>
        <Group justify="space-between" mb="md">
          <Group>
            <Avatar size="lg" radius="xl" color={getStatusColor(order.status)}>{/* Or theme color */}
                #{order.orderNumber}
            </Avatar>
            <Box>
              <Text fw={600} size="lg">Order #{order.orderNumber}</Text>
              <Text size="sm" c="dimmed">{order.customerName}</Text>
              {order.customerPhone && <Text size="xs" c="dimmed">{order.customerPhone}</Text>}
            </Box>
          </Group>
          <Badge color={getStatusColor(order.status)} variant="light">
            {getStatusText(order.status)}
          </Badge>
        </Group>

              {order.requestedReadyTime && (
        <Group justify="space-between" mb="xs">
            <Group gap="xs" c="blue.7"> {/* Choose a color that stands out */}
                <CalendarClock size={16} />
                <Text size="sm" fw={500}>
                    {formatRequestedTime(order.requestedReadyTime)}
                </Text>
            </Group>
            {/* You might want to compare with current time to show if it's due soon/late */}
        </Group>
      )}

        <Group justify="space-between" mb="md">
          <Group gap="xs">
            <Clock size={16} />
            <Text size="sm" c="dimmed">{formatTime(order.timestamp)}</Text>
          </Group>
          <Badge variant="outline" size="sm">{order.source}</Badge>
        </Group>

        <Divider mb="md" />

        <Stack gap="xs" mb="md">
          {order.items.map((item: OrderItem, idx: number) => (
            <Box key={idx}>
              <Group justify="space-between">
                <Text fw={500}>{item.quantity}x {item.name}</Text>
                <Text size="sm" c="dimmed">{formatCurrency(item.price * item.quantity)}</Text>
              </Group>
              {item.modifications.length > 0 && (
                <Text size="sm" c="orange" fs="italic" pl="md">
                  • {item.modifications.join(', ')}
                </Text>
              )}
            </Box>
          ))}
        </Stack>

        {order.notes && (
          <Paper p="xs" bg="yellow.0" mb="md">
            <Text size="sm" c="yellow.8" fw={500}>Note: {order.notes}</Text>
          </Paper>
        )}

        <Group justify="space-between" mb="md">
          <Text fw={600}>Total: {formatCurrency(order.total)}</Text>
          <Badge variant="outline">{order.paymentMethod === 'card' ? 'Card' : 'Cash'}</Badge>
        </Group>

        <Group>
          {actionButtonProps && nextStatus && (
            <Button
              leftSection={actionButtonProps.icon}
              onClick={() => onStatusUpdate(order.id, nextStatus)}
              flex={1}
              color={actionButtonProps.color}
            >
              {actionButtonProps.label}
            </Button>
          )}
          <ActionIcon variant="light" size="lg" onClick={() => onPrint(order.id)}>
            <Printer size={20} />
          </ActionIcon>
        </Group>
    </Card>
  );
};