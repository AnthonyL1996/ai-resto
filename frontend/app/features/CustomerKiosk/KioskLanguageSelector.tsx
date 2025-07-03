import React from 'react';
import { Grid, Card, Group, Text, Box } from '@mantine/core';
import { Globe } from 'lucide-react';

type Language = 'nl' | 'fr' | 'de' | 'en' | 'zh';

interface KioskLanguageSelectorProps {
  onLanguageSelect: (language: Language) => void;
}

const languages = [
  { code: 'nl' as Language, name: 'Nederlands', flag: '🇳🇱' },
  { code: 'fr' as Language, name: 'Français', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'zh' as Language, name: '粵語', flag: '🇭🇰' },
];

export const KioskLanguageSelector: React.FC<KioskLanguageSelectorProps> = ({ onLanguageSelect }) => {
  return (
    <Box p="xl" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Group justify="center" mb="xl">
        <Globe size={48} color="#228be6" />
        <Text size="xl" fw={600}>Choose Your Language / Choisissez votre langue</Text>
      </Group>
      
      <Grid justify="center" gutter="xl">
        {languages.map((lang) => (
          <Grid.Col key={lang.code} span={{ base: 12, sm: 6, md: 4 }}>
            <Card
              shadow="lg"
              padding="xl"
              radius="md"
              style={{ cursor: 'pointer', minHeight: '120px' }}
              onClick={() => onLanguageSelect(lang.code)}
              className="hover:scale-105 transition-transform"
            >
              <Group justify="center">
                <Text size={48}>{lang.flag}</Text>
                <Text size="lg" fw={500} ta="center">{lang.name}</Text>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Box>
  );
};