import { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Group,
  Text,
  Badge,
  Switch,
  Button,
  Modal,
  TextInput,
  NumberInput,
  Select,
  Divider,
  Tabs
} from '@mantine/core';
import { FileInput, Image } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { PRINTER_TYPES } from '../config/constants';
import { usePrintService } from '../hooks/usePrintService';
import { categoryService, type MenuCategory } from '../services/CategoryService';
import { menuItemService, type MenuItem } from '../services/MenuItemService';
import { translationService } from '../services/TranslationService';

export function MenuManagement() {
  const { t, i18n } = useTranslation();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [opened, setOpened] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [dutchCategories, setDutchCategories] = useState<MenuCategory[]>([]);
  const [categoryModalOpened, setCategoryModalOpened] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<MenuCategory>>({});
  const [activeTranslationTab, setActiveTranslationTab] = useState<string>('nl');
  const [itemTranslations, setItemTranslations] = useState<Record<string, { name: string; description: string }>>({});
  const [categoryTranslations, setCategoryTranslations] = useState<Record<string, { name: string; description: string }>>({});
  const { printTo } = usePrintService();

  useEffect(() => {
    loadDutchCategories();
    loadCategories();
    loadMenuItems();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [i18n.language]);

  useEffect(() => {
    loadMenuItems();
  }, [activeCategory, i18n.language, categories, dutchCategories]);

  const loadDutchCategories = async () => {
    try {
      const fetchedCategories = await categoryService.getCategories('nl');
      setDutchCategories(fetchedCategories.filter(cat => cat.is_active));
    } catch (error) {
      console.error('Failed to load Dutch categories:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const langMap: Record<string, string> = {
        'en': 'en',
        'nl': 'nl', 
        'fr': 'fr',
        'zh': 'zh-HK',
        'zh-HK': 'zh-HK'
      };
      const currentLang = i18n.language;
      const apiLangCode = langMap[currentLang] || currentLang;
      const fetchedCategories = await categoryService.getCategories(apiLangCode);
      setCategories(fetchedCategories.filter(cat => cat.is_active));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadMenuItems = async () => {
    try {
      let categoryName = undefined;
      if (activeCategory !== 'all') {
        // activeCategory contains the translated category name
        // Find the corresponding Dutch category name for API filtering
        const translatedCategory = categories.find(cat => cat.name === activeCategory);
        if (translatedCategory) {
          const dutchCategory = dutchCategories.find(cat => cat.id === translatedCategory.id);
          categoryName = dutchCategory?.name;
        }
      }
      
      const langMap: Record<string, string> = {
        'en': 'en',
        'nl': 'nl', 
        'fr': 'fr',
        'zh': 'zh-HK',
        'zh-HK': 'zh-HK'
      };
      const currentLang = i18n.language;
      const apiLangCode = langMap[currentLang] || currentLang;
      const fetchedItems = await menuItemService.getMenuItems(categoryName, apiLangCode);
      setMenuItems(fetchedItems);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const filteredItems = menuItems;


  const handleSaveItem = async () => {
    try {
      let savedItem: MenuItem;
      
      if (currentItem.id) {
        // Update existing
        savedItem = await menuItemService.updateMenuItem(currentItem.id, {
          name: currentItem.name,
          description: currentItem.description,
          price: currentItem.price,
          category: currentItem.category,
          is_available: currentItem.is_available,
          prep_time: currentItem.prep_time
        });
        
        // Update translations
        await translationService.updateMenuItemTranslations(currentItem.id, itemTranslations);
        
        setMenuItems(menuItems.map(item => 
          item.id === savedItem.id ? { ...savedItem, translations: itemTranslations } : item
        ));
      } else {
        // Add new
        savedItem = await menuItemService.createMenuItem({
          name: currentItem.name || '',
          description: currentItem.description || '',
          price: currentItem.price || 0,
          category: currentItem.category || '',
          is_available: currentItem.is_available ?? true,
          prep_time: currentItem.prep_time || 15
        });
        
        // Add translations for new item
        if (Object.keys(itemTranslations).length > 0) {
          await translationService.updateMenuItemTranslations(savedItem.id, itemTranslations);
        }
        
        setMenuItems([...menuItems, { ...savedItem, translations: itemTranslations }]);
      }
      
      setOpened(false);
      setCurrentItem({});
      setItemTranslations({});
      setActiveTranslationTab('nl');
    } catch (error) {
      console.error('Failed to save menu item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await menuItemService.deleteMenuItem(id);
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete menu item:', error);
    }
  };

  const handleSaveCategory = async () => {
    try {
      let savedCategory: MenuCategory;
      
      if (currentCategory.id) {
        // Update existing category
        savedCategory = await categoryService.updateCategory(currentCategory.id, {
          name: currentCategory.name,
          display_order: currentCategory.display_order,
          is_active: currentCategory.is_active,
          color: currentCategory.color,
          description: currentCategory.description
        });
        
        // Update translations if needed
        if (Object.keys(categoryTranslations).length > 0) {
          await translationService.updateCategoryTranslations(currentCategory.id, categoryTranslations);
        }
        
        setCategories(categories.map(cat => 
          cat.id === savedCategory.id ? { ...savedCategory, translations: categoryTranslations } : cat
        ));
      } else {
        // Create new category
        savedCategory = await categoryService.createCategory({
          name: currentCategory.name || '',
          display_order: currentCategory.display_order || categories.length + 1,
          is_active: currentCategory.is_active ?? true,
          color: currentCategory.color || '#228be6',
          description: currentCategory.description
        });
        
        // Add translations for new category
        if (Object.keys(categoryTranslations).length > 0) {
          await translationService.updateCategoryTranslations(savedCategory.id, categoryTranslations);
        }
        
        setCategories([...categories, { ...savedCategory, translations: categoryTranslations }]);
      }
      
      setCategoryModalOpened(false);
      setCurrentCategory({});
      setCategoryTranslations({});
      setActiveTranslationTab('nl');
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await categoryService.deleteCategory(categoryId);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      const deletedCategory = categories.find(cat => cat.id === categoryId);
      if (activeCategory === deletedCategory?.name) {
        setActiveCategory('all');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Group justify="space-between" mb="md">
        <Text size="xl" fw={700}>Menu Management</Text>
        <Group>
          <Button onClick={() => setCategoryModalOpened(true)}>Manage Categories</Button>
          <Button onClick={() => setOpened(true)}>Add New Item</Button>
        </Group>
      </Group>

      <Group gap="xs" mb="md">
        <Button 
          variant={activeCategory === 'all' ? 'filled' : 'outline'}
          onClick={() => setActiveCategory('all')}
        >
          All
        </Button>
        {categories.map(category => (
          <Button
            key={category.id}
            variant={activeCategory === category.name ? 'filled' : 'outline'}
            onClick={() => setActiveCategory(category.name)}
            style={{ backgroundColor: activeCategory === category.name ? category.color : undefined }}
          >
            {category.name}
          </Button>
        ))}
      </Group>

      <Group mb="md">
        <Button onClick={() => printTo(PRINTER_TYPES.KITCHEN, menuItems.map(item => ({
          ...item,
          quantity: 1,
          modifications: [],
          preparationTime: item.prep_time,
          dietaryOptions: [],
          allergens: [],
          available: item.is_available
        })))}>
          Print Kitchen Menu
        </Button>
        <Button onClick={() => printTo(PRINTER_TYPES.CUSTOMER, menuItems.map(item => ({
          ...item,
          quantity: 1,
          modifications: [],
          preparationTime: item.prep_time,
          dietaryOptions: [],
          allergens: [],
          available: item.is_available
        })))}>
          Print Customer Menu
        </Button>
      </Group>

      <Grid>
        {filteredItems.map(item => (
          <Grid.Col key={item.id} span={4}>
            <Card shadow="sm" padding="lg">
              <Group justify="space-between">
                <Text fw={500}>{item.name}</Text>
                <Switch 
                  checked={item.is_available} 
                  onChange={async (e) => {
                    const updatedItem = await menuItemService.updateMenuItem(item.id, {
                      is_available: e.currentTarget.checked
                    });
                    setMenuItems(menuItems.map(i => 
                      i.id === item.id ? updatedItem : i
                    ));
                  }}
                />
              </Group>

              <Text size="sm" c="dimmed" mt="xs">
                {item.description}
              </Text>

              <Group gap="xs" mt="md">
                <Badge color="green">€{item.price.toFixed(2)}</Badge>
                <Badge color="blue">{item.prep_time} min</Badge>
                <Badge color="gray">{item.category}</Badge>
              </Group>

              <Group mt="md">
                <Button 
                  variant="light" 
                  size="xs"
                  onClick={() => {
                    setCurrentItem(item);
                    setItemTranslations(item.translations || {});
                    setOpened(true);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="light" 
                  color="red" 
                  size="xs"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setCurrentItem({});
          setItemTranslations({});
          setActiveTranslationTab('nl');
        }}
        title={currentItem.id ? "Edit Menu Item" : "Add New Menu Item"}
        size="lg"
      >
        <FileInput
          label="Item Image"
          placeholder="Upload image"
          accept="image/*"
          value={imageFile}
          onChange={setImageFile}
          mb="sm"
        />
        {imageFile && (
          <Image
            src={URL.createObjectURL(imageFile)}
            height={160}
            alt="Menu item preview"
            mb="sm"
          />
        )}
        <Tabs value={activeTranslationTab} onChange={(value) => setActiveTranslationTab(value || 'nl')}>
          <Tabs.List>
            <Tabs.Tab value="nl">🇳🇱 Nederlands</Tabs.Tab>
            <Tabs.Tab value="en">🇬🇧 English</Tabs.Tab>
            <Tabs.Tab value="fr">🇫🇷 Français</Tabs.Tab>
            <Tabs.Tab value="zh-HK">🇭🇰 中文</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="nl">
            <TextInput
              label="Name (Nederlands)"
              value={currentItem.name || ''}
              onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
              mb="sm"
            />
            <TextInput
              label="Description (Nederlands)"
              value={currentItem.description || ''}
              onChange={(e) => setCurrentItem({...currentItem, description: e.target.value})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="en">
            <TextInput
              label="Name (English)"
              value={itemTranslations.en?.name || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, en: {...(itemTranslations.en || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (English)"
              value={itemTranslations.en?.description || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, en: {...(itemTranslations.en || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="fr">
            <TextInput
              label="Name (Français)"
              value={itemTranslations.fr?.name || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, fr: {...(itemTranslations.fr || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (Français)"
              value={itemTranslations.fr?.description || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, fr: {...(itemTranslations.fr || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="zh-HK">
            <TextInput
              label="Name (中文)"
              value={itemTranslations['zh-HK']?.name || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, 'zh-HK': {...(itemTranslations['zh-HK'] || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (中文)"
              value={itemTranslations['zh-HK']?.description || ''}
              onChange={(e) => setItemTranslations({...itemTranslations, 'zh-HK': {...(itemTranslations['zh-HK'] || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>
        </Tabs>

        <Select
          label="Category"
          data={categories.map(cat => ({ value: cat.name, label: cat.name }))}
          value={currentItem.category}
          onChange={(value) => setCurrentItem({...currentItem, category: value || undefined})}
          mb="sm"
        />

        <NumberInput
          label="Price (€)"
          value={currentItem.price || 0}
          onChange={(value) => setCurrentItem({...currentItem, price: Number(value)})}
          decimalScale={2}
          min={0}
          mb="sm"
        />

        <NumberInput
          label="Preparation Time (minutes)"
          value={currentItem.prep_time || 15}
          onChange={(value) => setCurrentItem({...currentItem, prep_time: Number(value)})}
          min={0}
          mb="sm"
        />


        <Button fullWidth onClick={handleSaveItem} mt="md">
          Save
        </Button>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        opened={categoryModalOpened}
        onClose={() => {
          setCategoryModalOpened(false);
          setCurrentCategory({});
          setCategoryTranslations({});
          setActiveTranslationTab('nl');
        }}
        title="Manage Categories"
        size="lg"
      >
        <Group justify="space-between" mb="md">
          <Text fw={500}>Categories</Text>
          <Button 
            size="sm"
            onClick={() => {
              setCurrentCategory({});
              // Keep modal open for adding new category
            }}
          >
            Add Category
          </Button>
        </Group>

        {/* Category List */}
        <div style={{ marginBottom: '20px' }}>
          {categories.map(category => (
            <Card key={category.id} shadow="sm" padding="sm" mb="xs">
              <Group justify="space-between">
                <Group>
                  <div 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      borderRadius: '50%', 
                      backgroundColor: category.color 
                    }}
                  />
                  <div>
                    <Text fw={500}>{category.name}</Text>
                    <Text size="xs" c="dimmed">{category.description}</Text>
                  </div>
                </Group>
                <Group>
                  <Switch 
                    checked={category.is_active} 
                    onChange={(e) => {
                      const updated = { ...category, is_active: e.currentTarget.checked };
                      categoryService.updateCategory(category.id, updated);
                      setCategories(categories.map(cat => cat.id === category.id ? updated : cat));
                    }}
                  />
                  <Button 
                    size="xs" 
                    variant="light"
                    onClick={() => {
                      setCurrentCategory(category);
                      setCategoryTranslations(category.translations || {});
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="xs" 
                    variant="light" 
                    color="red"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    Delete
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </div>

        {/* Category Form */}
        <Divider my="md" />
        <Text fw={500} mb="md">
          {currentCategory.id ? 'Edit Category' : 'Add New Category'}
        </Text>
        
        <Tabs value={activeTranslationTab} onChange={(value) => setActiveTranslationTab(value || 'nl')} mb="md">
          <Tabs.List>
            <Tabs.Tab value="nl">🇳🇱 Nederlands</Tabs.Tab>
            <Tabs.Tab value="en">🇬🇧 English</Tabs.Tab>
            <Tabs.Tab value="fr">🇫🇷 Français</Tabs.Tab>
            <Tabs.Tab value="zh-HK">🇭🇰 中文</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="nl">
            <TextInput
              label="Category Name (Nederlands)"
              value={currentCategory.name || ''}
              onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
              mb="sm"
              required
            />
            <TextInput
              label="Description (Nederlands)"
              value={currentCategory.description || ''}
              onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="en">
            <TextInput
              label="Category Name (English)"
              value={categoryTranslations.en?.name || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, en: {...(categoryTranslations.en || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (English)"
              value={categoryTranslations.en?.description || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, en: {...(categoryTranslations.en || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="fr">
            <TextInput
              label="Category Name (Français)"
              value={categoryTranslations.fr?.name || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, fr: {...(categoryTranslations.fr || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (Français)"
              value={categoryTranslations.fr?.description || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, fr: {...(categoryTranslations.fr || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>

          <Tabs.Panel value="zh-HK">
            <TextInput
              label="Category Name (中文)"
              value={categoryTranslations['zh-HK']?.name || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, 'zh-HK': {...(categoryTranslations['zh-HK'] || {}), name: e.target.value}})}
              mb="sm"
            />
            <TextInput
              label="Description (中文)"
              value={categoryTranslations['zh-HK']?.description || ''}
              onChange={(e) => setCategoryTranslations({...categoryTranslations, 'zh-HK': {...(categoryTranslations['zh-HK'] || {}), description: e.target.value}})}
              mb="sm"
            />
          </Tabs.Panel>
        </Tabs>
        
        <TextInput
          label="Color"
          value={currentCategory.color || '#228be6'}
          onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})}
          mb="sm"
          type="color"
        />
        
        <NumberInput
          label="Display Order"
          value={currentCategory.display_order || categories.length + 1}
          onChange={(value) => setCurrentCategory({...currentCategory, display_order: Number(value)})}
          mb="sm"
          min={1}
        />
        
        <Button fullWidth onClick={handleSaveCategory} mt="md">
          {currentCategory.id ? 'Update Category' : 'Create Category'}
        </Button>
      </Modal>
    </div>
  );
}