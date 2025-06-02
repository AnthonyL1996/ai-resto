// src/features/OrderManagement/OrderTable.tsx
import React from 'react';
import { Table, ScrollArea, Badge, ActionIcon, Menu, rem, Text } from '@mantine/core';
import { MoreVertical, Edit, Trash2, Printer as PrintIcon } from 'lucide-react';
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
  const numberOfColumns = 8; // Order #, Customer, Items, Total, Status, Source, Time, Actions

  return (
    <ScrollArea>
      <Table striped highlightOnHover miw={800}>{/* NOTE: No newline/space after this opening tag and before Table.Thead */}
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Order #</Table.Th>
            <Table.Th>Customer</Table.Th>
            <Table.Th>Items</Table.Th>
            <Table.Th>Total</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Req. Ready Time</Table.Th> 
            <Table.Th>Time</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>{/* NOTE: No newline/space after this tag and before Table.Tbody */}
        <Table.Tbody>
          {orders.length > 0 ? (
            orders.map((order) => (
              <Table.Tr key={order.id}>
                <Table.Td>#{order.orderNumber}</Table.Td>
                <Table.Td>{order.customerName}</Table.Td>
                <Table.Td>{order.items.length} items</Table.Td>
                <Table.Td>{formatCurrency(order.total)}</Table.Td>
                <Table.Td>
                  <Badge color={getStatusColor(order.status)} variant="light">
                    {getStatusText(order.status)}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge variant="outline" size="sm">{order.source}</Badge>
                </Table.Td>
                <Table.Td>
                  {order.requestedReadyTime
                    ? formatRequestedTime(new Date(order.requestedReadyTime)) 
                    : 'N/A'}
                </Table.Td>
                <Table.Td>{formatTime(order.timestamp)}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon variant="subtle" color="gray">
                        <MoreVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<Edit style={{ width: rem(14), height: rem(14) }} />}
                        onClick={() => onEdit(order)}
                      >
                        Edit Order
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<PrintIcon style={{ width: rem(14), height: rem(14) }} />}
                        onClick={() => onPrint(order.id)}
                      >
                        Print Order
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<Trash2 style={{ width: rem(14), height: rem(14) }} />}
                        onClick={() => onDelete(order.id)}
                      >
                        Delete Order
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
                  No orders to display.
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
};