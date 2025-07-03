import React, { useState, useEffect } from 'react';
import { Modal, Stack, Grid, TextInput, Select, Textarea, Divider, Card, Button, Group, NumberInput, ActionIcon, Text, Box, Badge } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { Save, Trash2, CalendarDays, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrderFormData } from '../../types/form.types';
import type { OrderItem as FormOrderItem } from '../../types/order.types';
import type { PaymentMethod, OrderSource, Order } from '../../types/order.types';
import { formatCurrency } from '../../utils/formatting';
import { menuItemService, type MenuItem } from '../../services/MenuItemService';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void; // The hook will handle create vs update
  formData: OrderFormData;
  onFormDataChange: <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => void;
  onItemAdd: (menuItemName: string) => void | Promise<void>;
  onItemRemove: (index: number) => void;
  onItemQuantityChange: (index: number, quantity: number) => void;
  calculateTotal: (items: FormOrderItem[]) => number;
  editingOrder: Order | null;
}

const getAllergenDisplayName = (allergen: string): string => {
  const allergenMap: Record<string, string> = {
    'gluten': 'Gluten',
    'lactose': 'Lactose',
    'nuts': 'Nuts',
    'soy': 'Soy',
    'egg': 'Egg',
    'fish': 'Fish',
    'shellfish': 'Shellfish'
  };
  return allergenMap[allergen] || allergen;
};

const getDietaryDisplayName = (option: string): string => {
  const dietaryMap: Record<string, string> = {
    'vegetarian': 'Vegetarian',
    'vegan': 'Vegan',
    'glutenFree': 'Gluten Free'
  };
  return dietaryMap[option] || option;
};

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
    <Modal 
      opened={isOpen} 
      onClose={onClose} 
      title={editingOrder ? t('orderForm.title.edit') : t('orderForm.title.create')} 
      size="100%" 
      padding="xl"
      styles={{
        body: { 
          height: 'calc(100vh - 180px)', 
          maxHeight: 'calc(100vh - 180px)',
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column' 
        },
        content: {
          height: '100vh',
          maxHeight: '100vh'
        },
        header: {
          padding: 'var(--mantine-spacing-xl)'
        }
      }}
    >
      <div style={{ 
        display: 'flex', 
        height: 'calc(100vh - 300px)', 
        gap: 'var(--mantine-spacing-xl)',
        flexDirection: 'row',
        marginBottom: 'var(--mantine-spacing-md)'
      }}>
        {/* Left Column - Form Fields and Menu Items */}
        <div style={{ flex: '2', overflowY: 'auto', paddingRight: 'var(--mantine-spacing-md)' }}>
          <Stack gap="2xl">
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('orderForm.fields.customerName')}
                  placeholder={t('orderForm.fields.customerNamePlaceholder')}
                  required
                  value={formData.customerName}
                  onChange={(e) => onFormDataChange('customerName', e.currentTarget.value)}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '56px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('orderForm.fields.phoneNumber')}
                  placeholder={t('orderForm.fields.phoneNumberPlaceholder')}
                  value={formData.customerPhone}
                  onChange={(e) => onFormDataChange('customerPhone', e.currentTarget.value)}
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '56px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
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
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '56px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
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
                  size="xl"
                  styles={{
                    input: { fontSize: '18px', minHeight: '56px' },
                    label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
                  }}
                />
              </Grid.Col>
            </Grid>

            <DateTimePicker
              label={t('orderForm.fields.requestedReadyTime')}
              placeholder={t('orderForm.fields.requestedReadyTimePlaceholder')}
              value={formData.requestedReadyTime ? new Date(formData.requestedReadyTime) : null}
              onChange={(dateValue) => onFormDataChange('requestedReadyTime', dateValue || undefined)}
              leftSection={<CalendarDays size={20} />}
              minDate={new Date()}
              valueFormat="YYYY-MM-DD HH:mm"
              size="xl"
              styles={{
                input: { fontSize: '18px', minHeight: '56px' },
                label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
              }}
            />

            <Textarea
              label={t('orderForm.fields.notes')}
              placeholder={t('orderForm.fields.notesPlaceholder')}
              value={formData.notes}
              onChange={(e) => onFormDataChange('notes', e.currentTarget.value)}
              size="xl"
              rows={4}
              styles={{
                input: { fontSize: '18px', minHeight: '100px' },
                label: { fontSize: '16px', fontWeight: 600, marginBottom: '8px' }
              }}
            />

            <Divider label={t('orderForm.sections.menuItems')} labelPosition="center" styles={{ label: { fontSize: '18px', fontWeight: 600 } }} />
            <Grid gutter="lg">
              {menuItems.map((menuItem) => (
                <Grid.Col key={menuItem.id} span={{ base: 6, sm: 4, md: 3, lg: 3 }}>
                  <Card 
                    withBorder 
                    p="xl" 
                    radius="md"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minHeight: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}
                    onClick={() => onItemAdd(menuItem.name)}
                  >
                    <Box style={{ flex: 1 }}>
                      <Text fw={600} size="lg" mb="sm" lineClamp={2}>{menuItem.name}</Text>
                      <Text size="md" c="blue" fw={600} mb="xs">{formatCurrency(menuItem.price)}</Text>
                      {menuItem.description && (
                        <Text size="sm" c="dimmed" mt="xs" mb="sm" lineClamp={2}>{menuItem.description}</Text>
                      )}
                      
                      {/* Allergen Information */}
                      {(menuItem.allergens && menuItem.allergens.length > 0) && (
                        <Box mb="sm">
                          <Text size="xs" c="dimmed" mb="xs" fw={500}>⚠️ Contains:</Text>
                          <Group gap="xs">
                            {menuItem.allergens.map((allergen) => (
                              <Badge 
                                key={allergen} 
                                size="sm" 
                                color="red" 
                                variant="filled"
                                styles={{ 
                                  root: { 
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'capitalize'
                                  } 
                                }}
                              >
                                {getAllergenDisplayName(allergen)}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}
                      
                      {/* Dietary Options */}
                      {(menuItem.dietary_options && menuItem.dietary_options.length > 0) && (
                        <Box mb="sm">
                          <Text size="xs" c="dimmed" mb="xs" fw={500}>🌱 Suitable for:</Text>
                          <Group gap="xs">
                            {menuItem.dietary_options.map((option) => (
                              <Badge 
                                key={option} 
                                size="sm" 
                                color="green" 
                                variant="filled"
                                styles={{ 
                                  root: { 
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    textTransform: 'capitalize'
                                  } 
                                }}
                              >
                                {getDietaryDisplayName(option)}
                              </Badge>
                            ))}
                          </Group>
                        </Box>
                      )}
                    </Box>
                    <Button 
                      size="lg" 
                      fullWidth 
                      leftSection={<Plus size={20} />}
                      mt="lg"
                      variant="filled"
                      styles={{
                        root: { minHeight: '48px', fontSize: '16px' }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemAdd(menuItem.name);
                      }}
                    >
                      {t('orderForm.buttons.addToOrder')}
                    </Button>
                  </Card>
                </Grid.Col>
              )) }
            </Grid>
          </Stack>
        </div>

        {/* Right Column - Order Summary (Always Visible) */}
        <div 
          style={{ 
            flex: '0 0 400px', // Wider sidebar for full screen
            backgroundColor: 'var(--mantine-color-gray-0)',
            padding: 'var(--mantine-spacing-md)',
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--mantine-color-gray-3)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
            <Stack gap="md" style={{ height: '100%' }}>
              <Text fw={700} size="lg" ta="center">{t('orderForm.sections.orderSummary')}</Text>
              
              {formData.items.length === 0 ? (
                <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text ta="center" c="dimmed" size="sm">
                    {t('orderForm.messages.noItems')}
                  </Text>
                </Box>
              ) : (
                <>
                  <Box style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                    <Stack gap="xs">
                      {formData.items.map((item, idx) => (
                        <Card key={idx} withBorder p="sm" radius="sm">
                          <Stack gap="xs">
                            <Group justify="space-between" wrap="nowrap">
                              <Text fw={600} size="sm" truncate style={{ maxWidth: '120px' }}>{item.name}</Text>
                              <ActionIcon 
                                color="red" 
                                variant="light" 
                                size="sm"
                                onClick={() => onItemRemove(idx)} 
                              >
                                <Trash2 size={14} />
                              </ActionIcon>
                            </Group>
                            
                            <Group justify="space-between" wrap="nowrap">
                              <Group gap="xs" wrap="nowrap">
                                <ActionIcon
                                  variant="light"
                                  size="sm"
                                  onClick={() => onItemQuantityChange(idx, Math.max(0, item.quantity - 1))}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={14} />
                                </ActionIcon>
                                
                                <Text fw={600} size="sm" style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantity}</Text>
                                
                                <ActionIcon
                                  variant="light"
                                  size="sm"
                                  onClick={() => onItemQuantityChange(idx, Math.min(10, item.quantity + 1))}
                                  disabled={item.quantity >= 10}
                                >
                                  <Plus size={14} />
                                </ActionIcon>
                              </Group>
                              
                              <Text fw={600} size="sm">
                                {formatCurrency(item.price * item.quantity)}
                              </Text>
                            </Group>
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                  
                  <Card withBorder p="md" radius="md" style={{ backgroundColor: 'var(--mantine-color-blue-0)', marginTop: 'auto' }}>
                    <Group justify="space-between">
                      <Text fw={700} size="lg">{t('orderForm.pricing.total')}</Text>
                      <Text fw={700} size="lg" c="blue">{formatCurrency(calculateTotal(formData.items))}</Text>
                    </Group>
                  </Card>
                </>
              )}
            </Stack>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div style={{ 
        flexShrink: 0, 
        padding: 'var(--mantine-spacing-xl)', 
        borderTop: '1px solid var(--mantine-color-gray-3)',
        backgroundColor: 'white',
        marginTop: 'auto',
        minHeight: '100px'
      }}>
        <Group justify="flex-end" gap="md">
        <Button 
          variant="outline" 
          onClick={onClose}
          size="xl"
          styles={{
            root: { 
              minHeight: '60px',
              fontSize: '18px',
              minWidth: '150px'
            }
          }}
        >
          {t('orderForm.buttons.cancel')}
        </Button>
        <Button
          leftSection={<Save size={24} />}
          onClick={onSubmit}
          disabled={!formData.customerName || formData.items.length === 0}
          size="xl"
          styles={{
            root: { 
              minHeight: '60px',
              fontSize: '18px',
              minWidth: '200px'
            }
          }}
        >
          {editingOrder ? t('orderForm.buttons.updateOrder') : t('orderForm.buttons.createOrder')}
        </Button>
        </Group>
      </div>
    </Modal>
  );
};