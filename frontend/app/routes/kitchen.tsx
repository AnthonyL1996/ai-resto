// routes/kitchen.tsx
import React, { useState, type JSX } from 'react'; // Removed useEffect for now, add back if simulation is re-added
import { AppShell, Container, Tabs, Notification, Stack, Button, Text } from '@mantine/core';
import { AlertCircle, ChefHat, ShoppingCart, Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Hooks
import { useOrderManagement } from '../hooks/useOrderManagement'; 
import { useSoundNotification } from '../hooks/useSoundNotification'; // Adjusted path

// Components
import { AppHeader } from '../components/layout/AppHeader'; // Adjusted path
import { OrderFormModal } from '../components/OrderFormModal/OrderFormModal'; // Adjusted path
import { KitchenDisplayView } from '../features/KitchenDisplay/KitchenDisplayView'; // Adjusted path
import { OrderManagementView } from '../features/OrderManagement/OrderManagementView'; // Adjusted path
import { MenuManagement } from '../features/MenuManagement'; // Adjusted path
// import { KDSWebSocket } from '../components/KDSWebSocket';

// Services
import { orderService as defaultOrderService } from '../services/OrderServiceFactory'; // Factory chooses service
import { ConsolePrintingService } from '../services/PrintService'; // Adjusted path

// Types
// import type { Order } from '../src/types/order.types'; // Adjusted path - only if directly used here

// Instantiate services if needed, or rely on default instances from hooks/services
const appPrintService = new ConsolePrintingService();

export default function KitchenPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('kitchen');
  const { t } = useTranslation();

  const {
    orders,
    activeOrders,
    completedOrders,
    stats,
    isLoading,
    error,
    orderForm,
    setOrderForm,
    isModalOpen,
    editingOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    updateOrderStatus,
    addItemToOrderForm,
    removeItemFromOrderForm,
    updateItemQuantityInForm,
    startEditOrder,
    openCreateModal,
    closeModal,
    refreshOrders,
  } = useOrderManagement(defaultOrderService);

  const {
    soundEnabled,
    toggleSound,
    activeAlert,
    showNotification,
    clearAlert,
    playNewOrderSound,
  } = useSoundNotification();

  const handleCreateOrderAndNotify = async () => {
    const newOrder = await createOrder();
    if (newOrder) {
      showNotification(`Order #${newOrder.orderNumber} created successfully!`);
      playNewOrderSound();
    }
  };

  const handlePrintOrder = async (orderId: string) => {
    const orderToPrint = orders.find(o => o.id === orderId);
    if (orderToPrint) {
        await appPrintService.printOrder(orderId, orderToPrint); // Assuming order details are needed by print service
        showNotification(`Printing order #${orderToPrint.orderNumber}`);
    } else {
        // Handle error: order not found
        showNotification(`Error: Order ID ${orderId} not found for printing.`);
        console.error("Order not found for printing:", orderId);
    }
  };

  // The `MantineProvider` is in `root.tsx`, so it's not needed here.
  return (
    <AppShell header={{ height: 70 }} padding="md">
      <AppHeader
          activeOrdersCount={stats.activeOrders}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
      />

      <AppShell.Main>
        {/* Notifications and Loading/Error states */}
        {activeAlert && (
          <Notification
            icon={<AlertCircle size={18} />}
            color="green"
            title="Notification"
            onClose={clearAlert}
            style={{ position: 'fixed', top: 80, right: 16, zIndex: 1100, minWidth: 320 }} // Higher zIndex if needed
          >
            {activeAlert}
          </Notification>
        )}
        {error && (
          <Notification color="red" title="Error" onClose={() => { /* Implement clear error in hook */ }}
            style={{ position: 'fixed', top: activeAlert ? 150 : 80, right: 16, zIndex: 1100, minWidth: 320 }}>
              {error}
          </Notification>
        )}
         {isLoading && !error && ( // Show loading only if no error
          <Notification loading title="Loading data..." withCloseButton={false}
            style={{ position: 'fixed', top: 80, right: 16, zIndex: 1100, minWidth: 320 }}>
              Please wait...
          </Notification>
        )}

        <Container size="xl" mt="md">
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'kitchen')}>
            <Tabs.List>
              <Tabs.Tab value="kitchen" leftSection={<ChefHat size={16} />}>
                {t('navigation.kitchen')}
              </Tabs.Tab>
              <Tabs.Tab value="management" leftSection={<ShoppingCart size={16} />}>
                {t('navigation.management')}
              </Tabs.Tab>
              <Tabs.Tab value="menu" leftSection={<Utensils size={16} />}>
                {t('navigation.menu')}
              </Tabs.Tab>
              <Tabs.Tab value="kiosk" leftSection={<Utensils size={16} />}>
                Customer Kiosk
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="kitchen" pt="md">
              <KitchenDisplayView
                activeOrders={activeOrders}
                completedOrders={completedOrders}
                onUpdateOrderStatus={updateOrderStatus}
                onPrintOrder={handlePrintOrder}
              />
            </Tabs.Panel>

            <Tabs.Panel value="management" pt="md">
              <OrderManagementView
                orders={orders}
                stats={stats}
                onOpenCreateModal={openCreateModal}
                onEditOrder={startEditOrder}
                onDeleteOrder={deleteOrder}
                onPrintOrder={handlePrintOrder}
              />
            </Tabs.Panel>

            <Tabs.Panel value="menu" pt="md">
              <MenuManagement />
            </Tabs.Panel>

            <Tabs.Panel value="kiosk" pt="md">
              <Container size="md" ta="center">
                <Stack gap="xl">
                  <Text size="xl" fw={600}>Customer Kiosk</Text>
                  <Text c="dimmed">
                    Open the customer-facing kiosk interface in a new window/tab for tablet use.
                  </Text>
                  <Button
                    size="xl"
                    component="a"
                    href="/kiosk"
                    target="_blank"
                    rel="noopener noreferrer"
                    leftSection={<Utensils size={24} />}
                    styles={{
                      root: {
                        minHeight: '80px',
                        fontSize: '20px',
                        minWidth: '300px'
                      }
                    }}
                  >
                    Launch Customer Kiosk
                  </Button>
                </Stack>
              </Container>
            </Tabs.Panel>
          </Tabs>
        </Container>

        <OrderFormModal
          isOpen={isModalOpen}
          onClose={closeModal}
          onSubmit={editingOrder ? updateOrder : handleCreateOrderAndNotify}
          formData={orderForm}
          onFormDataChange={(field, value) => setOrderForm(prev => ({ ...prev, [field]: value }))}
          onItemAdd={(itemName) => addItemToOrderForm(itemName).catch(console.error)}
          onItemRemove={removeItemFromOrderForm}
          onItemQuantityChange={updateItemQuantityInForm}
          calculateTotal={defaultOrderService.calculateOrderTotal}
          editingOrder={editingOrder}
        />
      </AppShell.Main>
      
    </AppShell>
  );
}