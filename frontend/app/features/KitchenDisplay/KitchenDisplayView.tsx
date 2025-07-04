import React from 'react';
import { Grid, Box, Title, Center, Stack, Text } from '@mantine/core';
import { ChefHat } from 'lucide-react';
import type { Order, OrderStatus } from '../../types/order.types'; // Adjust path
import { OrderCard, type OrderCardProps } from '../../components/OrderCard/OrderCard'; // Adjust path
import { RecentlyCompleted } from './RecentlyCompleted'; // New component for completed orders list

interface KitchenDisplayViewProps {
  activeOrders: Order[];
  completedOrders: Order[]; // Pass only a few recent ones if needed
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onPrintOrder: (orderId: string) => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  activeOrders,
  completedOrders,
  onUpdateOrderStatus,
  onPrintOrder,
}) => {
  console.log('KitchenDisplayView - Active orders:', activeOrders);
  console.log('KitchenDisplayView - Active orders count:', activeOrders.length);
  
  return (
    <>
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