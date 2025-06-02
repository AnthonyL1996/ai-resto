import React from 'react';
import { Group, Title, Button } from '@mantine/core';
import { Plus } from 'lucide-react';
import type { Order, OrderStatus } from '../../types/order.types'; // Adjust path
import { StatsCards } from './StatsCards'; // New component
import { OrderTable } from './OrderTable';   // New component

interface OrderManagementViewProps {
  orders: Order[];
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedToday: number;
    totalRevenue: number;
  };
  onOpenCreateModal: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onPrintOrder: (orderId: string) => void;
  // onUpdateStatus: (orderId: string, status: OrderStatus) => void; // If status can be changed from table
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  orders,
  stats,
  onOpenCreateModal,
  onEditOrder,
  onDeleteOrder,
  onPrintOrder,
}) => {
  return (
    <>
      <StatsCards stats={stats} />
      <Group justify="space-between" mb="md" mt="xl">
        <Title order={3}>All Orders</Title>
        <Button leftSection={<Plus size={16} />} onClick={onOpenCreateModal}>
          Create Order
        </Button>
      </Group>
      <OrderTable
        orders={orders}
        onEdit={onEditOrder}
        onDelete={onDeleteOrder}
        onPrint={onPrintOrder}
      />
    </>
  );
};