import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useMerchantDashboard } from '../../hooks/useMerchantDashboard';

// --- Constants & Config ---
const FRANCHISE_PURPLE = '#7C4DFF';
const FRANCHISE_BG = '#F3E5F5';

// Mock Data for Decoration (matches user request)
const MOCK_BULK_ORDER = {
  id: 'FR2024090176543',
  status: 'active',
  pieces: 6,
  destinations: [
    { id: 1, name: 'Sarah Williams', location: 'Brooklyn, NY 11201', tracking: 'CE2024-FR-001' },
    { id: 2, name: 'Michael Chen', location: 'Queens, NY 11054', tracking: 'CE2024-FR-002' },
    { id: 3, name: 'Emily Rodriguez', location: 'Manhattan, NY 10003', tracking: 'CE2024-FR-003' },
  ]
};

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
  const insets = useSafeAreaInsets();
  const { height: SCREEN_HEIGHT } = useWindowDimensions();
  
  const { 
    stats, 
    activeShipment, 
    activeBulkOrder, // Now available
    recentShipments, 
    loading, 
    refreshing, 
    onRefresh 
  } = useMerchantDashboard();

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));

  const openModal = () => {
    slideAnim.setValue(SCREEN_HEIGHT);
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
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('CreateShipment', { shipmentType: type });
    }
  };

  const getRiderInitial = (rider: any) => {
    if (!rider?.full_name) return 'R';
    return rider.full_name.charAt(0).toUpperCase();
  };

  const formatPrice = (amount: any) => {
    if (amount === null || amount === undefined) return 'PKR 0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(numAmount) ? 'PKR 0.00' : `PKR ${numAmount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      {/* ... (Header) ... */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Create New Shipment Card */}
        <TouchableOpacity style={styles.createShipmentCard} onPress={openModal}>
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
                <Text style={styles.badgeText}>1 Active</Text>
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
              
              {activeShipment.rider && (
                <View style={styles.riderInfo}>
                  <View style={styles.riderAvatar}>
                    <Text style={styles.riderInitial}>{getRiderInitial(activeShipment.rider)}</Text>
                  </View>
                  <View style={styles.riderDetails}>
                    <Text style={styles.riderName}>{activeShipment.rider.full_name || 'Rider'}</Text>
                    <Text style={styles.riderSubtitle}>Your rider • 8 min away</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.addressRow}>
                <Ionicons name="location" size={16} color={colors.error} />
                <Text style={styles.address} numberOfLines={1}>{activeShipment.deliveryAddress}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => {
                  const parent = navigation.getParent();
                  if (parent) parent.navigate('ShipmentTracking', { shipmentId: activeShipment.id });
                }}
              >
                <Ionicons name="map-outline" size={16} color={colors.textWhite} />
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
                <Text style={styles.shipmentAddress} numberOfLines={1}>{shipment.deliveryAddress}</Text>
                <View style={styles.shipmentDetails}>
                  <Text style={styles.shipmentItem}>{shipment.packageCount || 1} package{shipment.packageCount > 1 ? 's' : ''}</Text>
                  <Text style={styles.shipmentPrice}>{formatPrice(shipment.codAmount || shipment.deliveryFee || 0)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.shipmentTrackButton}
                  onPress={() => {
                    const parent = navigation.getParent();
                    if (parent) parent.navigate('ShipmentTracking', { shipmentId: shipment.id });
                  }}
                >
                  <Ionicons name="paper-plane-outline" size={16} color={colors.textWhite} />
                  <Text style={styles.shipmentTrackButtonText}>Track Shipment</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Franchise Bulk Order Card (REAL DATA) */}
        {activeBulkOrder && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Franchise Bulk Order</Text>
            <View style={[styles.badge, { backgroundColor: '#E1BEE7' }]}>
               <Text style={[styles.badgeText, { color: FRANCHISE_PURPLE }]}>Active</Text>
            </View>
          </View>

          <View style={styles.bulkOrderCard}>
            {/* Header */}
            <View style={styles.bulkHeader}>
              <View style={styles.bulkIconContainer}>
                <Ionicons name="business" size={24} color={colors.textWhite} />
              </View>
              <View style={styles.bulkHeaderText}>
                <Text style={styles.bulkTitle}>Bulk Franchise Order</Text>
                <Text style={styles.bulkSubtitle}>Multiple customers • Hub routed</Text>
              </View>
            </View>

            {/* Order ID */}
            <View style={styles.bulkIdContainer}>
              <View>
                <Text style={styles.bulkLabel}>Franchise Order ID</Text>
                <Text style={styles.bulkValue}>{activeBulkOrder.id}</Text>
              </View>
              <View style={styles.outForDeliveryBadge}>
                <Text style={styles.outForDeliveryText}>Out for Delivery</Text>
              </View>
            </View>

            <Text style={styles.piecesText}>{activeBulkOrder.pieces} pieces • {activeBulkOrder.pieces} different customers</Text>

            {/* Destinations List */}
            <View style={styles.destinationsContainer}>
              <Text style={styles.destinationsTitle}>Delivery Destinations (All Trackable):</Text>
              {activeBulkOrder.destinations.map((dest: any) => (
                <View key={dest.id} style={styles.destinationRow}>
                  <View style={styles.destNumberContainer}>
                    <Text style={styles.destNumber}>{dest.id}</Text>
                  </View>
                  <View style={styles.destInfo}>
                    <Text style={styles.destName}>{dest.name}</Text>
                    <Text style={styles.destLocation} numberOfLines={1}>{dest.location}</Text>
                    <Text style={styles.destTracking}>{dest.tracking}</Text>
                  </View>
                  <Ionicons name="paper-plane-outline" size={16} color={FRANCHISE_PURPLE} />
                </View>
              ))}
            </View>

            {/* Delivery Flow */}
            <View style={styles.flowContainer}>
              <Text style={styles.flowTitle}>Delivery Flow:</Text>
              
              <View style={styles.flowStep}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.flowText}>Merchant → Pickup Rider → Hub</Text>
              </View>
              
              <View style={styles.flowConnector}>
                 <View style={styles.dottedLine} />
                 <Text style={styles.flowConnectorText}>Sorted & assigned at hub</Text>
              </View>

              <View style={styles.flowStep}>
                <Ionicons name="radio-button-on" size={20} color="#FF9800" />
                <Text style={[styles.flowText, { color: '#FF9800' }]}>Hub → Delivery Riders → Customers</Text>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📦 Franchise Delivery Info:</Text>
              <Text style={styles.infoText}>• Each piece goes to a different customer</Text>
              <Text style={styles.infoText}>• All {activeBulkOrder.pieces} pieces have unique tracking numbers</Text>
              <Text style={styles.infoText}>• All pieces routed through Hub</Text>
              <Text style={styles.infoText}>• Separate delivery riders per area</Text>
            </View>

            {/* Track All Button */}
            <TouchableOpacity style={styles.bulkTrackButton} onPress={() => {}}>
               <Ionicons name="git-branch-outline" size={20} color={colors.textWhite} />
               <Text style={styles.bulkTrackButtonText}>Track All {activeBulkOrder.pieces} Orders</Text>
            </TouchableOpacity>

          </View>
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
                  maxHeight: SCREEN_HEIGHT * 0.8,
                  paddingBottom: Math.max(insets.bottom, spacing.xl),
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Create Shipment</Text>
              <Text style={styles.modalSubtitle}>Choose your shipment type</Text>

              <View style={styles.shipmentTypeContainer}>
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
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30, // Rounded header
    borderBottomRightRadius: 30, // Rounded header
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize['3xl'], // Increased size
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Slightly more visible
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-start', // Left aligned like screenshot
    height: 100,
    justifyContent: 'space-between',
  },
  statNumber: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textWhite,
    opacity: 0.9,
    fontWeight: typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
    marginTop: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  createShipmentCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Elevated
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  createShipmentIcon: {
    width: 50,
    height: 50,
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
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.bold,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  
  // -- Tracking Card Refinements --
  trackingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E3F2FD', // Light blue tint
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  trackingId: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#1565C0', // Blue Text
    flex: 1,
  },
  trackingRecipient: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.lg,
    fontWeight: typography.fontWeight.medium,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  riderSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.success, // Green text for "x min away"
    fontWeight: typography.fontWeight.bold,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  address: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    flex: 1,
    fontWeight: typography.fontWeight.medium,
  },
  trackButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg, // Fully rounded
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  
  // -- Standard Shipment Card --
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
    fontWeight: typography.fontWeight.bold,
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
    fontWeight: typography.fontWeight.bold,
  },
  shipmentRecipient: {
    fontSize: typography.fontSize.sm, // Smaller name
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  shipmentAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  shipmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: spacing.sm,
  },
  shipmentItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  shipmentPrice: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  shipmentTrackButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  shipmentTrackButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },

  // -- Bulk Order Card Styles -- 
  bulkOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E1BEE7', // Soft purple border
    marginBottom: spacing.xl,
  },
  bulkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  bulkIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#9575CD', // Lighter purple icon bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  bulkHeaderText: {
    flex: 1,
  },
  bulkTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#4A148C', // Deep Purple
    marginBottom: 2,
  },
  bulkSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#7B1FA2',
    opacity: 0.8,
  },
  bulkIdContainer: {
    backgroundColor: '#FAFAFA',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  bulkLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  bulkValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  outForDeliveryBadge: {
    backgroundColor: '#E8F5E9', // Light green
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  outForDeliveryText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
  },
  piecesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.lg,
  },
  destinationsContainer: {
    marginBottom: spacing.xl,
  },
  destinationsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#4A148C',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4FF', // Very light purple
    padding: spacing.md,
    borderRadius: borderRadius.lg, // More rounded
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F3E5F5',
  },
  destNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#AB47BC', // Vibrant purple
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  destNumber: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  destInfo: {
    flex: 1,
  },
  destName: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 2,
  },
  destLocation: {
    fontSize: typography.fontSize.sm,
    color: '#757575',
    marginBottom: 2,
  },
  destTracking: {
    fontSize: 12,
    color: '#AB47BC', // Purple text for tracking
    fontWeight: '600',
  },
  flowContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  flowTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  flowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flowText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  flowConnector: {
    paddingLeft: 9, // Align with icon center (20px icon / 2 approx)
    height: 30, // vertical space
    flexDirection: 'row',
    alignItems: 'center',
  },
  dottedLine: {
    width: 2,
    height: '100%',
    borderLeftWidth: 2,
    borderLeftColor: '#E0E0E0',
    borderStyle: 'dotted',
    marginRight: spacing.md,
  },
  flowConnectorText: {
    fontSize: 10, 
    color: colors.textLight, 
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#F3E5F5', // Purple tint
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: 'bold',
    color: '#4A148C',
    marginBottom: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: '#6A1B9A',
    marginBottom: 4,
    lineHeight: 20,
  },
  bulkTrackButton: {
    backgroundColor: '#6200EA', // Deep intuitive purple
    borderRadius: 30, // Pill shape
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#6200EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bulkTrackButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },

  // -- Modal Styles --
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
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
