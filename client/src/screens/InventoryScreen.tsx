import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Searchbar,
  Button,
  Chip,
  FAB,
  List,
  IconButton,
  Menu,
  Divider,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { CanCreate, CanUpdate, CanDelete, PharmacistOrAdmin } from '../components/Common/PermissionGuard';
import { theme, spacing, typography } from '../theme';
import { API_ENDPOINTS, apiHelpers } from '../config/api';
import api from '../config/api';
import Footer from '../components/Layout/Footer';

interface InventoryItem {
  _id: string;
  name: string;
  brandName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  expiryDate: string;
  isLowStock: boolean;
  isExpiringSoon: boolean;
  stockStatus: string;
}

const InventoryScreen: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const categories = [
    'all',
    'Analgesics',
    'Antibiotics',
    'Antihypertensives',
    'Antidiabetics',
    'Antimalarials',
    'Vitamins',
    'Supplements',
    'First Aid',
    'Personal Care',
    'Medical Devices',
    'Other',
  ];

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchQuery, selectedCategory]);

  const fetchInventory = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.INVENTORY.LIST);
      setInventory(response.data.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const filterInventory = () => {
    let filtered = inventory;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brandName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredInventory(filtered);
  };

  const getStockStatusColor = (status: string): string => {
    switch (status) {
      case 'Out of Stock':
        return theme.colors.error;
      case 'Low Stock':
        return theme.colors.warning;
      case 'Expiring Soon':
        return theme.colors.warning;
      default:
        return theme.colors.success;
    }
  };

  const handleAddItem = () => {
    // Navigate to add item screen
    Alert.alert('Add Item', 'Navigate to add item form');
  };

  const handleEditItem = (itemId: string) => {
    // Navigate to edit item screen
    Alert.alert('Edit Item', `Edit item with ID: ${itemId}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(API_ENDPOINTS.INVENTORY.DELETE(itemId));
              await fetchInventory();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const renderInventoryItem = (item: InventoryItem) => (
    <Card key={item._id} style={styles.inventoryCard}>
      <Card.Content>
        <View style={styles.itemHeader}>
          <View style={styles.itemInfo}>
            <Title style={styles.itemName}>{item.name}</Title>
            <Text style={styles.itemBrand}>{item.brandName}</Text>
            <Text style={styles.itemCategory}>{item.category}</Text>
          </View>
          <Menu
            visible={menuVisible === item._id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(item._id)}
              />
            }
          >
            <CanUpdate resource="inventory">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleEditItem(item._id);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
            </CanUpdate>
            <CanDelete resource="inventory">
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  handleDeleteItem(item._id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </CanDelete>
          </Menu>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.itemDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit Price:</Text>
            <Text style={styles.detailValue}>
              {apiHelpers.formatCurrency(item.unitPrice)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Selling Price:</Text>
            <Text style={styles.detailValue}>
              {apiHelpers.formatCurrency(item.sellingPrice)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Expiry Date:</Text>
            <Text style={styles.detailValue}>
              {apiHelpers.formatDate(item.expiryDate)}
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <Chip
            mode="outlined"
            textStyle={{
              color: getStockStatusColor(item.stockStatus),
            }}
            style={[
              styles.statusChip,
              { borderColor: getStockStatusColor(item.stockStatus) },
            ]}
          >
            {item.stockStatus}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pharmacyName}>JELPAPHARM</Text>
          <Text style={styles.pharmacySubtitle}>Pharmacy Management System</Text>
          <Title style={styles.headerTitle}>Inventory Management</Title>
          <Text style={styles.headerSubtitle}>
            Manage your pharmacy inventory
          </Text>
        </View>

        {/* Search Bar */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Searchbar
              placeholder="Search inventory..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
            />
          </Card.Content>
        </Card>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              style={styles.categoryChip}
              mode={selectedCategory === category ? 'flat' : 'outlined'}
            >
              {category === 'all' ? 'All Categories' : category}
            </Chip>
          ))}
        </ScrollView>

        {/* Inventory List */}
        <View style={styles.inventoryContainer}>
          {filteredInventory.length > 0 ? (
            filteredInventory.map(renderInventoryItem)
          ) : (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyText}>
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No items found matching your criteria'
                    : 'No inventory items found'}
                </Text>
                <CanCreate resource="inventory">
                  <Button
                    mode="contained"
                    onPress={handleAddItem}
                    style={styles.addButton}
                  >
                    Add First Item
                  </Button>
                </CanCreate>
              </Card.Content>
            </Card>
          )}
        </View>
        
        <Footer 
          customText="Complete inventory management with stock tracking"
        />
      </ScrollView>

      {/* Floating Action Button */}
      <CanCreate resource="inventory">
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddItem}
          label="Add Item"
        />
      </CanCreate>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  pharmacyName: {
    ...typography.h4,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  pharmacySubtitle: {
    ...typography.body1,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  searchCard: {
    margin: spacing.lg,
    marginTop: 0,
    elevation: 2,
  },
  searchbar: {
    backgroundColor: theme.colors.background,
  },
  categoryScroll: {
    marginBottom: spacing.md,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
  },
  categoryChip: {
    marginRight: spacing.sm,
  },
  inventoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  inventoryCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.h5,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  itemBrand: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  itemCategory: {
    ...typography.caption,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  itemDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.body2,
    color: theme.colors.text,
    opacity: 0.7,
  },
  detailValue: {
    ...typography.body2,
    color: theme.colors.text,
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  emptyCard: {
    marginTop: spacing.xl,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body1,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default InventoryScreen;
