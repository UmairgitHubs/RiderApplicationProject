import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useShipments } from '../../hooks/useShipments';
import ShipmentDetailsPopup from './ShipmentDetailsPopup';

// --- Custom Hooks (can be moved to separate files) ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Interfaces ---
interface Shipment {
  id: string;
  trackingNumber: string;
  recipientName: string;
  deliveryAddress: string;
  packageCount: number;
  deliveryFee: number;
  status: 'pending' | 'in-transit' | 'delivered' | 'cancelled';
  createdAt: string;
}


export default function ShipmentsListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // -- State --
  const initialFilter = (route.params as any)?.initialFilter || 'all';
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'in-transit' | 'delivered'>(initialFilter);
  const [searchQueryParam, setSearchQueryParam] = useState('');
  
  // Popup State
  const [showShipmentPopup, setShowShipmentPopup] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(null);
  
  // Debounce search query to avoid API spam
  
  // Debounce search query to avoid API spam
  const debouncedSearch = useDebounce(searchQueryParam, 500);

  // -- Data Fetching --
  const {
    data,
    isLoading,
    isRefetching, // Note: infinite query uses isRefetching differently usually, we often use isRefetching for Pull-to-Refresh
    isFetchingNextPage,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useShipments({
    status: selectedFilter,
    search: debouncedSearch,
    limit: 15,
  });

  // Flatten pages into a single list
  const allShipments = useMemo(() => {
    return data?.pages.flatMap((page: any) => page.shipments || []) || [];
  }, [data]);

  // -- Helpers --
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'in_transit': 
      case 'in-transit': return '#9C27B0';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Pickup';
      case 'in_transit': 
      case 'in-transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  // -- Render Items --
  const renderItem: ListRenderItem<Shipment> = ({ item }) => {
    // Determine if this is a franchise/bulk order
    // In a real app, check item.shipmentType === 'franchise'
    const isFranchise = item.packageCount > 1;

    return (
    <TouchableOpacity 
      style={styles.shipmentCard}
      onPress={() => {
        if (isFranchise) {
             navigation.navigate('FranchiseOrderDetails', { shipment: item });
        } else {
             setSelectedShipmentId(item.id);
             setShowShipmentPopup(true);
        }
      }}
    >
      <View style={styles.shipmentHeader}>
        <View style={styles.shipmentHeaderLeft}>
          <Ionicons name={isFranchise ? "business" : "cube"} size={20} color={isFranchise ? '#8A2BE2' : colors.primary} />
          <Text style={styles.trackingId}>{item.trackingNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.shipmentContent}>
        <View style={styles.recipientRow}>
          <Ionicons name="person-outline" size={16} color={colors.textLight} />
          <Text style={styles.recipient}>
              {isFranchise ? 'Multiple Receivers' : item.recipientName}
          </Text>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.textLight} />
          <Text style={styles.address} numberOfLines={1}>
              {item.deliveryAddress}
          </Text>
        </View>

        <View style={styles.shipmentFooter}>
          <View style={styles.itemRow}>
            <Ionicons name="pricetag-outline" size={16} color={colors.textLight} />
            <Text style={styles.item}>
              {item.packageCount ? `${item.packageCount} Packages` : 'Package'}
            </Text>
          </View>
          <Text style={styles.price}>
            ${(Number(item.deliveryFee) || 0).toFixed(2)}
          </Text>
        </View>

        {isFranchise && (
            <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => navigation.navigate('FranchiseOrderDetails', { shipment: item })}
            >
                <Text style={styles.trackButtonText}>Track All Orders</Text>
                <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
        )}

        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: 100 }} />; // Bottom padding
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
       return (
         <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={colors.primary} />
         </View>
       );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cube-outline" size={64} color={colors.textLight} />
        <Text style={styles.emptyStateText}>No shipments found</Text>
        <Text style={styles.emptyStateSubtext}>
          {searchQueryParam 
            ? `No results for "${searchQueryParam}"`
            : 'Create a new shipment to get started'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Search & Header */}
      <View style={[styles.orangeHeader, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20) }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Shipments</Text>
             <Text style={styles.subtitle}>
                {data?.pages[0]?.pagination?.total 
                  ? `${data.pages[0].pagination.total} total` 
                  : (isLoading ? 'Loading...' : 'Overview')}
             </Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tracking ID or recipient..."
            placeholderTextColor={colors.textLight}
            value={searchQueryParam}
            onChangeText={setSearchQueryParam}
            returnKeyType="search"
          />
          {searchQueryParam.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQueryParam('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
         <FlatList
          horizontal
          data={['all', 'pending', 'in-transit', 'delivered']}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
          keyExtractor={(item) => item}
          renderItem={({ item: filterKey }) => {
             const labelMap: any = { all: 'All', pending: 'Pending', 'in-transit': 'In Transit', delivered: 'Delivered' };
             const isActive = selectedFilter === filterKey;
             let activeColor = colors.text;
             if (filterKey === 'pending') activeColor = colors.warning;
             if (filterKey === 'in-transit') activeColor = colors.info;
             if (filterKey === 'delivered') activeColor = colors.success;
             
             return (
               <TouchableOpacity
                 style={[
                    styles.filterChip, 
                    isActive && { backgroundColor: activeColor === colors.text ? colors.primary : activeColor, borderColor: 'transparent' }
                 ]}
                 onPress={() => setSelectedFilter(filterKey as any)}
               >
                 <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                   {labelMap[filterKey]}
                 </Text>
               </TouchableOpacity>
             );
          }}
          ListFooterComponent={
              <TouchableOpacity style={styles.refreshBtn} onPress={() => refetch()}>
                  <Ionicons name="refresh" size={16} color={colors.textLight} />
              </TouchableOpacity>
          }
        />
      </View>

      {/* Main List */}
      <FlatList
        data={allShipments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
           if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={
           <RefreshControl refreshing={!!isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => {
          const parent = navigation.getParent();
          if (parent) parent.navigate('CreateShipment');
        }}
      >
        <Ionicons name="add" size={28} color={colors.textWhite} />
      </TouchableOpacity>

      {/* Shipment Details Popup */}
      <ShipmentDetailsPopup
        visible={showShipmentPopup}
        shipmentId={selectedShipmentId}
        onClose={() => setShowShipmentPopup(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
    color: colors.textWhite,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    paddingVertical: spacing.md,
  },
  filtersWrapper: {
    marginTop: spacing.md,
    maxHeight: 50,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  refreshBtn: {
     width: 36,
     height: 36,
     borderRadius: 18,
     backgroundColor: colors.background,
     justifyContent: 'center',
     alignItems: 'center',
     marginLeft: 8,
     elevation: 2,
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for FAB
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  centerLoader: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
  },
  
  // -- Card Styles --
  shipmentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shipmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  shipmentContent: {
    gap: spacing.sm,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recipient: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    flex: 1,
  },
  shipmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  item: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowRadius: 8,
    elevation: 8,
  },
  trackButton: {
    backgroundColor: '#8A2BE2', // Purple
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  trackButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: typography.fontSize.sm,
  },
});

