import React from 'react';
import { Modal, Stack, Grid, TextInput, Select, Textarea, Divider, Card, Button, Group, NumberInput, ActionIcon, Text, Box } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Save, Trash2, CalendarDays } from 'lucide-react';
import type { OrderFormData } from '../../types/form.types'; // Use FormOrderItem if it differs
import type { OrderItem as FormOrderItem } from '../../types/order.types';
import type { PaymentMethod, OrderSource, Order } from '../../types/order.types'; // Adjust path
import { MENU_ITEMS } from '../../config/constants'; // Adjust path
import { formatCurrency } from '../../utils/formatting'; // Adjust path

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void; // The hook will handle create vs update
  formData: OrderFormData;
  onFormDataChange: <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => void;
  onItemAdd: (menuItemName: string) => void;
  onItemRemove: (index: number) => void;
  onItemQuantityChange: (index: number, quantity: number) => void;
  calculateTotal: (items: FormOrderItem[]) => number;
  editingOrder: Order | null;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  onItemAdd,
  onItemRemove,
  onItemQuantityChange,
  calculateTotal,
  editingOrder,
}) => {
  return (
    <Modal opened={isOpen} onClose={onClose} title={editingOrder ? "Edit Order" : "Create New Order"} size="lg">
      <Stack>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Customer Name"
              placeholder="Enter customer name"
              required
              value={formData.customerName}
              onChange={(e) => onFormDataChange('customerName', e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.customerPhone}
              onChange={(e) => onFormDataChange('customerPhone', e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Payment Method"
              required
              data={[
                { value: 'card', label: 'Card' },
                { value: 'cash', label: 'Cash' },
              ]}
              value={formData.paymentMethod}
              onChange={(value) => onFormDataChange('paymentMethod', (value as PaymentMethod) || 'card')}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label="Order Source"
              required
              data={[
                { value: 'manual', label: 'Manual' },
                { value: 'kiosk', label: 'Kiosk' },
                { value: 'website', label: 'Website' },
              ]}
              value={formData.source}
              onChange={(value) => onFormDataChange('source', (value as OrderSource) || 'manual')}
            />
          </Grid.Col>
        </Grid>

        <DateTimePicker
          label="Requested Ready Time"
          placeholder="Pick date and time"
          value={formData.requestedReadyTime ? new Date(formData.requestedReadyTime) : null} // Ensure value is Date or null
          onChange={(dateValue) => onFormDataChange('requestedReadyTime', dateValue as Date)} // Store as Date
          leftSection={<CalendarDays size={16} />}
          minDate={new Date()} // Prevent selecting past dates/times
          valueFormat="YYYY-MM-DD HH:mm" // Display format
        />

        <Textarea
          label="Notes"
          placeholder="Special instructions or notes"
          value={formData.notes}
          onChange={(e) => onFormDataChange('notes', e.currentTarget.value)}
        />

        <Divider label="Menu Items" labelPosition="center" />
        <Grid>
          {MENU_ITEMS.map((menuItem) => (
            <Grid.Col key={menuItem.name} span={{ base: 6, sm: 4 }}>
              <Card withBorder p="sm">
                <Text fw={500} size="sm">{menuItem.name}</Text>
                <Text size="xs" c="dimmed" mb="xs">{formatCurrency(menuItem.price)}</Text>
                <Button size="xs" fullWidth onClick={() => onItemAdd(menuItem.name)}>
                  Add to Order
                </Button>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        {formData.items.length > 0 && (
          <>
            <Divider label="Order Items" labelPosition="center" />
            <Stack>
              {formData.items.map((item, idx) => (
                <Group key={idx} justify="space-between" wrap="nowrap">
                  <Box style={{ flexGrow: 1, minWidth: '100px' }}>
                    <Text fw={500} truncate>{item.name}</Text>
                    <Text size="sm" c="dimmed">{formatCurrency(item.price)} each</Text>
                  </Box>
                  <NumberInput
                    value={item.quantity}
                    onChange={(value) => onItemQuantityChange(idx, Number(value) || 0)}
                    min={0} max={10} w={80} step={1} size="xs"
                  />
                  <Text fw={500} w={80} ta="right" size="sm">
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                  <ActionIcon color="red" variant="light" onClick={() => onItemRemove(idx)} size="lg">
                    <Trash2 size={16} />
                  </ActionIcon>
                </Group>
              ))}
              <Divider />
              <Group justify="space-between">
                <Text fw={700} size="lg">Total:</Text>
                <Text fw={700} size="lg">{formatCurrency(calculateTotal(formData.items))}</Text>
              </Group>
            </Stack>
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            leftSection={<Save size={16} />}
            onClick={onSubmit}
            disabled={!formData.customerName || formData.items.length === 0}
          >
            {editingOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};