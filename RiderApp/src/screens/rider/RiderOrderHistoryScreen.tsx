import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface HistoryOrder {
  id: string;
  trackingId: string;
  merchantName: string;
  recipientName: string;
  pickupAddress: string;
  deliveryAddress: string;
  earnings: number;
  status: 'completed' | 'cancelled';
  date: string;
  distance: string;
  rating?: number;
}

export default function RiderOrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const orders: HistoryOrder[] = [
    {
      id: '1',
      trackingId: 'CE2024001234560',
      merchantName: 'Tech Store NYC',
      recipientName: 'Sarah Johnson',
      pickupAddress: '123 Main St, Manhattan, NY 10001',
      deliveryAddress: '456 Park Ave, Brooklyn, NY 11201',
      earnings: 45.99,
      status: 'completed',
      date: 'Dec 1, 2024',
      distance: '2.3 km',
      rating: 5,
    },
    {
      id: '2',
      trackingId: 'CE2024001234561',
      merchantName: 'Fashion Hub',
      recipientName: 'Michael Chen',
      pickupAddress: '789 5th Avenue, Manhattan, NY 10022',
      deliveryAddress: '321 Madison Ave, New York, NY 10017',
      earnings: 25.00,
      status: 'completed',
      date: 'Nov 30, 2024',
      distance: '1.5 km',
      rating: 4,
    },
    {
      id: '3',
      trackingId: 'CE2024001234562',
      merchantName: 'Food Market',
      recipientName: 'Emily Davis',
      pickupAddress: '555 West St, Brooklyn, NY 11201',
      deliveryAddress: '777 East Ave, Queens, NY 11101',
      earnings: 0,
      status: 'cancelled',
      date: 'Nov 29, 2024',
      distance: '4.8 km',
    },
    {
      id: '4',
      trackingId: 'CE2024001234563',
      merchantName: 'Book Store',
      recipientName: 'John Smith',
      pickupAddress: '222 Broadway, Manhattan, NY 10001',
      deliveryAddress: '888 Park Ln, Brooklyn, NY 11201',
      earnings: 30.00,
      status: 'completed',
      date: 'Nov 28, 2024',
      distance: '3.2 km',
      rating: 5,
    },
    {
      id: '5',
      trackingId: 'CE2024001234564',
      merchantName: 'Electronics Plus',
      recipientName: 'Lisa Anderson',
      pickupAddress: '111 Wall St, Manhattan, NY 10005',
      deliveryAddress: '999 Queens Blvd, Queens, NY 11101',
      earnings: 52.50,
      status: 'completed',
      date: 'Nov 27, 2024',
      distance: '5.1 km',
      rating: 5,
    },
  ];

  const filteredOrders = orders.filter(order => {
    const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
    const matchesSearch = 
      order.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFilterCount = (filter: string) => {
    if (filter === 'all') return orders.length;
    return orders.filter(o => o.status === filter).length;
  };

  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.earnings, 0);

  const totalDeliveries = orders.filter(o => o.status === 'completed').length;

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
          <Text style={styles.title}>Order History</Text>
          <Text style={styles.subtitle}>{orders.length} total orders</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tracking ID or name"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{totalDeliveries}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: colors.success }]}>${totalEarnings.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Total Earned</Text>
          </View>
        </View>

        {/* Filter Tabs */}
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
              All ({getFilterCount('all')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'completed' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('completed')}
          >
            <Ionicons 
              name="checkmark-circle" 
              size={16} 
              color={selectedFilter === 'completed' ? colors.textWhite : colors.success} 
            />
            <Text style={[styles.filterText, selectedFilter === 'completed' && styles.filterTextActive]}>
              Completed ({getFilterCount('completed')})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'cancelled' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('cancelled')}
          >
            <Ionicons 
              name="close-circle" 
              size={16} 
              color={selectedFilter === 'cancelled' ? colors.textWhite : colors.error} 
            />
            <Text style={[styles.filterText, selectedFilter === 'cancelled' && styles.filterTextActive]}>
              Cancelled ({getFilterCount('cancelled')})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyStateText}>No orders found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery ? 'Try a different search term' : 'Your completed orders will appear here'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity 
              key={order.id} 
              style={styles.orderCard}
              onPress={() => {
                if (order.status === 'completed') {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('RiderOrderDetails', { orderId: order.id });
                  }
                }
              }}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <Ionicons name="cube-outline" size={20} color={colors.primary} />
                  <Text style={styles.trackingId}>{order.trackingId}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: order.status === 'completed' ? colors.success : colors.error }
                ]}>
                  <Text style={styles.statusText}>
                    {order.status === 'completed' ? 'Completed' : 'Cancelled'}
                  </Text>
                </View>
              </View>

              <View style={styles.orderContent}>
                <View style={styles.infoRow}>
                  <Ionicons name="business-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoText}>{order.merchantName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoText}>{order.recipientName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="navigate-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoText}>{order.distance}</Text>
                </View>

                <View style={styles.orderFooter}>
                  <View style={styles.orderFooterLeft}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textLight} />
                    <Text style={styles.dateText}>{order.date}</Text>
                    {order.rating && (
                      <>
                        <Ionicons name="star" size={16} color="#FFC107" style={{ marginLeft: spacing.md }} />
                        <Text style={styles.ratingText}>{order.rating}.0</Text>
                      </>
                    )}
                  </View>
                  {order.status === 'completed' && (
                    <Text style={styles.earnings}>+${order.earnings.toFixed(2)}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
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
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginBottom: spacing.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
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
  orderContent: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  ratingText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  earnings: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
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

