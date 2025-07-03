import React from 'react';
import { AppShell, Container, Group, Title, Text, ActionIcon } from '@mantine/core';
import { ChefHat, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../LanguageSwitcher/LanguageSwitcher';

interface AppHeaderProps {
  activeOrdersCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ activeOrdersCount, soundEnabled, onToggleSound }) => {
  const { t } = useTranslation();

  return (
    <AppShell.Header>
      <Container size="xl" h="100%">
        <Group h="100%" justify="space-between">
          <Group>
            <ChefHat size={32} color="#228be6" /> {/* Or use theme color */}
            <Title order={2} c="blue">Kitchen Display System</Title>
          </Group>
          <Group>
            <LanguageSwitcher />
            <Text size="sm" c="dimmed">Active Orders: {activeOrdersCount}</Text>
            <ActionIcon variant="light" size="lg" onClick={onToggleSound}>
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </ActionIcon>
          </Group>
        </Group>
      </Container>
    </AppShell.Header>
  );
};