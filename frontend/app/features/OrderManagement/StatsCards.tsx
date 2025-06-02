import React from 'react';
import { Grid, Card, Group, Box, Text } from '@mantine/core';
import { ShoppingCart, Clock, Check, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting'; // Adjust path

interface StatsCardsProps {
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedToday: number;
    totalRevenue: number;
  };
}

const StatCard: React.FC<{ icon: React.ReactNode; value: string | number; label: string; color: string }> = ({ icon, value, label, color }) => (
    <Card withBorder>
        <Group>
            {React.cloneElement(icon as React.ReactElement, { color: `var(--mantine-color-${color}-6)`})}
            <Box>
                <Text size="xl" fw={700}>{value}</Text>
                <Text size="sm" c="dimmed">{label}</Text>
            </Box>
        </Group>
    </Card>
);


export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <Grid mb="xl">
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <StatCard icon={<ShoppingCart size={24}/>} value={stats.totalOrders} label="Total Orders" color="blue"/>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <StatCard icon={<Clock size={24}/>} value={stats.activeOrders} label="Active Orders" color="red"/>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <StatCard icon={<Check size={24}/>} value={stats.completedToday} label="Completed Today" color="green"/>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
        <StatCard icon={<DollarSign size={24}/>} value={formatCurrency(stats.totalRevenue)} label="Revenue Today" color="yellow"/>
      </Grid.Col>
    </Grid>
  );
};