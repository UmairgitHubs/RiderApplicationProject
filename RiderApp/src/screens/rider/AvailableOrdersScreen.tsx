import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { riderApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

interface AvailableOrder {
  id: string;
  trackingId: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: string;
  earnings: number;
  itemType: string;
  packageSize: 'small' | 'medium' | 'large';
  estimatedTime: string;
  postedTime: string;
  rawDate: string; 
}

interface DeliveredOrder {
  id: string;
  trackingId: string;
  status: string;
  recipientName: string;
  deliveryAddress: string; 
  deliveryFee: number;
  codAmount: number;
  scheduledDeliveryTime: string;
  actualDeliveryTime: string;
  merchantName: string;
}

export default function AvailableOrdersScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([]);
  
  // Filters
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      let startDate: string | undefined;
      let endDate: string | undefined;
      
      const now = new Date();
      // "Today" means from 00:00:00 local to 23:59:59 local
      // Note: Date() constructors differ in local vs UTC interpretation if not careful,
      // but new Date(y, m, d) creates specific local time 00:00:00.
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (selectedFilter === 'today') {
          startDate = startOfDay.toISOString();
          endDate = new Date(startOfDay.getTime() + 86400000 - 1).toISOString();
      } else if (selectedFilter === 'yesterday') {
          const yesterday = new Date(startOfDay.getTime() - 86400000);
          startDate = yesterday.toISOString();
          // End of yesterday is just before start of today
          endDate = new Date(startOfDay.getTime() - 1).toISOString();
      } else if (selectedFilter === 'week') {
          const weekAgo = new Date(startOfDay.getTime() - 7 * 86400000);
          startDate = weekAgo.toISOString();
      } else if (selectedFilter === 'month') {
          const monthAgo = new Date(startOfDay.getTime() - 30 * 86400000);
          startDate = monthAgo.toISOString();
      }
      
      console.log(`Fetching orders with filter: ${selectedFilter}, Date Range: ${startDate} - ${endDate}`);

      // Fetch Delivered Orders
      const response = await riderApi.getCompletedOrders({ 
          limit: 50,
          startDate,
          endDate
      });

      if (response.success && response.data?.shipments) {
          const mappedDelivered = response.data.shipments.map((s: any) => ({
              id: s.id,
              trackingId: s.trackingNumber,
              status: s.status, // Keep raw status
              recipientName: s.recipientName,
              deliveryAddress: s.deliveryAddress,
              deliveryFee: parseFloat(s.deliveryFee || 0),
              codAmount: parseFloat(s.codAmount || 0),
              scheduledDeliveryTime: s.scheduledDeliveryTime,
              actualDeliveryTime: s.actualDeliveryTime,
              merchantName: s.merchant?.business_name || s.merchant?.full_name || 'Merchant' // Prioritize Business Name
          }));
          setDeliveredOrders(mappedDelivered);
      } else {
        // Handle empty
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter]);

  // Initial Load on Focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  // Trigger fetch when filter changes
  useEffect(() => {
      fetchOrders();
  }, [selectedFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'delivered': return colors.success;
          case 'received_at_hub': return colors.primary; // Or a specific 'info' color
          case 'cancelled': return colors.error;
          default: return colors.textLight;
      }
  };

  const getStatusLabel = (status: string) => {
      switch(status) {
          case 'delivered': return 'Delivered';
          case 'received_at_hub': return 'Hub Drop-off';
          case 'cancelled': return 'Cancelled';
          default: return status.replace(/_/g, ' ');
      }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.orangeHeader, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
        </View>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>All Deliveries</Text>
          <Text style={styles.subtitle}>
              {deliveredOrders.length} completed orders
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContainer}
        >
          {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' }
          ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, selectedFilter === filter.id && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.id as any)}
              >
                <Text style={[styles.filterText, selectedFilter === filter.id && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ paddingTop: spacing.xs }}>
            {loading && !refreshing ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : deliveredOrders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyStateText}>No delivered orders found</Text>
                    <Text style={styles.emptyStateSubtext}>Try adjusting the filter</Text>
                </View>
            ) : (
                deliveredOrders.map((order) => (
                    <View key={order.id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                                <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                            </View>
                            <Text style={{ color: colors.textLight, fontSize: 12 }}>
                                {order.actualDeliveryTime ? new Date(order.actualDeliveryTime).toLocaleDateString() : ''}
                            </Text>
                        </View>

                        <Text style={styles.trackingId}>{order.trackingId}</Text>
                        
                        <View style={{ marginBottom: spacing.md }}>
                            <View style={styles.rowItem}>
                                <Ionicons name="business" size={16} color={colors.textLight} />
                                <Text style={styles.detailText}>{order.merchantName}</Text>
                            </View>
                            <View style={styles.rowItem}>
                                <Ionicons name="location" size={16} color={colors.textLight} />
                                <Text style={styles.detailText} numberOfLines={2}>{order.deliveryAddress}</Text>
                            </View>
                        </View>

                        <View style={[styles.orderDetails, { backgroundColor: '#F0FFF4' }]}>
                            <Text style={{ fontWeight: 'bold', color: colors.success }}>Earnings: ${order.deliveryFee.toFixed(2)}</Text>
                            {order.codAmount > 0 && (
                                <Text style={{ fontSize: 12, color: colors.textLight }}>COD: ${order.codAmount}</Text>
                            )}
                        </View>
                    </View>
                ))
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 120, // Reduced height since tabs are gone
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTextContainer: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  filtersScrollView: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
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
    textTransform: 'capitalize',
  },
  rowItem: {
    flexDirection: 'row', 
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs
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
});

