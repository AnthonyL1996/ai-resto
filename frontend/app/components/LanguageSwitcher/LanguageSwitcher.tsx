import React from 'react';
import { Select, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'zh-HK', label: '廣東話', flag: '🇭🇰' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (value: string | null) => {
    if (value) {
      i18n.changeLanguage(value);
    }
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleLanguageChange}
      data={languages.map(lang => ({
        value: lang.value,
        label: `${lang.flag} ${lang.label}`,
      }))}
      placeholder={t('language.select')}
      styles={{
        input: {
          minWidth: 160,
        },
      }}
      comboboxProps={{
        withinPortal: true,
      }}
    />
  );
};

export default LanguageSwitcher;