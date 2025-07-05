import React from 'react';
import { Grid, Box, Title, Center, Stack, Text, Badge, Button, Group } from '@mantine/core';
import { ChefHat, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '../../types/order.types'; // Adjust path
import { OrderCard, type OrderCardProps } from '../../components/OrderCard/OrderCard'; // Adjust path
import { RecentlyCompleted } from './RecentlyCompleted'; // New component for completed orders list
import type { SSEStatus } from '../../hooks/useSSE';

interface KitchenDisplayViewProps {
  activeOrders: Order[];
  completedOrders: Order[]; // Pass only a few recent ones if needed
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onPrintOrder: (orderId: string) => void;
  sseConnectionStatus?: SSEStatus;
  onSSEReconnect?: () => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  activeOrders,
  completedOrders,
  onUpdateOrderStatus,
  onPrintOrder,
  sseConnectionStatus,
  onSSEReconnect,
}) => {
  console.log('KitchenDisplayView - Active orders:', activeOrders);
  console.log('KitchenDisplayView - Active orders count:', activeOrders.length);
  
  return (
    <>
      {/* SSE Connection Status */}
      {sseConnectionStatus && (
        <Group justify="space-between" mb="md" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
          <Group>
            {sseConnectionStatus.connected ? (
              <>
                <Wifi size={20} color="green" />
                <Badge color="green" variant="light">Real-time Connected</Badge>
                {sseConnectionStatus.subscribersCount && (
                  <Text size="sm" c="dimmed">
                    {sseConnectionStatus.subscribersCount} active connections
                  </Text>
                )}
              </>
            ) : (
              <>
                <WifiOff size={20} color="red" />
                <Badge color="red" variant="light">
                  {sseConnectionStatus.connecting ? 'Connecting...' : 'Disconnected'}
                </Badge>
                {sseConnectionStatus.error && (
                  <Text size="sm" c="red">
                    {sseConnectionStatus.error}
                  </Text>
                )}
              </>
            )}
            {sseConnectionStatus.reconnectAttempts > 0 && (
              <Text size="sm" c="orange">
                Reconnect attempts: {sseConnectionStatus.reconnectAttempts}
              </Text>
            )}
          </Group>
          {!sseConnectionStatus.connected && onSSEReconnect && (
            <Button
              size="xs"
              variant="light"
              leftSection={<RefreshCw size={16} />}
              onClick={onSSEReconnect}
              loading={sseConnectionStatus.connecting}
            >
              Reconnect
            </Button>
          )}
        </Group>
      )}

      <Grid>
        {activeOrders.map((order) => (
          <Grid.Col key={order.id} span={{ base: 12, md: 6, lg: 4 }}>
            <OrderCard
              order={order}
              onStatusUpdate={onUpdateOrderStatus}
              onPrint={onPrintOrder}
            />
          </Grid.Col>
        ))}
      </Grid>

      {activeOrders.length === 0 && (
        <Center py="xl">
          <Stack align="center">
            <ChefHat size={48} color="var(--mantine-color-gray-4)" /> {/* Use theme color */}
            <Title order={3} c="dimmed">No Active Orders</Title>
            <Text c="dimmed">Kitchen is all caught up! New orders will appear here.</Text>
          </Stack>
        </Center>
      )}

      {completedOrders.length > 0 && (
        <Box mt="xl">
            <RecentlyCompleted orders={completedOrders.slice(0,3)} /> {/* Show only top 3 for example */}
        </Box>
      )}
    </>
  );
};