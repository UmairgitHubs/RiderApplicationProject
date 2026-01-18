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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { riderApi } from '../../services/api';

interface RouteStop {
  id: string;
  trackingId: string;
  recipient: string;
  address: string;
  distance: string;
  estimatedTime: string;
  status: 'active' | 'pending' | 'completed';
  type: 'urgent' | 'nextDay';
  eta?: string;
  stopNumber: number;
}

export default function RoutePlanningScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialRouteType = route.params?.routeType || 'urgent';
  const [routeType, setRouteType] = useState<'urgent' | 'nextDay'>(initialRouteType);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [routeStats, setRouteStats] = useState({
    totalStops: 0,
    totalKm: 0,
    totalMinutes: 0,
    completedStops: 0,
    remainingStops: 0,
  });
  const [allActiveOrders, setAllActiveOrders] = useState<any[]>([]);

  const fetchRouteData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch active orders
      const activeOrdersResponse = await riderApi.getActiveOrders();
      const activeOrders = activeOrdersResponse?.data?.orders || [];
      setAllActiveOrders(activeOrders);

      // Filter by route type
      const filteredOrders = activeOrders.filter((order: any) => {
        if (routeType === 'urgent') {
          // Urgent orders are typically same-day or have earlier delivery times
          const scheduledTime = order.scheduledDeliveryTime || order.scheduled_delivery_time;
          if (scheduledTime) {
            const scheduled = new Date(scheduledTime);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return scheduled < tomorrow;
          }
          return true; // Default to urgent if no scheduled time
        } else {
          // Next-day orders
          const scheduledTime = order.scheduledDeliveryTime || order.scheduled_delivery_time;
          if (scheduledTime) {
            const scheduled = new Date(scheduledTime);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return scheduled >= tomorrow;
          }
          return false;
        }
      });

      // Map orders to route stops
      const mappedStops: RouteStop[] = filteredOrders.map((order: any, index: number) => {
        const recipientName = order.recipientName || order.recipient_name || 'Customer';
        const distanceKm = order.distanceKm || order.distance_km;
        const distance = distanceKm ? `${parseFloat(distanceKm).toFixed(1)} km` : 'N/A';
        const estimatedMinutes = order.estimatedDeliveryTime || order.estimated_delivery_time || 12;
        const estimatedTime = `${estimatedMinutes} min`;

        // Determine status
        let status: RouteStop['status'] = 'pending';
        if (index === 0) status = 'active';
        else if (order.status === 'delivered') status = 'completed';

        // Calculate ETA (simplified - would need actual route calculation)
        const baseTime = new Date();
        let cumulativeMinutes = 0;
        for (let i = 0; i <= index; i++) {
          if (i > 0) cumulativeMinutes += 12; // Travel time between stops
          cumulativeMinutes += parseInt(estimatedMinutes);
        }
        baseTime.setMinutes(baseTime.getMinutes() + cumulativeMinutes);
        const eta = baseTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });

        return {
          id: order.id,
          trackingId: order.trackingNumber || order.tracking_number || '',
          recipient: recipientName,
          address: order.deliveryAddress || order.delivery_address || '',
          distance,
          estimatedTime,
          status,
          type: routeType as 'urgent' | 'nextDay',
          eta,
          stopNumber: index + 1,
        };
      });

      // Calculate route statistics
      const totalKm = mappedStops.reduce((sum, stop) => {
        const km = parseFloat(stop.distance.replace(' km', '')) || 0;
        return sum + km;
      }, 0);

      const totalMinutes = mappedStops.reduce((sum, stop) => {
        return sum + parseInt(stop.estimatedTime.replace(' min', '')) || 0;
      }, 0) + (mappedStops.length - 1) * 12; // Add travel time between stops

      const completedStops = mappedStops.filter(s => s.status === 'completed').length;
      const remainingStops = mappedStops.length - completedStops;

      setRouteStats({
        totalStops: mappedStops.length,
        totalKm: parseFloat(totalKm.toFixed(1)),
        totalMinutes,
        completedStops,
        remainingStops,
      });

      setStops(mappedStops);
      setCurrentStopIndex(0);
    } catch (error: any) {
      console.error('Error fetching route data:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to load route data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [routeType]);

  useEffect(() => {
    fetchRouteData();
  }, [fetchRouteData, routeType]);

  useFocusEffect(
    useCallback(() => {
      fetchRouteData();
    }, [fetchRouteData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRouteData();
  }, [fetchRouteData]);

  const handleStartNavigation = () => {
    if (stops.length > 0 && stops[currentStopIndex]) {
      const currentStop = stops[currentStopIndex];
      // Navigate to map/navigation screen with current stop details
      Alert.alert(
        'Start Navigation',
        `Starting navigation to ${currentStop.recipient} at ${currentStop.address}`,
        [{ text: 'OK' }]
      );
      // TODO: Integrate with actual navigation service (Google Maps, Apple Maps, etc.)
    }
  };

  const handleViewFullRoute = () => {
    // Navigate to full map view with all stops
    Alert.alert(
      'View Full Route',
      'Opening full route on map with all stops',
      [{ text: 'OK' }]
    );
    // TODO: Navigate to map screen with all stops
  };

  const progressPercentage = routeStats.totalStops > 0
    ? Math.round((routeStats.completedStops / routeStats.totalStops) * 100)
    : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading route...</Text>
      </View>
    );
  }

  const currentStop = stops[currentStopIndex] || stops[0];
  
  // Calculate counts from all active orders, not just filtered stops
  const urgentStops = allActiveOrders.filter((order: any) => {
    const scheduledTime = order.scheduledDeliveryTime || order.scheduled_delivery_time;
    if (scheduledTime) {
      const scheduled = new Date(scheduledTime);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return scheduled < tomorrow;
    }
    return true; // Default to urgent if no scheduled time
  }).length;
  
  const nextDayStops = allActiveOrders.filter((order: any) => {
    const scheduledTime = order.scheduledDeliveryTime || order.scheduled_delivery_time;
    if (scheduledTime) {
      const scheduled = new Date(scheduledTime);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return scheduled >= tomorrow;
    }
    return false;
  }).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FF8C33']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route Planning</Text>
          <Text style={styles.headerSubtitle}>Optimized delivery routes</Text>
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
        {/* Route Selection Cards */}
        <View style={styles.routeSelectionCards}>
          <TouchableOpacity
            style={[styles.routeSelectionCard, routeType === 'urgent' && styles.routeSelectionCardActive]}
            onPress={() => {
              if (routeType !== 'urgent') {
                setRouteType('urgent');
              }
            }}
          >
            <View style={[
              styles.routeSelectionCardGradient,
              routeType === 'urgent' 
                ? { backgroundColor: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0' }
            ]}>
              {routeType === 'urgent' && (
                <View style={styles.urgentBadgeInCard}>
                  <Text style={styles.urgentBadgeInCardText}>URGENT</Text>
                </View>
              )}
              <Ionicons 
                name="flash" 
                size={24} 
                color={routeType === 'urgent' ? '#F44336' : colors.textLight} 
              />
              <Text style={[
                styles.routeSelectionCardText,
                routeType === 'urgent' && { color: colors.text }
              ]}>
                URGENT Route
              </Text>
              <Text style={[
                styles.routeSelectionCardSubtext,
                { color: colors.textLight }
              ]}>
                {urgentStops} stops
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.routeSelectionCard, routeType === 'nextDay' && styles.routeSelectionCardActive]}
            onPress={() => {
              if (routeType !== 'nextDay') {
                setRouteType('nextDay');
              }
            }}
          >
            <LinearGradient
              colors={routeType === 'nextDay' ? ['#2196F3', '#42A5F5'] : ['#FFFFFF', '#F5F5F5']}
              style={styles.routeSelectionCardGradient}
            >
              <Ionicons 
                name="map-outline" 
                size={24} 
                color={routeType === 'nextDay' ? colors.textWhite : '#2196F3'} 
              />
              <Text style={[
                styles.routeSelectionCardText,
                routeType === 'nextDay' && styles.routeSelectionCardTextActive
              ]}>
                Next-Day Route
              </Text>
              <Text style={[
                styles.routeSelectionCardSubtext,
                routeType === 'nextDay' && styles.routeSelectionCardSubtextActive
              ]}>
                {nextDayStops} stops
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Route Overview Card */}
        <LinearGradient
          colors={routeType === 'urgent' ? ['#F44336', '#FF6B00'] : ['#2196F3', '#42A5F5']}
          style={styles.routeOverviewCard}
        >
          <View style={styles.routeOverviewHeader}>
            <Ionicons 
              name={routeType === 'urgent' ? "flash" : "map-outline"} 
              size={28} 
              color={colors.textWhite} 
            />
            <Text style={styles.routeOverviewTitle}>
              {routeType === 'urgent' ? 'URGENT Same-Day Route' : 'Next-Day Route'}
            </Text>
          </View>

          <View style={styles.routeStatsRow}>
            <View style={styles.routeStatItem}>
              <Ionicons name="cube-outline" size={20} color={colors.textWhite} />
              <Text style={styles.routeStatValue}>{routeStats.totalStops}</Text>
              <Text style={styles.routeStatLabel}>Total Stops</Text>
            </View>
            <View style={styles.routeStatItem}>
              <Ionicons name="location-outline" size={20} color={colors.textWhite} />
              <Text style={styles.routeStatValue}>{routeStats.totalKm}</Text>
              <Text style={styles.routeStatLabel}>Total KM</Text>
            </View>
            <View style={styles.routeStatItem}>
              <Ionicons name="time-outline" size={20} color={colors.textWhite} />
              <Text style={styles.routeStatValue}>{routeStats.totalMinutes}</Text>
              <Text style={styles.routeStatLabel}>Total Min</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
            </View>
            <Text style={styles.progressText}>
              {routeStats.completedStops} of {routeStats.totalStops} completed
            </Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
            </View>
          </View>

          {routeType === 'urgent' ? (
            <View style={styles.priorityMessage}>
              <Ionicons name="flash" size={16} color={colors.textWhite} />
              <Text style={styles.priorityText}>
                Priority: Complete all urgent deliveries by end of day.
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Current Stop Card */}
        {currentStop && (
          <View style={[
            styles.currentStopCard,
            { borderColor: currentStop.type === 'urgent' ? '#F44336' : '#2196F3' }
          ]}>
            <View style={styles.currentStopHeader}>
              <Text style={styles.currentStopTitle}>Current Stop</Text>
              <Text style={styles.currentStopNumber}>Stop #{currentStop.stopNumber}</Text>
            </View>

            <View style={styles.badgeContainer}>
              {currentStop.type === 'urgent' ? (
                <View style={[styles.badge, styles.urgentBadge]}>
                  <Ionicons name="flash" size={12} color={colors.textWhite} />
                  <Text style={styles.badgeText}>URGENT</Text>
                </View>
              ) : null}
              <View style={[styles.badge, styles.statusBadge]}>
                <Text style={styles.badgeText}>
                  {currentStop.status === 'active' ? 'ACTIVE' : 'PENDING'}
                </Text>
              </View>
            </View>

            <Text style={styles.trackingId}>{currentStop.trackingId}</Text>

            <View style={styles.addressSection}>
              <Ionicons name="location-outline" size={16} color={colors.textLight} />
              <View style={styles.addressContent}>
                <Text style={styles.addressLabel}>Delivery Address</Text>
                <Text style={styles.addressText}>{currentStop.address}</Text>
              </View>
            </View>

            <View style={styles.etaSection}>
              <View style={styles.etaItem}>
                <Ionicons name="time-outline" size={16} color={colors.textLight} />
                <Text style={styles.etaText}>ETA {currentStop.eta || 'N/A'}</Text>
              </View>
              <View style={styles.etaItem}>
                <Ionicons name="location-outline" size={16} color={colors.textLight} />
                <Text style={styles.etaText}>Distance {currentStop.distance}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.startNavigationButton}
              onPress={handleStartNavigation}
            >
              <LinearGradient
                colors={currentStop.type === 'urgent' ? ['#F44336', '#FF6B00'] : ['#2196F3', '#42A5F5']}
                style={styles.startNavigationButtonGradient}
              >
                <Ionicons name="paper-plane" size={20} color={colors.textWhite} />
                <Text style={styles.startNavigationButtonText}>Start Navigation</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* All Stops List */}
        <View style={styles.allStopsCard}>
          <View style={styles.allStopsHeader}>
            <Text style={styles.allStopsTitle}>All Stops</Text>
            <Text style={styles.allStopsCount}>{stops.length} Deliveries</Text>
          </View>

          {stops.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="map-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>No stops in this route</Text>
            </View>
          ) : (
            stops.map((stop, index) => (
              <View key={stop.id} style={styles.stopItem}>
                <View style={styles.stopItemLeft}>
                  {stop.status === 'active' ? (
                    <Ionicons name="paper-plane" size={24} color={colors.success} />
                  ) : stop.status === 'completed' ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  ) : (
                    <View style={styles.stopCircle} />
                  )}
                  <View style={styles.stopItemContent}>
                    <View style={styles.stopItemHeader}>
                      <Text style={styles.stopNumber}>Stop #{stop.stopNumber}</Text>
                      {stop.status === 'active' && (
                        <View style={[styles.badge, styles.activeBadge]}>
                          <Text style={styles.badgeTextSmall}>Active</Text>
                        </View>
                      )}
                      {stop.type === 'urgent' && (
                        <View style={[styles.badge, styles.urgentBadgeSmall]}>
                          <Text style={styles.badgeTextSmall}>Urgent</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.stopTime}>{stop.eta}</Text>
                    <Text style={styles.stopTrackingId}>{stop.trackingId}</Text>
                    <View style={styles.stopAddressRow}>
                      <Ionicons name="location-outline" size={14} color={colors.textLight} />
                      <Text style={styles.stopRecipient}>{stop.recipient}</Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
                    </View>
                    {index < stops.length - 1 && (
                      <Text style={styles.stopNextDistance}>
                        → {stop.estimatedTime} • {stop.distance}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Route Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Route Statistics</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.statLabel}>Completed Stops</Text>
            </View>
            <Text style={styles.statValue}>{routeStats.completedStops}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={styles.statLabel}>Remaining Stops</Text>
            </View>
            <Text style={styles.statValue}>{routeStats.remainingStops}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="stats-chart-outline" size={20} color="#9C27B0" />
              <Text style={styles.statLabel}>Route Efficiency</Text>
            </View>
            <Text style={[styles.statValue, { color: '#9C27B0' }]}>Optimized</Text>
          </View>
        </View>

        {/* Priority Information */}
        <View style={[
          styles.priorityInfoCard,
          routeType === 'nextDay' && styles.priorityInfoCardNextDay
        ]}>
          <Ionicons 
            name={routeType === 'urgent' ? "flash" : "map-outline"} 
            size={20} 
            color={routeType === 'urgent' ? "#F44336" : "#2196F3"} 
          />
          <View style={styles.priorityInfoContent}>
            <Text style={[
              styles.priorityInfoTitle,
              routeType === 'nextDay' && styles.priorityInfoTitleNextDay
            ]}>
              {routeType === 'urgent' ? 'Priority Same-Day Route' : 'Next-Day Route'}
            </Text>
            <Text style={styles.priorityInfoText}>
              {routeType === 'urgent' 
                ? 'This route contains urgent same-day deliveries that must be completed by end of day. Complete these deliveries first before starting next-day route.'
                : 'This route has been optimized by the hub to minimize distance and maximize efficiency. These deliveries can be completed tomorrow.'}
            </Text>
          </View>
        </View>

        {/* View Full Route Button */}
        <TouchableOpacity
          style={styles.viewFullRouteButton}
          onPress={handleViewFullRoute}
        >
          <LinearGradient
            colors={['#4CAF50', '#66BB6A']}
            style={styles.viewFullRouteButtonGradient}
          >
            <Ionicons name="map" size={20} color={colors.textWhite} />
            <Text style={styles.viewFullRouteButtonText}>View Full Route on Map</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  routeSelectionCards: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  routeSelectionCard: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  routeSelectionCardActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  routeSelectionCardGradient: {
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  routeSelectionCardText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  routeSelectionCardTextActive: {
    color: colors.textWhite,
  },
  routeSelectionCardSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  routeSelectionCardSubtextActive: {
    color: colors.textWhite,
    opacity: 0.9,
  },
  routeOverviewCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  routeOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  routeOverviewTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginLeft: spacing.sm,
  },
  routeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  routeStatItem: {
    alignItems: 'center',
  },
  routeStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginTop: spacing.xs,
  },
  routeStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  progressPercentage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.textWhite,
    borderRadius: borderRadius.full,
  },
  priorityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
  },
  priorityText: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    marginLeft: spacing.xs,
    flex: 1,
  },
  currentStopCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: '#F44336',
  },
  urgentBadgeInCard: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: '#F44336',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  urgentBadgeInCardText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  currentStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  currentStopTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  currentStopNumber: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  urgentBadge: {
    backgroundColor: '#F44336',
  },
  statusBadge: {
    backgroundColor: '#FFC107',
  },
  urgentBadgeSmall: {
    backgroundColor: '#FF6B00',
  },
  activeBadge: {
    backgroundColor: colors.success,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  badgeTextSmall: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  addressSection: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  addressContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  addressText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 20,
  },
  etaSection: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  etaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  startNavigationButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  startNavigationButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  startNavigationButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  allStopsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  allStopsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  allStopsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  allStopsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  stopItem: {
    marginBottom: spacing.md,
  },
  stopItemLeft: {
    flexDirection: 'row',
  },
  stopCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  stopItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  stopItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stopNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  stopTime: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  stopTrackingId: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  stopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  stopRecipient: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  stopNextDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  priorityInfoCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
  },
  priorityInfoCardNextDay: {
    backgroundColor: '#E3F2FD',
  },
  priorityInfoTitleNextDay: {
    color: '#2196F3',
  },
  priorityInfoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  priorityInfoTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#F44336',
    marginBottom: spacing.xs,
  },
  priorityInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  viewFullRouteButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  viewFullRouteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  viewFullRouteButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    marginTop: spacing.md,
  },
});

