import React from 'react';
import { Group, Title, Button } from '@mantine/core';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div style={{ padding: '16px 20px' }}>
      <StatsCards stats={stats} />
      <Group justify="space-between" mb="lg" mt="xl" style={{ minHeight: '60px' }}>
        <Title order={3} style={{ fontSize: '24px', fontWeight: 600 }}>{t('orders.title')}</Title>
        <Button 
          leftSection={<Plus size={20} />} 
          onClick={onOpenCreateModal}
          size="lg"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          styles={{
            root: {
              minWidth: '180px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
            }
          }}
        >
          {t('orders.create')}
        </Button>
      </Group>
      <OrderTable
        orders={orders}
        onEdit={onEditOrder}
        onDelete={onDeleteOrder}
        onPrint={onPrintOrder}
      />
    </div>
  );
};