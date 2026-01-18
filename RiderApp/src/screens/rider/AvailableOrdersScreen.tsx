import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Order {
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
}

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearby' | 'high-pay'>('all');

  const orders: Order[] = [
    {
      id: '1',
      trackingId: 'CE2024001234570',
      pickupAddress: '123 Main St, Manhattan, NY 10001',
      deliveryAddress: '456 Park Ave, Brooklyn, NY 11201',
      distance: '2.3 km',
      earnings: 45.99,
      itemType: 'Electronics',
      packageSize: 'medium',
      estimatedTime: '18 min',
      postedTime: '2 min ago',
    },
    {
      id: '2',
      trackingId: 'CE2024001234571',
      pickupAddress: '789 5th Avenue, Manhattan, NY 10022',
      deliveryAddress: '321 Madison Ave, New York, NY 10017',
      distance: '1.5 km',
      earnings: 35.00,
      itemType: 'Documents',
      packageSize: 'small',
      estimatedTime: '12 min',
      postedTime: '5 min ago',
    },
    {
      id: '3',
      trackingId: 'CE2024001234572',
      pickupAddress: '555 West St, Brooklyn, NY 11201',
      deliveryAddress: '777 East Ave, Queens, NY 11101',
      distance: '4.8 km',
      earnings: 58.50,
      itemType: 'Food & Beverages',
      packageSize: 'large',
      estimatedTime: '32 min',
      postedTime: '8 min ago',
    },
    {
      id: '4',
      trackingId: 'CE2024001234573',
      pickupAddress: '222 Broadway, Manhattan, NY 10001',
      deliveryAddress: '888 Park Ln, Brooklyn, NY 11201',
      distance: '3.2 km',
      earnings: 42.00,
      itemType: 'Clothing',
      packageSize: 'medium',
      estimatedTime: '22 min',
      postedTime: '12 min ago',
    },
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    // TODO: Fetch new orders
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleAcceptOrder = (orderId: string) => {
    // TODO: Accept order logic
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('RiderOrderDetails', { orderId });
    }
  };

  const getPackageSizeIcon = (size: string) => {
    switch (size) {
      case 'small':
        return 'cube-outline';
      case 'medium':
        return 'cube';
      case 'large':
        return 'cube';
      default:
        return 'cube-outline';
    }
  };

  const filteredOrders = orders; // TODO: Apply actual filtering

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Available Orders</Text>
          <Text style={styles.subtitle}>{orders.length} orders nearby</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollView}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={selectedFilter === 'all' ? colors.textWhite : colors.text} 
            />
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All Orders
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'nearby' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('nearby')}
          >
            <Ionicons 
              name="location" 
              size={16} 
              color={selectedFilter === 'nearby' ? colors.textWhite : colors.text} 
            />
            <Text style={[styles.filterText, selectedFilter === 'nearby' && styles.filterTextActive]}>
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'high-pay' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('high-pay')}
          >
            <Ionicons 
              name="cash" 
              size={16} 
              color={selectedFilter === 'high-pay' ? colors.textWhite : colors.text} 
            />
            <Text style={[styles.filterText, selectedFilter === 'high-pay' && styles.filterTextActive]}>
              High Pay
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Orders List */}
        {filteredOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.orderHeaderLeft}>
                <Ionicons name="time-outline" size={16} color={colors.textLight} />
                <Text style={styles.postedTime}>{order.postedTime}</Text>
              </View>
              <View style={styles.earningsBadge}>
                <Text style={styles.earningsText}>${order.earnings.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={styles.trackingId}>{order.trackingId}</Text>

            {/* Route */}
            <View style={styles.routeSection}>
              <View style={styles.routeItem}>
                <View style={styles.pickupDot} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Pickup</Text>
                  <Text style={styles.address} numberOfLines={1}>{order.pickupAddress}</Text>
                </View>
              </View>

              <View style={styles.routeConnector}>
                <View style={styles.dashedLine} />
              </View>

              <View style={styles.routeItem}>
                <Ionicons name="location" size={20} color={colors.error} />
                <View style={styles.routeDetails}>
                  <Text style={styles.routeLabel}>Delivery</Text>
                  <Text style={styles.address} numberOfLines={1}>{order.deliveryAddress}</Text>
                </View>
              </View>
            </View>

            {/* Order Details */}
            <View style={styles.orderDetails}>
              <View style={styles.detailItem}>
                <Ionicons name={getPackageSizeIcon(order.packageSize) as any} size={18} color={colors.textLight} />
                <Text style={styles.detailText}>{order.itemType}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="navigate" size={18} color={colors.textLight} />
                <Text style={styles.detailText}>{order.distance}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={18} color={colors.textLight} />
                <Text style={styles.detailText}>{order.estimatedTime}</Text>
              </View>
            </View>

            {/* Accept Button */}
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptOrder(order.id)}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} />
              <Text style={styles.acceptButtonText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Empty State */}
        {filteredOrders.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No orders available</Text>
            <Text style={styles.emptyStateSubtext}>
              Pull down to refresh and check for new orders
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 160,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginTop: spacing.sm,
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
    maxHeight: 60,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
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
  },
  filterChipActive: {
    backgroundColor: colors.primary,
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
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postedTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  earningsBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  earningsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  routeSection: {
    marginBottom: spacing.md,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  pickupDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    marginTop: 2,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  address: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  routeConnector: {
    marginLeft: 10,
    marginVertical: spacing.xs,
  },
  dashedLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  acceptButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
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

