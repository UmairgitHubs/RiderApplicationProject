import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useRoutePlanning } from '../../hooks/useRoutePlanning';

export default function RoutePlanningScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const initialType = route.params?.routeType || 'urgent';

  const {
      routeType,
      setRouteType,
      stops,
      currentStopIndex,
      routeStats,
      loading,
      refreshing,
      onRefresh,
      handleStartNavigation,
      handleViewFullRoute,
      stats,
      isAssignedRoute
  } = useRoutePlanning(initialType);

  // Re-fetch when screen focuses (in case orders changed)
  useFocusEffect(
    useCallback(() => {
        onRefresh();
    }, [])
  );

  const progressPercentage = routeStats.totalStops > 0
    ? Math.round((routeStats.completedStops / routeStats.totalStops) * 100)
    : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Optimizing Route...</Text>
      </View>
    );
  }

  const currentStop = stops[currentStopIndex] || stops[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FF8C33']}
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Route Planning</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
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
            onPress={() => setRouteType('urgent')}
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
                {stats?.urgent || 0} stops
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.routeSelectionCard, routeType === 'nextDay' && styles.routeSelectionCardActive]}
            onPress={() => setRouteType('nextDay')}
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
                {stats?.nextDay || 0} stops
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
            {isAssignedRoute && (
                <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>ASSIGNED</Text>
                </View>
            )}
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

          {routeType === 'urgent' && (
            <View style={styles.priorityMessage}>
              <Ionicons name="flash" size={16} color={colors.textWhite} />
              <Text style={styles.priorityText}>
                Priority: Complete all urgent deliveries by end of day.
              </Text>
            </View>
          )}
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
              {currentStop.type === 'urgent' && (
                <View style={[styles.badge, styles.urgentBadge]}>
                  <Ionicons name="flash" size={12} color={colors.textWhite} />
                  <Text style={styles.badgeText}>URGENT</Text>
                </View>
              )}
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
              onPress={() => navigation.navigate('RiderOrderDetails', { orderId: currentStop.id })}
            >
              <LinearGradient
                colors={currentStop.type === 'urgent' ? ['#F44336', '#FF6B00'] : ['#2196F3', '#42A5F5']}
                style={styles.startNavigationButtonGradient}
              >
                <Ionicons name="document-text-outline" size={20} color={colors.textWhite} />
                <Text style={styles.startNavigationButtonText}>View Order Details</Text>
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
              <Text style={styles.routeStatLabel}>Completed Stops</Text>
            </View>
            <Text style={styles.statValue}>{routeStats.completedStops}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="cube-outline" size={20} color={colors.primary} />
              <Text style={styles.routeStatLabel}>Remaining Stops</Text>
            </View>
            <Text style={styles.statValue}>{routeStats.remainingStops}</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="stats-chart-outline" size={20} color="#9C27B0" />
              <Text style={styles.routeStatLabel}>Route Efficiency</Text>
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
                ? 'This route contains urgent same-day deliveries optimized for minimum travel.'
                : 'This route has been optimized for efficiency. These deliveries can be completed tomorrow.'}
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
    flexWrap: 'wrap',
  },
  routeSelectionCard: {
    flex: 1,
    minWidth: 140, // Ensure cards don't get too squashed
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
  urgentBadgeInCard: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeInCardText: {
    fontSize: 8,
    color: '#F44336',
    fontWeight: 'bold',
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
    flex: 1, // Allow text to wrap and not push badge out
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
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.textWhite,
  },
  priorityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  priorityText: {
    marginLeft: spacing.xs,
    color: colors.textWhite,
    fontSize: typography.fontSize.xs,
    flex: 1,
  },
  currentStopCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  currentStopTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  currentStopNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  urgentBadge: {
    backgroundColor: '#F44336',
  },
  urgentBadgeSmall: {
    backgroundColor: '#FFEBEE',
  },
  statusBadge: {
    backgroundColor: '#2196F3',
  },
  activeBadge: {
    backgroundColor: '#E3F2FD',
  },
  badgeText: {
    color: colors.textWhite,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 4,
  },
  badgeTextSmall: {
    color: colors.text,
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
  },
  adminBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textWhite,
    letterSpacing: 0.5,
  },
  trackingId: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  addressSection: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addressContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: 2,
  },
  addressText: {
    fontSize: typography.fontSize.sm,
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
    backgroundColor: '#F5F5F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  etaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
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
  },
  startNavigationButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
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
    marginBottom: spacing.lg,
  },
  allStopsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  allStopsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  stopItem: {
    marginBottom: spacing.lg, // Space for the vertical line
  },
  stopItemLeft: {
    flexDirection: 'row',
  },
  stopCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textLight,
    backgroundColor: colors.background,
    marginTop: 6,
    marginLeft: 6,
  },
  stopItemContent: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  stopItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  stopNumber: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  stopTime: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: 2,
  },
  stopTrackingId: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  stopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stopRecipient: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
  },
  stopNextDistance: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: typography.fontSize.base,
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
  statValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  priorityInfoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFEBEE', // Urgent color
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  priorityInfoCardNextDay: {
    backgroundColor: '#E3F2FD',
  },
  priorityInfoContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  priorityInfoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#D32F2F',
    marginBottom: 2,
  },
  priorityInfoTitleNextDay: {
    color: '#1976D2',
  },
  priorityInfoText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    lineHeight: 18,
  },
  viewFullRouteButton: {
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  viewFullRouteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  viewFullRouteButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.textLight,
  },
});
