import React, { useState, useEffect } from 'react';
import { Modal, Stack, Grid, TextInput, Select, Textarea, Divider, Card, Button, Group, NumberInput, ActionIcon, Text, Box } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Save, Trash2, CalendarDays, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrderFormData } from '../../types/form.types';
import type { OrderItem as FormOrderItem } from '../../types/order.types';
import type { PaymentMethod, OrderSource, Order } from '../../types/order.types';
import { formatCurrency } from '../../utils/formatting';
import { menuItemService, type MenuItem } from '../../services/MenuItemService';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        // Map i18n language codes to API language codes
        const langMap: Record<string, string> = {
          'en': 'en',
          'nl': 'nl', 
          'fr': 'fr',
          'zh': 'zh-HK',
          'zh-HK': 'zh-HK'
        };
        
        const currentLang = i18n.language;
        const apiLangCode = langMap[currentLang] || currentLang;
        
        console.log('Loading menu items with language:', apiLangCode);
        const items = await menuItemService.getMenuItems(undefined, apiLangCode);
        setMenuItems(items.filter(item => item.is_available));
      } catch (error) {
        console.error('Failed to load menu items:', error);
        // Fallback to default language
        try {
          const items = await menuItemService.getMenuItems();
          setMenuItems(items.filter(item => item.is_available));
        } catch (fallbackError) {
          console.error('Failed to load menu items with fallback:', fallbackError);
        }
      }
    };
    
    if (isOpen) {
      loadMenuItems();
    }
  }, [isOpen, i18n.language]);

  return (
    <Modal opened={isOpen} onClose={onClose} title={editingOrder ? t('orderForm.title.edit') : t('orderForm.title.create')} size="xl" padding="xl">
      <Stack gap="xl">
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label={t('orderForm.fields.customerName')}
              placeholder={t('orderForm.fields.customerNamePlaceholder')}
              required
              value={formData.customerName}
              onChange={(e) => onFormDataChange('customerName', e.currentTarget.value)}
              size="lg"
              styles={{
                input: { fontSize: '16px', minHeight: '48px' },
                label: { fontSize: '14px', fontWeight: 600 }
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <TextInput
              label={t('orderForm.fields.phoneNumber')}
              placeholder={t('orderForm.fields.phoneNumberPlaceholder')}
              value={formData.customerPhone}
              onChange={(e) => onFormDataChange('customerPhone', e.currentTarget.value)}
              size="lg"
              styles={{
                input: { fontSize: '16px', minHeight: '48px' },
                label: { fontSize: '14px', fontWeight: 600 }
              }}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label={t('orderForm.fields.paymentMethod')}
              required
              data={[
                { value: 'card', label: t('orderForm.paymentMethods.card') },
                { value: 'cash', label: t('orderForm.paymentMethods.cash') },
              ]}
              value={formData.paymentMethod}
              onChange={(value) => onFormDataChange('paymentMethod', (value as PaymentMethod) || 'card')}
              size="lg"
              styles={{
                input: { fontSize: '16px', minHeight: '48px' },
                label: { fontSize: '14px', fontWeight: 600 }
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Select
              label={t('orderForm.fields.orderSource')}
              required
              data={[
                { value: 'manual', label: t('orderForm.sources.manual') },
                { value: 'kiosk', label: t('orderForm.sources.kiosk') },
                { value: 'website', label: t('orderForm.sources.website') },
              ]}
              value={formData.source}
              onChange={(value) => onFormDataChange('source', (value as OrderSource) || 'manual')}
              size="lg"
              styles={{
                input: { fontSize: '16px', minHeight: '48px' },
                label: { fontSize: '14px', fontWeight: 600 }
              }}
            />
          </Grid.Col>
        </Grid>

        <DateTimePicker
          label={t('orderForm.fields.requestedReadyTime')}
          placeholder={t('orderForm.fields.requestedReadyTimePlaceholder')}
          value={formData.requestedReadyTime ? new Date(formData.requestedReadyTime) : null}
          onChange={(dateValue) => onFormDataChange('requestedReadyTime', dateValue || null)}
          leftSection={<CalendarDays size={20} />}
          minDate={new Date()}
          valueFormat="YYYY-MM-DD HH:mm"
          size="lg"
          styles={{
            input: { fontSize: '16px', minHeight: '48px' },
            label: { fontSize: '14px', fontWeight: 600 }
          }}
        />

        <Textarea
          label={t('orderForm.fields.notes')}
          placeholder={t('orderForm.fields.notesPlaceholder')}
          value={formData.notes}
          onChange={(e) => onFormDataChange('notes', e.currentTarget.value)}
          size="lg"
          rows={3}
          styles={{
            input: { fontSize: '16px', minHeight: '80px' },
            label: { fontSize: '14px', fontWeight: 600 }
          }}
        />

        <Divider label={t('orderForm.sections.menuItems')} labelPosition="center" styles={{ label: { fontSize: '16px', fontWeight: 600 } }} />
        <Grid>
          {menuItems.map((menuItem) => (
            <Grid.Col key={menuItem.id} span={{ base: 6, sm: 4 }}>
              <Card 
                withBorder 
                p="lg" 
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                onClick={() => onItemAdd(menuItem.name)}
              >
                <Box>
                  <Text fw={600} size="md" mb="xs">{menuItem.name}</Text>
                  <Text size="sm" c="dimmed" fw={500}>{formatCurrency(menuItem.price)}</Text>
                  {menuItem.description && (
                    <Text size="xs" c="dimmed" mt="xs">{menuItem.description}</Text>
                  )}
                </Box>
                <Button 
                  size="md" 
                  fullWidth 
                  leftSection={<Plus size={18} />}
                  mt="md"
                  styles={{
                    root: { minHeight: '44px', fontSize: '14px' }
                  }}
                >
                  {t('orderForm.buttons.addToOrder')}
                </Button>
              </Card>
            </Grid.Col>
          )) }
        </Grid>

        {formData.items.length > 0 && (
          <>
            <Divider label={t('orderForm.sections.orderItems')} labelPosition="center" styles={{ label: { fontSize: '16px', fontWeight: 600 } }} />
            <Stack gap="md">
              {formData.items.map((item, idx) => (
                <Card key={idx} withBorder p="md" radius="md">
                  <Group justify="space-between" wrap="nowrap" gap="md">
                    <Box style={{ flexGrow: 1, minWidth: '120px' }}>
                      <Text fw={600} size="md" truncate>{item.name}</Text>
                      <Text size="sm" c="dimmed" fw={500}>{formatCurrency(item.price)} {t('orderForm.pricing.each')}</Text>
                    </Box>
                    
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => onItemQuantityChange(idx, Math.max(0, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        styles={{ root: { minWidth: '44px', minHeight: '44px' } }}
                      >
                        <Minus size={18} />
                      </ActionIcon>
                      
                      <Box style={{ minWidth: '60px', textAlign: 'center' }}>
                        <Text fw={600} size="lg" ta="center">{item.quantity}</Text>
                      </Box>
                      
                      <ActionIcon
                        variant="light"
                        size="lg"
                        onClick={() => onItemQuantityChange(idx, Math.min(10, item.quantity + 1))}
                        disabled={item.quantity >= 10}
                        styles={{ root: { minWidth: '44px', minHeight: '44px' } }}
                      >
                        <Plus size={18} />
                      </ActionIcon>
                    </Group>
                    
                    <Text fw={600} size="md" style={{ minWidth: '80px' }} ta="right">
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                    
                    <ActionIcon 
                      color="red" 
                      variant="light" 
                      onClick={() => onItemRemove(idx)} 
                      size="xl"
                      styles={{ root: { minWidth: '48px', minHeight: '48px' } }}
                    >
                      <Trash2 size={20} />
                    </ActionIcon>
                  </Group>
                </Card>
              ))}
              
              <Card withBorder p="lg" radius="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Group justify="space-between">
                  <Text fw={700} size="xl">{t('orderForm.pricing.total')}</Text>
                  <Text fw={700} size="xl" c="blue">{formatCurrency(calculateTotal(formData.items))}</Text>
                </Group>
              </Card>
            </Stack>
          </>
        )}

        <Group justify="flex-end" mt="xl" gap="md">
          <Button 
            variant="outline" 
            onClick={onClose}
            size="lg"
            styles={{
              root: { 
                minHeight: '52px',
                fontSize: '16px',
                minWidth: '120px'
              }
            }}
          >
            {t('orderForm.buttons.cancel')}
          </Button>
          <Button
            leftSection={<Save size={20} />}
            onClick={onSubmit}
            disabled={!formData.customerName || formData.items.length === 0}
            size="lg"
            styles={{
              root: { 
                minHeight: '52px',
                fontSize: '16px',
                minWidth: '160px'
              }
            }}
          >
            {editingOrder ? t('orderForm.buttons.updateOrder') : t('orderForm.buttons.createOrder')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};