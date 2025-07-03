// src/features/OrderManagement/OrderTable.tsx
import React from 'react';
import { Table, ScrollArea, Badge, ActionIcon, Menu, rem, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { MoreVertical, Edit, Trash2, Printer as PrintIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Order } from '../../types/order.types'; // Adjust path
import { formatCurrency, formatTime, formatRequestedTime } from '../../utils/formatting'; // Adjust path
import { getStatusColor, getStatusText } from '../../utils/statusHelpers'; // Adjust path

interface OrderTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onPrint: (orderId: string) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({ orders, onEdit, onDelete, onPrint }) => {
  const { t } = useTranslation();
  const numberOfColumns = 8; // Order #, Customer, Items, Total, Status, Source, Time, Actions

  const handleDeleteWithConfirmation = (order: Order) => {
    modals.openConfirmModal({
      title: t('orders.deleteConfirm.title'),
      children: (
        <Text size="sm">
          {t('orders.deleteConfirm.message')} <strong>#{order.orderNumber}</strong> {t('orders.deleteConfirm.for')} <strong>{order.customerName}</strong>?
          <br />
          <br />
          {t('orders.deleteConfirm.cannotUndo')}
        </Text>
      ),
      labels: { confirm: t('orders.deleteConfirm.confirm'), cancel: t('orders.deleteConfirm.cancel') },
      confirmProps: { color: 'red', size: 'md' },
      cancelProps: { size: 'md' },
      onConfirm: () => onDelete(order.id),
    });
  };

  return (
    <ScrollArea 
      style={{ 
        borderRadius: '8px', 
        border: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'white' 
      }}
    >
      <Table striped highlightOnHover miw={1000} style={{ fontSize: '15px' }}>{/* NOTE: No newline/space after this opening tag and before Table.Thead */}
        <Table.Thead>
          <Table.Tr style={{ height: '60px' }}>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.orderNumber')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.customer')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.items')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.total')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.status')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.source')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.requestedReadyTime')}</Table.Th> 
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.time')}</Table.Th>
            <Table.Th style={{ padding: '16px 12px', fontSize: '14px', fontWeight: 600 }}>{t('orders.actions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>{/* NOTE: No newline/space after this tag and before Table.Tbody */}
        <Table.Tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <Table.Tr key={order.id} style={{ height: '72px' }}>
                <Table.Td style={{ padding: '16px 12px', fontSize: '15px' }}>#{order.orderNumber}</Table.Td>
                <Table.Td style={{ padding: '16px 12px', fontSize: '15px' }}>{order.customerName}</Table.Td>
                <Table.Td style={{ padding: '16px 12px', fontSize: '15px' }}>{order.items.length} items</Table.Td>
                <Table.Td style={{ padding: '16px 12px', fontSize: '16px', fontWeight: 600 }}>{formatCurrency(order.total)}</Table.Td>
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Badge color={getStatusColor(order.status)} variant="light" size="md">
                    {getStatusText(order.status)}
                  </Badge>
                </Table.Td>
                <Table.Td style={{ padding: '16px 12px' }}>
                  <Badge variant="outline" size="md">{order.source}</Badge>
                </Table.Td>
                <Table.Td style={{ padding: '16px 12px', fontSize: '15px' }}>
                  {order.requestedReadyTime
                    ? formatRequestedTime(new Date(order.requestedReadyTime)) 
                    : 'N/A'}
                </Table.Td>
                <Table.Td style={{ padding: '16px 12px', fontSize: '15px' }}>{formatTime(order.timestamp)}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={240}>
                    <Menu.Target>
                      <ActionIcon 
                        variant="subtle" 
                        color="gray"
                        size="lg"
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        <MoreVertical size={20} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Edit style={{ width: rem(18), height: rem(18) }} />}
                        onClick={() => onEdit(order)}
                        style={{ padding: '12px 16px', fontSize: '15px' }}
                      >
                        {t('orders.edit')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<PrintIcon style={{ width: rem(18), height: rem(18) }} />}
                        onClick={() => onPrint(order.id)}
                        style={{ padding: '12px 16px', fontSize: '15px' }}
                      >
                        {t('orders.print')}
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash2 style={{ width: rem(18), height: rem(18) }} />}
                        onClick={() => handleDeleteWithConfirmation(order)}
                        style={{ padding: '12px 16px', fontSize: '15px' }}
                      >
                        {t('orders.delete')}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))
          ) : (
            <Table.Tr>
              <Table.Td colSpan={numberOfColumns}>
                <Text c="dimmed" ta="center" py="lg">
                  {t('orders.noOrders')}
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};