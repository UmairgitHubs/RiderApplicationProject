import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Status mapping
const getStatusInfo = (status: string) => {
  const statusMap: { [key: string]: { label: string; color: string } } = {
    pending: { label: 'Pending Pickup', color: '#FF9800' },
    assigned: { label: 'Assigned', color: '#03A9F4' },
    picked_up: { label: 'Picked Up', color: '#9C27B0' },
    in_transit: { label: 'In Transit', color: '#9C27B0' },
    delivered: { label: 'Delivered', color: '#4CAF50' },
    cancelled: { label: 'Cancelled', color: '#F44336' },
    returned: { label: 'Returned', color: '#F44336' },
  };
  return statusMap[status] || { label: status, color: '#757575' };
};

export default function MerchantHome() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ active: 0, delivered: 0 });

  const openModal = () => {
    setShowShipmentModal(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowShipmentModal(false);
    });
  };

  const handleShipmentTypeSelect = (type: 'franchise' | 'individual') => {
    closeModal();
    // Navigate to CreateShipment with type parameter
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('CreateShipment', { shipmentType: type });
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await shipmentApi.getAll({ limit: 20 });
      if (response.success && response.data?.shipments) {
        const allShipments = response.data.shipments;
        setShipments(allShipments);

        // Calculate stats
        const activeCount = allShipments.filter(
          (s: any) => !['delivered', 'cancelled', 'returned'].includes(s.status)
        ).length;
        const deliveredCount = allShipments.filter(
          (s: any) => s.status === 'delivered'
        ).length;
        setStats({ active: activeCount, delivered: deliveredCount });
      }
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch shipments on mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchShipments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchShipments();
  };

  // Get active shipment for live tracking (first in_transit or picked_up)
  const activeShipment = shipments.find(
    (s: any) => s.status === 'in_transit' || s.status === 'picked_up' || s.status === 'assigned'
  );

  // Get recent shipments (excluding the active one)
  const recentShipments = shipments
    .filter((s: any) => s.id !== activeShipment?.id)
    .slice(0, 3);

  const getRiderInitial = (rider: any) => {
    if (!rider?.full_name) return 'R';
    return rider.full_name.charAt(0).toUpperCase();
  };

  const formatPrice = (amount: any) => {
    if (amount === null || amount === undefined) {
      return 'PKR 0.00';
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(numAmount)) {
      return 'PKR 0.00';
    }
    return `PKR ${numAmount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>{t('home.dashboard')}</Text>
            <Text style={styles.headerSubtitle}>{t('home.welcomeBack')}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            const parent = navigation.getParent();
            if (parent) parent.navigate('Notifications');
          }}>
            <Ionicons name="notifications-outline" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.active}</Text>
            <Text style={styles.statLabel}>{t('home.active')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.delivered}</Text>
            <Text style={styles.statLabel}>{t('home.delivered')}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Create New Shipment Card */}
        <TouchableOpacity 
          style={styles.createShipmentCard}
          onPress={openModal}
        >
          <View style={styles.createShipmentIcon}>
            <Ionicons name="add" size={32} color={colors.textWhite} />
          </View>
          <View style={styles.createShipmentText}>
            <Text style={styles.createShipmentTitle}>{t('home.createShipment')}</Text>
            <Text style={styles.createShipmentSubtitle}>{t('home.createShipmentDesc')}</Text>
          </View>
        </TouchableOpacity>

        {/* Live Tracking Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeShipment ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('home.liveTracking')}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.active} {t('home.active')}</Text>
            </View>
          </View>
          <View style={styles.trackingCard}>
            <View style={styles.trackingHeader}>
              <Ionicons name="paper-plane-outline" size={20} color={colors.primary} />
                <Text style={styles.trackingId}>{activeShipment.trackingNumber}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(activeShipment.status).color }]}>
                  <Text style={styles.statusBadgeText}>{getStatusInfo(activeShipment.status).label}</Text>
                </View>
              </View>
              <Text style={styles.trackingRecipient}>To: {activeShipment.recipientName}</Text>
              {activeShipment.rider ? (
            <View style={styles.riderInfo}>
              <View style={styles.riderAvatar}>
                    <Text style={styles.riderInitial}>{getRiderInitial(activeShipment.rider)}</Text>
              </View>
              <View style={styles.riderDetails}>
                    <Text style={styles.riderName}>{activeShipment.rider.full_name || 'Rider'}</Text>
                <Text style={styles.riderSubtitle}>Your rider</Text>
              </View>
            </View>
              ) : null}
            <View style={styles.addressRow}>
              <Ionicons name="location" size={16} color={colors.error} />
                <Text style={styles.address}>{activeShipment.deliveryAddress}</Text>
            </View>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => {
                const parent = navigation.getParent();
                  if (parent) parent.navigate('ShipmentDetails', { shipmentId: activeShipment.id });
              }}
            >
              <Ionicons name="location" size={16} color={colors.textWhite} />
              <Text style={styles.trackButtonText}>{t('home.trackOnMap')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        ) : null}

        {/* Recent Shipments Section */}
        {recentShipments.length > 0 && (
        <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentShipments')}</Text>
          <TouchableOpacity onPress={() => {
            const parent = navigation.getParent();
            if (parent) parent.navigate('ShipmentsList');
          }}>
            <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
          </TouchableOpacity>
        </View>
            {recentShipments.map((shipment: any, index: number) => (
              <View 
                key={shipment.id} 
                style={[styles.shipmentCard, index < recentShipments.length - 1 && styles.shipmentCardSpacing]}
              >
            <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentTrackingId}>{shipment.trackingNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusInfo(shipment.status).color }]}>
                    <Text style={styles.statusBadgeText}>{getStatusInfo(shipment.status).label}</Text>
              </View>
            </View>
                <Text style={styles.shipmentRecipient}>{shipment.recipientName}</Text>
                <Text style={styles.shipmentAddress}>{shipment.deliveryAddress}</Text>
            <View style={styles.shipmentDetails}>
                  <Text style={styles.shipmentItem}>{shipment.packageCount || 1} package{shipment.packageCount > 1 ? 's' : ''}</Text>
                  <Text style={styles.shipmentPrice}>{formatPrice(shipment.codAmount || shipment.deliveryFee || 0)}</Text>
            </View>
            <TouchableOpacity 
              style={styles.shipmentTrackButton}
              onPress={() => {
                const parent = navigation.getParent();
                    if (parent) parent.navigate('ShipmentDetails', { shipmentId: shipment.id });
              }}
            >
              <Ionicons name="paper-plane-outline" size={16} color={colors.textWhite} />
              <Text style={styles.shipmentTrackButtonText}>Track Shipment</Text>
            </TouchableOpacity>
          </View>
            ))}
        </View>
        )}
      </ScrollView>

      {/* Shipment Type Selection Modal */}
      <Modal
        visible={showShipmentModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
      >
            <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Handle */}
              <View style={styles.modalHandle} />

              {/* Title */}
              <Text style={styles.modalTitle}>Create Shipment</Text>
              <Text style={styles.modalSubtitle}>Choose your shipment type</Text>

              {/* Shipment Type Options */}
              <View style={styles.shipmentTypeContainer}>
                {/* Franchise Option */}
                <TouchableOpacity
                  style={[styles.shipmentTypeButton, styles.franchiseButton]}
                  onPress={() => handleShipmentTypeSelect('franchise')}
            >
                  <View style={styles.shipmentTypeIcon}>
                    <Ionicons name="cube-outline" size={28} color={colors.textWhite} />
                  </View>
                  <View style={styles.shipmentTypeTextContainer}>
                    <Text style={styles.shipmentTypeTitle}>Franchise</Text>
                    <Text style={styles.shipmentTypeSubtitle}>Bulk shipments • Excel upload</Text>
                  </View>
            </TouchableOpacity>

                {/* Individual Option */}
                <TouchableOpacity
                  style={[styles.shipmentTypeButton, styles.individualButton]}
                  onPress={() => handleShipmentTypeSelect('individual')}
                >
                  <View style={styles.shipmentTypeIcon}>
                    <Ionicons name="person-circle-outline" size={28} color={colors.textWhite} />
                  </View>
                  <View style={styles.shipmentTypeTextContainer}>
                    <Text style={styles.shipmentTypeTitle}>Individual</Text>
                    <Text style={styles.shipmentTypeSubtitle}>Single parcel • Quick delivery</Text>
          </View>
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
            </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
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
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  createShipmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createShipmentIcon: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  createShipmentText: {
    flex: 1,
  },
  createShipmentTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  createShipmentSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
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
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  trackingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  trackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  trackingRecipient: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.md,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderInitial: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  riderSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  riderDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    flex: 1,
  },
  trackButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
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
  shipmentCardSpacing: {
    marginBottom: spacing.md,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  shipmentTrackingId: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  shipmentRecipient: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  shipmentAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  shipmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  shipmentItem: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  shipmentPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  shipmentTrackButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shipmentTrackButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  shipmentTypeContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  shipmentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  franchiseButton: {
    backgroundColor: colors.primary,
  },
  individualButton: {
    backgroundColor: colors.success,
  },
  shipmentTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  shipmentTypeTextContainer: {
    flex: 1,
  },
  shipmentTypeTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  shipmentTypeSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
  },
  cancelButton: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});
