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
  ActivityIndicator,
  IconButton,
  Chip,
  FAB,
  Button,
  Searchbar,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme, spacing, typography } from '../theme';
import api from '../config/api';

interface InventoryItem {
  _id: string;
  name: string;
  barcode: string;
  category: string;
  quantity: number;
  expiryDate: string;
  storageLocation?: {
    warehouse?: string;
    zone?: string;
    rack?: string;
    shelf?: string;
    slot?: number;
  };
}

interface Shelf {
  _id: string;
  name: string;
  code: string;
  shelfNumber: number;
  capacity: {
    totalSlots: number;
    usedSlots: number;
    availableSlots: number;
    totalWeight: number;
    usedWeight: number;
    availableWeight: number;
  };
  utilizationPercentage: number;
  cleaningStatus: string;
  isActive: boolean;
}

const InventoryPlacementScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { shelfId } = route.params as { shelfId: string };
  const { user } = useAuth();
  
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [shelfId]);

  const fetchData = async () => {
    try {
      const [shelfResponse, inventoryResponse] = await Promise.all([
        api.get(`/api/shelves/${shelfId}`),
        api.get('/api/inventory/unassigned'),
      ]);
      
      setShelf(shelfResponse.data.data);
      setInventoryItems(inventoryResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.barcode.includes(searchQuery) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const assignItemsToShelf = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select items to assign to this shelf.');
      return;
    }

    try {
      await api.post(`/api/shelves/${shelfId}/assign-items`, {
        itemIds: selectedItems
      });
      
      Alert.alert('Success', 'Items assigned to shelf successfully');
      setSelectedItems([]);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error assigning items:', error);
      Alert.alert('Error', 'Failed to assign items to shelf');
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return theme.colors.error;
    if (days <= 30) return theme.colors.warning;
    return theme.colors.success;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading inventory data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.headerTitle}>Inventory Placement</Title>
          <Text style={styles.headerSubtitle}>
            Smart shelf assignment for inventory items
          </Text>
        </View>

        {/* Shelf Information */}
        {shelf && (
          <Card style={styles.shelfCard}>
            <Card.Content>
              <View style={styles.shelfHeader}>
                <View style={styles.shelfInfo}>
                  <Title style={styles.shelfName}>{shelf.name}</Title>
                  <Text style={styles.shelfCode}>Code: {shelf.code}</Text>
                  <Text style={styles.shelfNumber}>Shelf {shelf.shelfNumber}</Text>
                </View>
                <View style={styles.shelfStatus}>
                  <Chip
                    mode="outlined"
                    style={[
                      styles.statusChip,
                      { backgroundColor: shelf.isActive ? theme.colors.success : theme.colors.disabled }
                    ]}
                  >
                    {shelf.isActive ? 'Active' : 'Inactive'}
                  </Chip>
                </View>
              </View>

              <View style={styles.capacityInfo}>
                <Text style={styles.capacityTitle}>Available Capacity</Text>
                <View style={styles.capacityDetails}>
                  <Text style={styles.capacityText}>
                    Slots: {shelf.capacity.availableSlots}/{shelf.capacity.totalSlots}
                  </Text>
                  <Text style={styles.capacityText}>
                    Weight: {shelf.capacity.availableWeight.toFixed(1)}/{shelf.capacity.totalWeight.toFixed(1)} kg
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search inventory items..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
        </View>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <Card style={styles.selectedCard}>
            <Card.Content>
              <View style={styles.selectedHeader}>
                <Text style={styles.selectedTitle}>
                  Selected Items ({selectedItems.length})
                </Text>
                <Button
                  mode="contained"
                  onPress={assignItemsToShelf}
                  style={styles.assignButton}
                >
                  Assign to Shelf
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Inventory Items List */}
        <View style={styles.itemsSection}>
          <Title style={styles.sectionTitle}>Available Items</Title>

          {filteredItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Title style={styles.emptyTitle}>No Items Found</Title>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No items match your search criteria' : 'No unassigned inventory items available'}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            filteredItems.map((item) => {
              const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
              const isSelected = selectedItems.includes(item._id);
              
              return (
                <Card 
                  key={item._id} 
                  style={[
                    styles.itemCard,
                    isSelected && styles.selectedItemCard
                  ]}
                  onPress={() => toggleItemSelection(item._id)}
                >
                  <Card.Content>
                    <View style={styles.itemHeader}>
                      <View style={styles.itemInfo}>
                        <Title style={styles.itemName}>{item.name}</Title>
                        <Text style={styles.itemBarcode}>Barcode: {item.barcode}</Text>
                        <Text style={styles.itemCategory}>Category: {item.category}</Text>
                      </View>
                      <View style={styles.itemStatus}>
                        <Chip
                          mode="outlined"
                          style={[
                            styles.selectionChip,
                            { backgroundColor: isSelected ? theme.colors.primary : 'transparent' }
                          ]}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Chip>
                      </View>
                    </View>

                    <View style={styles.itemDetails}>
                      <Text style={styles.itemQuantity}>
                        Quantity: {item.quantity}
                      </Text>
                      <Text style={[
                        styles.itemExpiry,
                        { color: getExpiryColor(daysUntilExpiry) }
                      ]}>
                        Expires: {new Date(item.expiryDate).toLocaleDateString()} 
                        ({daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'})
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.text,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  shelfCard: {
    margin: spacing.lg,
    elevation: 2,
  },
  shelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  shelfInfo: {
    flex: 1,
  },
  shelfName: {
    fontSize: typography.h5.fontSize,
    fontWeight: typography.h5.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  shelfCode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  shelfNumber: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  shelfStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: spacing.xs,
  },
  capacityInfo: {
    marginTop: spacing.md,
  },
  capacityTitle: {
    fontSize: typography.body2.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  capacityDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  capacityText: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
  },
  searchSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  searchBar: {
    elevation: 2,
  },
  selectedCard: {
    margin: spacing.lg,
    marginTop: 0,
    backgroundColor: theme.colors.primary,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedTitle: {
    fontSize: typography.body1.fontSize,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  assignButton: {
    backgroundColor: theme.colors.surface,
  },
  itemsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.md,
  },
  itemCard: {
    marginBottom: spacing.md,
    elevation: 1,
  },
  selectedItemCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.h6.fontSize,
    fontWeight: typography.h6.fontWeight,
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  itemBarcode: {
    fontSize: typography.caption.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    marginBottom: spacing.xs,
  },
  itemCategory: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
  },
  itemStatus: {
    alignItems: 'flex-end',
  },
  selectionChip: {
    borderColor: theme.colors.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemQuantity: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    fontWeight: '500',
  },
  itemExpiry: {
    fontSize: typography.body2.fontSize,
    fontWeight: '500',
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: typography.h4.fontWeight,
    color: theme.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: typography.body2.fontSize,
    color: theme.colors.text,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default InventoryPlacementScreen;
