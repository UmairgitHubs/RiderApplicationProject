import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { deliveredOrdersApi } from '../../services/api';

interface DeliveredOrder {
  id: string;
  tracking_number?: string;
  recipient_name?: string;
  recipient_phone?: string;
  delivery_address?: string;
  cod_amount?: number;
  status: string;
  delivered_at?: string;
  created_at?: string;
}

export default function DeliveredOrdersScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    returnable: 0,
    totalValue: 0,
  });

  useFocusEffect(
    React.useCallback(() => {
      fetchDeliveredOrders();
    }, [])
  );

  const fetchDeliveredOrders = async () => {
    try {
      setLoading(true);
      const response = await deliveredOrdersApi.getDeliveredOrders({
        limit: 100,
        search: searchQuery || undefined,
      });
      
      if (response.success && response.data?.shipments) {
        const deliveredOrders = response.data.shipments;
        setOrders(deliveredOrders);

        // Calculate stats
        const total = deliveredOrders.length;
        const returnable = deliveredOrders.filter((order: any) => {
          // Orders are returnable if delivered within last 7 days
          if (!order.delivered_at) return false;
          const deliveredDate = new Date(order.delivered_at);
          const daysSinceDelivery = Math.floor(
            (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceDelivery <= 7;
        }).length;
        
        const totalValue = deliveredOrders.reduce((sum: number, order: any) => {
          return sum + (parseFloat(order.cod_amount?.toString() || '0') || 0);
        }, 0);

        setStats({ total, returnable, totalValue });
      }
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchDeliveredOrders();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysLeft = (deliveredAt?: string) => {
    if (!deliveredAt) return 0;
    const deliveredDate = new Date(deliveredAt);
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, 7 - daysSinceDelivery);
  };

  const formatPrice = (amount?: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    return `$${numAmount.toFixed(2)}`;
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.tracking_number?.toLowerCase().includes(query) ||
      order.recipient_name?.toLowerCase().includes(query) ||
      order.recipient_phone?.toLowerCase().includes(query)
    );
  });

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent && parent.canGoBack()) {
              parent.goBack();
            } else if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Delivered Orders</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search delivered..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 40) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Statistics Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {stats.total}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.info }]}>
                {stats.returnable}
              </Text>
              <Text style={styles.statLabel}>Returnable</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {formatPrice(stats.totalValue)}
              </Text>
              <Text style={styles.statLabel}>Value</Text>
            </View>
          </View>

          {/* Delivered Orders List */}
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No delivered orders found</Text>
            </View>
          ) : (
            filteredOrders.map((order) => {
              const daysLeft = getDaysLeft(order.delivered_at || order.created_at);
              const isReturnable = daysLeft > 0;
              
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => {
                    const parent = navigation.getParent();
                    if (parent) {
                      parent.navigate('ShipmentDetails', { shipmentId: order.id });
                    }
                  }}
                >
                  {/* Green Checkmark Circle */}
                  <View style={styles.checkmarkContainer}>
                    <View style={styles.checkmarkCircle}>
                      <Ionicons name="checkmark" size={16} color={colors.textWhite} />
                    </View>
                  </View>

                  {/* Order Content */}
                  <View style={styles.orderContent}>
                    <View style={styles.orderHeader}>
                      <View style={styles.orderHeaderLeft}>
                        <Text style={styles.customerName}>
                          {order.recipient_name || 'Customer'}
                        </Text>
                        <Text style={styles.orderId}>
                          {order.tracking_number || order.id}
                        </Text>
                      </View>
                      <View style={styles.deliveredTag}>
                        <Text style={styles.deliveredTagText}>Delivered</Text>
                      </View>
                    </View>

                    <View style={styles.orderRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.text} />
                      <Text style={styles.deliveryDate}>
                        {formatDate(order.delivered_at || order.created_at)}
                      </Text>
                    </View>

                    <View style={styles.orderRow}>
                      <Text style={styles.rowLabel}>Amount</Text>
                      <Text style={styles.amount}>
                        {formatPrice(order.cod_amount)}
                      </Text>
                    </View>

                    {isReturnable && (
                      <View style={styles.orderRow}>
                        <Text style={styles.returnableLabel}>Returnable</Text>
                        <Text style={styles.daysLeft}>
                          {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkmarkContainer: {
    marginRight: spacing.md,
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderContent: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  customerName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  orderId: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  deliveredTag: {
    backgroundColor: '#C8E6C9',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  deliveredTagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  deliveryDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  rowLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  amount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  returnableLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: typography.fontWeight.medium,
  },
  daysLeft: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginTop: spacing.md,
  },
});

