import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useRiderDashboard } from '../../hooks/useRiderDashboard';

export default function RiderDashboard() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  
  const {
    userName,
    stats,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    filteredDeliveries,
    recentCompletions,
    deliveries,
    counts,
    onRefresh,
    isOnline,
    toggleOnline
  } = useRiderDashboard();

  // Helper to get badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'inTransit': return { label: t('status.inTransit', 'In Transit'), color: colors.success };
      case 'pickedUp': return { label: t('status.pickedUp', 'Picked Up'), color: colors.success };
      case 'accepted': return { label: t('status.accepted', 'Accepted'), color: '#2196F3' };
      default: return { label: t('status.pending', 'Pending'), color: '#FFC107' };
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'urgent'
      ? { label: t('common.urgent', 'URGENT'), color: '#FF6B00' }
      : { label: t('common.nextDay', 'Next Day'), color: '#2196F3' };
  };

  // Loading State
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('dashboard.loading', 'Loading dashboard...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B00', '#FF8C33']}
        style={[styles.orangeHeader, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>
              {t('dashboard.welcome', 'Welcome back, {{name}}', { name: userName })}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Online/Offline Toggle */}
        {/* Online/Offline Toggle - Modern Design */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => toggleOnline(!isOnline)}
          style={[
            styles.statusToggleContainer,
            isOnline ? styles.statusOnline : styles.statusOffline
          ]}
        >
          <View style={styles.statusContent}>
            <View style={[styles.statusIconCircle, isOnline ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
              <Ionicons 
                name={isOnline ? "power" : "power-outline"} 
                size={22} 
                color={colors.textWhite} 
              />
            </View>
            <View>
              <Text style={styles.statusLabel}>
                {isOnline ? 'Active Status' : 'Offline Status'}
              </Text>
              <Text style={styles.statusSubtext}>
                {isOnline ? 'You are visible to dispatch' : 'You are currently hidden'}
              </Text>
            </View>
          </View>
          
          <View style={styles.modernSwitch}>
            <View style={[
              styles.modernSwitchThumb,
              isOnline ? styles.switchThumbOn : styles.switchThumbOff
            ]} />
          </View>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber} numberOfLines={1} adjustsFontSizeToFit>{stats.active}</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.active', 'Active')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber} numberOfLines={1} adjustsFontSizeToFit>${stats.todayEarnings.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.today', 'Today')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.textWhite} />
            <Text style={styles.summaryNumber} numberOfLines={1} adjustsFontSizeToFit>${stats.totalEarnings.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>{t('dashboard.total', 'Total')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Route Suggestions */}
        {/* Route Suggestions */}
        <View style={styles.routeSuggestions}>
          <Text style={styles.sectionTitle}>{t('dashboard.routes', 'Your Routes')}</Text>
          <View style={styles.routeCardsContainer}>
             <TouchableOpacity 
              style={[styles.routeCard, { backgroundColor: '#FFF3E0' }]}
              onPress={() => navigation.navigate('RoutePlanning', { routeType: 'urgent' })}
            >
              <LinearGradient 
                colors={['#FF6B00', '#F57C00']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.routeCardGradient}
              >
                <View style={styles.routeIconContainer}>
                   <Ionicons name="flash" size={24} color={colors.textWhite} />
                </View>
                <View style={styles.routeCardContent}>
                  <Text style={styles.routeCardTitle}>{t('dashboard.urgentRoute', 'URGENT Route')}</Text>
                  <Text style={styles.routeCardStats}>{counts.urgent} {t('common.stops', 'Stops')}</Text>
                  <Text style={styles.routeCardSubtitle}>{t('dashboard.priorityDelivery', 'Same-day priority')}</Text>
                </View>
                <View style={styles.routeAction}>
                   <Ionicons name="arrow-forward-circle" size={32} color={colors.textWhite} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.routeCard, { backgroundColor: '#E3F2FD', marginTop: spacing.sm }]}
              onPress={() => navigation.navigate('RoutePlanning', { routeType: 'nextDay' })}
            >
              <LinearGradient 
                colors={['#42A5F5', '#1E88E5']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.routeCardGradient}
              >
                 <View style={styles.routeIconContainer}>
                   <Ionicons name="calendar" size={24} color={colors.textWhite} />
                </View>
                <View style={styles.routeCardContent}>
                  <Text style={styles.routeCardTitle}>{t('dashboard.nextDayRoute', 'Standard Route')}</Text>
                  <Text style={styles.routeCardStats}>{counts.nextDay} {t('common.stops', 'Stops')}</Text>
                   <Text style={styles.routeCardSubtitle}>{t('dashboard.standardDelivery', 'Next-day schedule')}</Text>
                </View>
                <View style={styles.routeAction}>
                   <Ionicons name="arrow-forward-circle" size={32} color={colors.textWhite} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Deliveries */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.activeDeliveries', 'Active Deliveries')}</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{t('dashboard.activeCount', '{{count}} Active', { count: stats.active })}</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filterContainerContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
              {[
                { key: 'all', label: t('common.all', 'All'), count: deliveries.length, icon: null },
                { key: 'urgent', label: t('common.urgent', 'Urgent'), count: counts.urgent, icon: 'flash' },
                { key: 'nextDay', label: t('common.nextDay', 'Next Day'), count: counts.nextDay, icon: null }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[styles.filterButton, activeFilter === filter.key && styles.filterButtonActive]}
                  onPress={() => setActiveFilter(filter.key as any)}
                >
                  {filter.icon && (
                    <Ionicons 
                      name={filter.icon as any} 
                      size={16} 
                      color={activeFilter === filter.key ? colors.textWhite : colors.text} 
                    />
                  )}
                  <Text style={[styles.filterButtonText, activeFilter === filter.key && styles.filterButtonTextActive]}>
                    {filter.label} ({filter.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* List */}
          {filteredDeliveries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>{t('dashboard.noActive', 'No active deliveries')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {activeFilter === 'all' 
                  ? t('dashboard.noDeliveriesMsg', "You don't have any active deliveries at the moment")
                  : t('dashboard.noFilteredMsg', 'No {{filter}} deliveries found', { filter: activeFilter })}
              </Text>
            </View>
          ) : (
            filteredDeliveries.map((delivery) => {
              const statusBadge = getStatusBadge(delivery.status);
              const isUrgent = delivery.type === 'urgent';

              return (
                <TouchableOpacity 
                  key={delivery.id} 
                  style={styles.deliveryCardNew}
                  onPress={() => navigation.navigate('RoutePlanning', { routeType: delivery.type })}
                >
                  <View style={styles.cardTopSection}>
                    <View style={styles.cardInfoCol}>
                      <Text style={styles.cardTrackingText}>{delivery.trackingId}</Text>
                      <Text style={styles.cardRecipientText}>{delivery.recipient}</Text>
                    </View>
                    <View style={styles.cardBadgesCol}>
                      {isUrgent && (
                        <View style={styles.urgentBadgeNew}>
                          <Ionicons name="flash" size={10} color="#FFF" style={{marginRight:3}} />
                          <Text style={styles.urgentBadgeTextNew}>URGENT</Text>
                        </View>
                      )}
                      <View style={[styles.statusBadgeNew, { backgroundColor: '#FFF9C4' }]}> 
                         {/* Using fixed yellow for 'Pending' style matching image, or dynamic if needed */}
                         <Text style={[styles.statusBadgeTextNew, { color: '#FBC02D' }]}>{statusBadge.label}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.addressBoxNew}>
                    <Ionicons name="location-outline" size={18} color={colors.textLight} style={{marginTop: 2}} />
                    <Text style={styles.addressTextNew}>{delivery.address}</Text>
                  </View>

                  <View style={styles.cardFooterNew}>
                    <Text style={styles.distTextNew}>{delivery.distance}</Text>
                    <Text style={styles.priceTextNew}>${delivery.earnings.toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Recent Completions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentCompletions', 'Recent Completions')}</Text>
          {recentCompletions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyStateText}>{t('dashboard.noCompletions', 'No recent completions')}</Text>
              <Text style={styles.emptyStateSubtext}>
                {t('dashboard.completionsMsg', 'Your completed deliveries will appear here')}
              </Text>
            </View>
          ) : (
            recentCompletions.map((completion) => {
              const typeBadge = getTypeBadge(completion.type);
              return (
                <TouchableOpacity 
                  key={completion.id} 
                  style={styles.completionCard}
                  onPress={() => navigation.navigate('RiderOrderDetails', { orderId: completion.id })}
                >
                  <View style={styles.completionHeader}>
                    <Text style={styles.trackingId}>{completion.trackingId}</Text>
                    <View style={styles.badgeContainer}>
                      <View style={[styles.badge, { backgroundColor: typeBadge.color }]}>
                        <Text style={styles.badgeText}>{typeBadge.label}</Text>
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
            })
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
  orangeHeader: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
  statusToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusOnline: {
    backgroundColor: '#4CAF50', // Modern green
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusOffline: {
    backgroundColor: '#37474F', // Dark Slate Grey
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statusLabel: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  statusSubtext: {
    color: colors.textWhite,
    fontSize: typography.fontSize.xs,
    opacity: 0.8,
  },
  modernSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 2,
    justifyContent: 'center',
  },
  modernSwitchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textWhite,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },
  switchThumbOff: {
    alignSelf: 'flex-start',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginTop: spacing.sm,
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
    marginBottom: spacing.xl,
  },
  routeCardsContainer: {
    gap: spacing.sm,
  },
  routeCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  routeCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  routeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  routeCardContent: {
    flex: 1,
  },
  routeCardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: 4,
  },
  routeCardStats: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: 2,
  },
  routeCardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    fontWeight: '500',
  },
  routeAction: {
    paddingLeft: spacing.md,
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
  filterContainerContainer: {
    marginBottom: spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.lg,
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
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.xs,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 10, // Slightly smaller
    color: colors.textWhite,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  recipient: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  recipientActive: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
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
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceContainerInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  distance: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
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
    // paddingLeft: 24, // removed
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
  // --- New Card Design Styles ---
  deliveryCardNew: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // More rounded for modern feel
    padding: 20,
    marginBottom: 16,
    // Premium soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardInfoCol: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  cardTrackingText: {
    fontSize: 13,
    color: '#64748B', // Slate 500
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardRecipientText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B', // Slate 800
    letterSpacing: -0.3,
  },
  cardBadgesCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  urgentBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4500', // Orange Red
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  urgentBadgeTextNew: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadgeNew: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgeTextNew: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressBoxNew: {
    backgroundColor: '#F8FAFC', // Very light blue/grey
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  addressTextNew: {
    flex: 1,
    fontSize: 14,
    color: '#475569', // Slate 600
    lineHeight: 21,
    marginLeft: 8,
    fontWeight: '400',
  },
  cardFooterNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  distTextNew: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  priceTextNew: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981', // Emerald 500
  },
});
