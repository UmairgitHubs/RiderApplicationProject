import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { riderApi, authApi } from '../../services/api';

interface Delivery {
  id: string;
  trackingId: string;
  recipient: string;
  address: string;
  distance: string;
  earnings: number;
  type: 'urgent' | 'nextDay';
  status: 'pending' | 'accepted' | 'pickedUp' | 'inTransit';
  eta?: string;
}

interface Completion {
  id: string;
  trackingId: string;
  recipient: string;
  distance: string;
  earnings: number;
  type: 'urgent' | 'nextDay';
}

export default function RiderDashboard() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'nextDay'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    todayEarnings: 0,
    totalEarnings: 0,
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);
  const [userName, setUserName] = useState('Rider');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch user data for name
      const user = await authApi.getStoredUser();
      if (user?.fullName) {
        setUserName(user.fullName);
      }

      // Fetch active orders
      const activeOrdersResponse = await riderApi.getActiveOrders();
      const activeOrders = activeOrdersResponse?.data?.orders || [];

      // Fetch earnings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const earningsResponse = await riderApi.getEarnings({
        startDate: today.toISOString(),
      });
      const earningsData = earningsResponse?.data || {};

      // Fetch recent completed orders
      const completedResponse = await riderApi.getCompletedOrders({ limit: 5 });
      const completedOrders = completedResponse?.data?.shipments || [];

      // Map active orders to delivery format
      const mappedDeliveries: Delivery[] = activeOrders.map((order: any) => {
        // Extract recipient name - backend now returns recipientName
        const recipientName = order.recipientName || order.recipient_name || 'Customer';
        
        // Map backend status to frontend status
        let status: Delivery['status'] = 'pending';
        if (order.status === 'assigned') status = 'accepted';
        else if (order.status === 'picked_up' || order.status === 'pickedUp') status = 'pickedUp';
        else if (order.status === 'in_transit' || order.status === 'inTransit') status = 'inTransit';

        // Determine type based on scheduled delivery time
        // If scheduled for today or urgent, mark as urgent, otherwise nextDay
        let type: 'urgent' | 'nextDay' = 'urgent';
        if (order.scheduledDeliveryTime || order.scheduled_delivery_time) {
          const scheduledTime = new Date(order.scheduledDeliveryTime || order.scheduled_delivery_time);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          if (scheduledTime >= tomorrow) {
            type = 'nextDay';
          }
        }

        // Calculate distance from distanceKm field or show N/A
        const distanceKm = order.distanceKm || order.distance_km;
        const distance = distanceKm ? `${parseFloat(distanceKm).toFixed(1)} km` : 'N/A';

        // Calculate ETA if estimatedDeliveryTime is available
        const estimatedMinutes = order.estimatedDeliveryTime || order.estimated_delivery_time;
        const eta = estimatedMinutes ? `${estimatedMinutes} min` : undefined;

        return {
          id: order.id,
          trackingId: order.trackingNumber || order.tracking_number || '',
          recipient: recipientName,
          address: order.deliveryAddress || order.delivery_address || '',
          distance,
          earnings: parseFloat(order.deliveryFee || order.delivery_fee || 0),
          type,
          status,
          eta,
        };
      });

      // Map completed orders to completion format
      const mappedCompletions: Completion[] = completedOrders
        .slice(0, 5)
        .map((order: any) => {
          const recipientName = order.recipientName || order.recipient_name || 'Customer';
          
          // Determine type
          let type: 'urgent' | 'nextDay' = 'urgent';
          if (order.scheduledDeliveryTime || order.scheduled_delivery_time) {
            const scheduledTime = new Date(order.scheduledDeliveryTime || order.scheduled_delivery_time);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (scheduledTime >= tomorrow) {
              type = 'nextDay';
            }
          }

          // Calculate distance
          const distanceKm = order.distanceKm || order.distance_km;
          const distance = distanceKm ? `${parseFloat(distanceKm).toFixed(1)} km` : 'N/A';

          return {
            id: order.id,
            trackingId: order.trackingNumber || order.tracking_number || '',
            recipient: recipientName,
            distance,
            earnings: parseFloat(order.deliveryFee || order.delivery_fee || 0),
            type,
          };
        });

      // Calculate stats
      const activeCount = mappedDeliveries.length;
      const todayEarnings = parseFloat(earningsData.periodEarnings || earningsData.todayEarnings || 0);
      const totalEarnings = parseFloat(earningsData.totalEarnings || 0);

      setStats({
        active: activeCount,
        todayEarnings,
        totalEarnings,
      });
      setDeliveries(mappedDeliveries);
      setRecentCompletions(mappedCompletions);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load dashboard data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch data on mount and when screen is focused
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const filteredDeliveries = activeFilter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.type === activeFilter);

  const urgentCount = deliveries.filter(d => d.type === 'urgent').length;
  const nextDayCount = deliveries.filter(d => d.type === 'nextDay').length;

  // Show loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  const getStatusBadge = (status: string, type: string) => {
    if (status === 'inTransit') {
      return { label: 'In Transit', color: colors.success };
    }
    if (status === 'pickedUp') {
      return { label: 'Picked Up', color: colors.success };
    }
    if (status === 'accepted') {
      return { label: 'Accepted', color: '#2196F3' };
    }
    return { label: 'Pending', color: '#FFC107' };
  };

  const getTypeBadge = (type: string) => {
    if (type === 'urgent') {
      return { label: 'URGENT', color: '#FF6B00' };
    }
    return { label: 'Next Day', color: '#2196F3' };
  };

  return (
    <View style={styles.container}>
      {/* Orange Header with Gradient */}
      <LinearGradient
        colors={['#FF6B00', '#FF8C33']}
        style={styles.orangeHeader}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, {userName}</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('Notifications');
              }
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber}>{stats.active}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber}>${stats.todayEarnings}</Text>
            <Text style={styles.summaryLabel}>Today</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber}>${stats.totalEarnings}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Route Suggestion Cards */}
        <View style={styles.routeSuggestions}>
          <TouchableOpacity 
            style={styles.routeCard}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('RoutePlanning', { routeType: 'urgent' });
              }
            }}
          >
            <LinearGradient
              colors={['#F44336', '#FF6B00']}
              style={styles.routeCardGradient}
            >
              <Ionicons name="flash" size={28} color={colors.textWhite} />
              <View style={styles.routeCardContent}>
                <Text style={styles.routeCardTitle}>URGENT Route</Text>
                <Text style={styles.routeCardSubtitle}>{urgentCount} same-day stops</Text>
                <Text style={styles.routeCardSubtitle}>Priority delivery</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.routeCard}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('RoutePlanning', { routeType: 'nextDay' });
              }
            }}
          >
            <LinearGradient
              colors={['#2196F3', '#9C27B0']}
              style={styles.routeCardGradient}
            >
              <Ionicons name="map-outline" size={28} color={colors.textWhite} />
              <View style={styles.routeCardContent}>
                <Text style={styles.routeCardTitle}>Next-Day Route</Text>
                <Text style={styles.routeCardSubtitle}>{nextDayCount} stops</Text>
                <Text style={styles.routeCardSubtitle}>Standard delivery</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Active Deliveries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Deliveries</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{stats.active} Active</Text>
            </View>
          </View>

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'all' && styles.filterButtonTextActive
              ]}>
                All ({deliveries.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'urgent' && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter('urgent')}
            >
              <Ionicons 
                name="flash" 
                size={16} 
                color={activeFilter === 'urgent' ? colors.textWhite : colors.text} 
              />
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'urgent' && styles.filterButtonTextActive
              ]}>
                Urgent ({urgentCount})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 'nextDay' && styles.filterButtonActive
              ]}
              onPress={() => setActiveFilter('nextDay')}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 'nextDay' && styles.filterButtonTextActive
              ]}>
                Next Day ({nextDayCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Cards */}
          {filteredDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No active deliveries</Text>
              <Text style={styles.emptyStateSubtext}>
                {activeFilter === 'all' 
                  ? 'You don\'t have any active deliveries at the moment'
                  : `No ${activeFilter === 'urgent' ? 'urgent' : 'next-day'} deliveries found`}
              </Text>
            </View>
          ) : (
            filteredDeliveries.map((delivery) => {
            const statusBadge = getStatusBadge(delivery.status, delivery.type);
            const typeBadge = getTypeBadge(delivery.type);
            const isActive = delivery.status === 'inTransit' || delivery.status === 'pickedUp';

            return (
              <TouchableOpacity 
                key={delivery.id} 
                style={styles.deliveryCard}
                onPress={() => {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('RiderOrderDetails', { orderId: delivery.id });
                  }
                }}
              >
                {isActive && (
                  <View style={styles.deliveryActiveIndicator}>
                    <Ionicons name="paper-plane" size={16} color={colors.success} />
                  </View>
                )}
                <View style={styles.deliveryHeader}>
                  <Text style={styles.trackingId}>{delivery.trackingId}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: typeBadge.color }]}>
                      <Text style={styles.badgeText}>{typeBadge.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusBadge.color }]}>
                      <Text style={styles.badgeText}>{statusBadge.label}</Text>
                    </View>
                  </View>
                </View>

                {isActive ? (
                  <>
                    <Text style={styles.recipientActive}>To: {delivery.recipient}</Text>
                    {delivery.eta && (
                      <View style={styles.etaContainer}>
                        <Ionicons name="time-outline" size={14} color={colors.textLight} />
                        <Text style={styles.etaText}>{delivery.eta}</Text>
                      </View>
                    )}
                    <View style={styles.distanceContainerInline}>
                      <Text style={styles.distance}>{delivery.distance}</Text>
                    </View>
                    <View style={styles.addressContainer}>
                      <Ionicons name="location-outline" size={16} color={colors.textLight} />
                      <Text style={styles.address}>{delivery.address}</Text>
                    </View>
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="call" size={18} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="chatbubble-outline" size={18} color={colors.info} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="paper-plane" size={18} color="#1565C0" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.earningsContainer}>
                      <Text style={styles.earningsLabel}>Earnings: <Text style={styles.earningsAmount}>${delivery.earnings.toFixed(2)}</Text></Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.recipient}>{delivery.recipient}</Text>
                    <View style={styles.addressContainer}>
                      <Ionicons name="location-outline" size={16} color={colors.textLight} />
                      <Text style={styles.address}>{delivery.address}</Text>
                    </View>
                    <View style={styles.deliveryFooter}>
                      <View style={styles.distanceContainer}>
                        <Text style={styles.distance}>{delivery.distance}</Text>
                      </View>
                    </View>
                    <View style={styles.earningsContainer}>
                      <Text style={styles.earningsAmount}>${delivery.earnings.toFixed(2)}</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            );
          }))}
        </View>

        {/* Recent Completions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Completions</Text>
          {recentCompletions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No recent completions</Text>
              <Text style={styles.emptyStateSubtext}>
                Your completed deliveries will appear here
              </Text>
            </View>
          ) : (
            recentCompletions.map((completion) => {
            const typeBadge = getTypeBadge(completion.type);
            return (
              <TouchableOpacity 
                key={completion.id} 
                style={styles.completionCard}
                onPress={() => {
                  const parent = navigation.getParent();
                  if (parent) {
                    parent.navigate('RiderOrderDetails', { orderId: completion.id });
                  }
                }}
              >
                <View style={styles.completionHeader}>
                  <Text style={styles.trackingId}>{completion.trackingId}</Text>
                  <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: typeBadge.color }]}>
                      <Text style={styles.badgeText}>Urgent</Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                </View>
                <Text style={styles.recipient}>{completion.recipient}</Text>
                <View style={styles.completionFooter}>
                  <Text style={styles.distance}>{completion.distance}</Text>
                  <Text style={styles.completionEarnings}>+${completion.earnings.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            );
          }))}
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
  orangeHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  notificationButton: {
    padding: spacing.xs,
  },
  summaryCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  summaryNumber: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  routeSuggestions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  routeCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  routeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  routeCardContent: {
    flex: 1,
  },
  routeCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  routeCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  activeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  activeBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: typography.fontWeight.medium,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  filterButtonTextActive: {
    color: colors.textWhite,
  },
  deliveryCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  deliveryActiveIndicator: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
    zIndex: 1,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: 24,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  recipient: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
    paddingLeft: 24,
  },
  recipientActive: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
    paddingLeft: 24,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingLeft: 24,
  },
  etaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.md,
    paddingLeft: 24,
  },
  address: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: 24,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: 24,
  },
  distance: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingLeft: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsContainer: {
    paddingLeft: 24,
  },
  earningsLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  earningsAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  completionCard: {
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
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  completionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  completionEarnings: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
