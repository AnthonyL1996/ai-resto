import React from 'react';
import { Box, Title, Grid, Paper, Group, Text, Badge } from '@mantine/core';
import type { Order } from '../../types/order.types'; // Adjust path

interface RecentlyCompletedProps {
    orders: Order[];
}

export const RecentlyCompleted: React.FC<RecentlyCompletedProps> = ({ orders }) => {
    if (orders.length === 0) return null;

    return (
        <Box mt="xl">
            <Title order={3} c="dimmed" mb="md">Recently Completed</Title>
            <Grid>
                {orders.map((order) => (
                    <Grid.Col key={order.id} span={{ base: 12, md: 6, lg: 4 }}>
                        <Paper p="md" withBorder style={{ opacity: 0.7 }}>
                            <Group justify="space-between">
                                <Box>
                                    <Text fw={500}>Order #{order.orderNumber}</Text>
                                    <Text size="sm" c="dimmed">{order.customerName}</Text>
                                </Box>
                                <Badge color="gray" variant="light">Completed</Badge>
                            </Group>
                        </Paper>
                    </Grid.Col>
                ))}
            </Grid>
        </Box>
    );
};