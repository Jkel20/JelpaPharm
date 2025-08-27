import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  ActivityIndicator,
  Text,
  IconButton,
} from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { API_BASE_URL } from '../../config/api';
import { theme, spacing, typography } from '../../theme';

interface SearchResult {
  _id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  prescriptionNumber?: string;
  customerId?: string;
  phone?: string;
  email?: string;
  status?: string;
  category?: string;
  quantity?: number;
  prescribedBy?: string;
  transactionNumber?: string;
  orderNumber?: string;
  contactPerson?: string;
  type: 'inventory' | 'customer' | 'prescription' | 'supplier' | 'sales' | 'purchase-order';
}

interface SearchComponentProps {
  searchTypes: ('inventory' | 'customer' | 'prescription' | 'supplier' | 'sales' | 'purchase-order')[];
  onResultSelect: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  style?: any;
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  searchTypes,
  onResultSelect,
  placeholder = 'Search...',
  showFilters = true,
  style,
}) => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(searchTypes[0]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [debouncedQuery, selectedType]);

  const performSearch = async () => {
    if (!debouncedQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/${getSearchEndpoint(selectedType)}/${encodeURIComponent(debouncedQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const typedResults = data.data.map((item: any) => ({
          ...item,
          type: selectedType,
        }));
        setResults(typedResults);
      } else {
        console.error('Search failed:', response.status);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const getSearchEndpoint = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'inventory';
      case 'customer':
        return 'customers/search';
      case 'prescription':
        return 'prescriptions/search';
      case 'supplier':
        return 'suppliers/search';
      case 'sales':
        return 'sales/search';
      case 'purchase-order':
        return 'suppliers/purchase-orders/search';
      default:
        return 'inventory';
    }
  };

  const getResultTitle = (result: SearchResult) => {
    switch (result.type) {
      case 'inventory':
        return result.name || 'Unknown Item';
      case 'customer':
        return `${result.firstName || ''} ${result.lastName || ''}`.trim() || 'Unknown Customer';
      case 'prescription':
        return result.prescriptionNumber || 'Unknown Prescription';
      case 'supplier':
        return result.name || 'Unknown Supplier';
      case 'sales':
        return result.transactionNumber || 'Unknown Transaction';
      case 'purchase-order':
        return result.orderNumber || 'Unknown Order';
      default:
        return 'Unknown';
    }
  };

  const getResultSubtitle = (result: SearchResult) => {
    switch (result.type) {
      case 'inventory':
        return `${result.category || 'No Category'} • Qty: ${result.quantity || 0}`;
      case 'customer':
        return `${result.phone || 'No Phone'} • ${result.customerId || 'No ID'}`;
      case 'prescription':
        return `${result.prescribedBy || 'Unknown Doctor'} • ${result.status || 'Unknown Status'}`;
      case 'supplier':
        return `${result.contactPerson || 'No Contact'} • ${result.email || 'No Email'}`;
      case 'sales':
        return `${result.status || 'Unknown Status'}`;
      case 'purchase-order':
        return `${result.status || 'Unknown Status'}`;
      default:
        return '';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'inventory':
        return theme.colors.primary;
      case 'customer':
        return theme.colors.secondary;
      case 'prescription':
        return theme.colors.tertiary;
      case 'supplier':
        return theme.colors.success;
      case 'sales':
        return theme.colors.warning;
      case 'purchase-order':
        return theme.colors.info;
      default:
        return theme.colors.primary;
    }
  };

  const renderSearchResult = (result: SearchResult) => (
    <TouchableOpacity
      key={`${result.type}-${result._id}`}
      onPress={() => onResultSelect(result)}
    >
      <Card style={styles.resultCard}>
        <Card.Content>
          <View style={styles.resultHeader}>
            <View style={styles.resultInfo}>
              <Title style={styles.resultTitle}>{getResultTitle(result)}</Title>
              <Paragraph style={styles.resultSubtitle}>
                {getResultSubtitle(result)}
              </Paragraph>
            </View>
            <Chip
              mode="outlined"
              textStyle={{ color: getTypeColor(result.type) }}
              style={[styles.typeChip, { borderColor: getTypeColor(result.type) }]}
            >
              {result.type.replace('-', ' ').toUpperCase()}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      <Searchbar
        placeholder={placeholder}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
        loading={loading}
      />

      {/* Type Filter */}
      {showFilters && searchTypes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {searchTypes.map((type) => (
            <Chip
              key={type}
              selected={selectedType === type}
              onPress={() => setSelectedType(type)}
              style={styles.filterChip}
              mode={selectedType === type ? 'flat' : 'outlined'}
            >
              {type.replace('-', ' ').toUpperCase()}
            </Chip>
          ))}
        </ScrollView>
      )}

      {/* Search Results */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {!loading && results.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {results.map(renderSearchResult)}
        </ScrollView>
      )}

      {!loading && debouncedQuery.length >= 2 && results.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search terms or filters
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  filterScroll: {
    marginBottom: spacing.md,
  },
  filterContainer: {
    paddingHorizontal: spacing.sm,
  },
  filterChip: {
    marginRight: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    ...typography.body2,
    color: theme.colors.textSecondary,
  },
  resultsContainer: {
    flex: 1,
  },
  resultCard: {
    marginBottom: spacing.sm,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  resultTitle: {
    ...typography.subtitle1,
    marginBottom: spacing.xs,
  },
  resultSubtitle: {
    ...typography.body2,
    color: theme.colors.textSecondary,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.h6,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default SearchComponent;
