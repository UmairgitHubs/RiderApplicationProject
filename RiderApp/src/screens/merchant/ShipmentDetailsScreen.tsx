import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

// Status mapping
const getStatusInfo = (status: string) => {
  const statusMap: { [key: string]: { label: string; description: string } } = {
    pending: { label: 'Order Created', description: 'Processing your shipment' },
    assigned: { label: 'Assigned', description: 'Rider assigned to your shipment' },
    picked_up: { label: 'Picked Up', description: 'Package picked up from merchant' },
    in_transit: { label: 'In Transit', description: 'Package is on the way' },
    delivered: { label: 'Delivered', description: 'Package delivered successfully' },
    cancelled: { label: 'Cancelled', description: 'Shipment has been cancelled' },
    returned: { label: 'Returned', description: 'Package returned to sender' },
  };
  return statusMap[status] || { label: status, description: 'Processing your shipment' };
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${month} ${day}, ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
};

export default function ShipmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);

  const shipmentId = route.params?.shipmentId || route.params?.id;

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    if (!shipmentId) {
      Alert.alert('Error', 'Shipment ID not provided');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await shipmentApi.getById(shipmentId);
      if (response.success && response.data?.shipment) {
        setShipment(response.data.shipment);
      } else {
        Alert.alert('Error', 'Failed to load shipment details');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Error fetching shipment details:', error);
      Alert.alert('Error', error.message || 'Failed to load shipment details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (shipment?.rider?.phone) {
      Linking.openURL(`tel:${shipment.rider.phone}`);
    } else {
      Alert.alert('Info', 'Rider phone number not available');
    }
  };

  const handleTrackMap = () => {
    const address = shipment?.deliveryAddress || shipment?.delivery_address;
    if (address) {
      const url = Platform.select({
        ios: `maps://app?q=${encodeURIComponent(address)}`,
        android: `geo:0,0?q=${encodeURIComponent(address)}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      });
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const getRiderInitial = (rider: any) => {
    if (!rider?.full_name) return 'R';
    return rider.full_name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Track Shipment</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!shipment) {
    return null;
  }

  const statusInfo = getStatusInfo(shipment.status);
  const trackingHistory = shipment.tracking_history || [];
  const sortedHistory = [...trackingHistory].reverse(); // Show oldest first

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Track Shipment</Text>
          <Text style={styles.headerSubtitle}>{shipment.trackingNumber || shipment.tracking_number}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="cube-outline" size={24} color={colors.text} />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>{statusInfo.label}</Text>
              <Text style={styles.statusDescription}>{statusInfo.description}</Text>
            </View>
          </View>
          {shipment.rider && (
            <View style={styles.riderSubCard}>
              <View style={styles.riderAvatar}>
                <Text style={styles.riderInitial}>{getRiderInitial(shipment.rider)}</Text>
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{shipment.rider.full_name || 'Rider'}</Text>
                <Text style={styles.riderSubtitle}>Your delivery rider</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTrackMap}>
            <Ionicons name="location" size={20} color="#2196F3" />
            <Text style={styles.actionButtonText}>Track Map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Chat', 'Chat feature coming soon!')}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#4CAF50" />
            <Text style={styles.actionButtonText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
            onPress={() => setActiveTab('timeline')}
          >
            <Text style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Timeline View */}
        {activeTab === 'timeline' && (
          <View style={styles.timelineContainer}>
            {sortedHistory.length > 0 ? (
              <View style={styles.timelineWrapper}>
                {/* Continuous green line */}
                <View style={styles.timelineVerticalLine} />
                
                {sortedHistory.map((event: any, index: number) => {
                  const merchantName = shipment.merchant?.full_name || shipment.merchant?.fullName || 'Merchant';
                  const riderName = shipment.rider?.full_name || shipment.rider?.fullName || 'Rider';
                  const merchantId = shipment.merchant_id || shipment.merchant?.id || '';
                  const riderId = shipment.rider_id || shipment.rider?.id || '';
                  
                  // Generate IDs and names based on status
                  let detailId = '';
                  let detailName = '';
                  let locationAddress = event.location_address;
                  
                  if (event.status === 'pending') {
                    detailId = merchantId ? `MER-${merchantId.substring(0, 6).toUpperCase()}` : 'MER-XXXXXX';
                    detailName = merchantName;
                    // For pending status, show pickup address
                    if (!locationAddress) {
                      locationAddress = shipment.pickupAddress || shipment.pickup_address;
                    }
                  } else if (event.status === 'picked_up' || event.status === 'in_transit' || event.status === 'assigned') {
                    if (riderId) {
                      detailId = `RID-${riderId.substring(0, 6).toUpperCase()}`;
                      detailName = riderName;
                    }
                    // For picked up, show pickup address if no location
                    if (!locationAddress && event.status === 'picked_up') {
                      locationAddress = shipment.pickupAddress || shipment.pickup_address;
                    }
                  }
                  
                  return (
                    <View key={event.id || index} style={styles.timelineItem}>
                      {/* Green checkmark at top of card */}
                      <View style={styles.timelineCheckmarkContainer}>
                        <View style={styles.timelineCheckmark}>
                          <Ionicons name="checkmark" size={16} color={colors.textWhite} />
                        </View>
                      </View>
                      
                      {/* Event card */}
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{getStatusInfo(event.status).label}</Text>
                        <Text style={styles.timelineDescription}>{event.notes || getStatusInfo(event.status).description}</Text>
                        <Text style={styles.timelineTime}>{formatDate(event.created_at)}</Text>
                        
                        {/* Details section */}
                        {(detailId || detailName || locationAddress) && (
                          <View style={styles.timelineDetails}>
                            {detailId && (
                              <Text style={styles.timelineDetailText}>
                                {event.status === 'pending' ? 'Merchant ID' : event.status === 'picked_up' || event.status === 'in_transit' ? 'Rider ID' : 'ID'}: {detailId}
                              </Text>
                            )}
                            {detailName && (
                              <Text style={styles.timelineDetailText}>{detailName}</Text>
                            )}
                            {locationAddress && (
                              <View style={styles.timelineLocationRow}>
                                <Ionicons name="location" size={12} color={colors.textLight} />
                                <Text style={styles.timelineLocationText}>{locationAddress}</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyTimeline}>
                <Text style={styles.emptyText}>No tracking history available</Text>
              </View>
            )}
          </View>
        )}

        {/* Details View */}
        {activeTab === 'details' && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Shipment Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tracking Number</Text>
                <Text style={styles.detailValue}>{shipment.trackingNumber || shipment.tracking_number}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{getStatusInfo(shipment.status).label}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{shipment.recipientName || shipment.recipient_name}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient Phone</Text>
                <Text style={styles.detailValue}>{shipment.recipientPhone || shipment.recipient_phone}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailSectionTitle}>Addresses</Text>
              <View style={styles.addressDetailRow}>
                <Ionicons name="location" size={16} color={colors.error} />
                <View style={styles.addressDetailContent}>
                  <Text style={styles.addressDetailLabel}>Pickup Address</Text>
                  <Text style={styles.addressDetailText}>{shipment.pickupAddress || shipment.pickup_address}</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.addressDetailRow}>
                <Ionicons name="location" size={16} color={colors.success} />
                <View style={styles.addressDetailContent}>
                  <Text style={styles.addressDetailLabel}>Delivery Address</Text>
                  <Text style={styles.addressDetailText}>{shipment.deliveryAddress || shipment.delivery_address}</Text>
                </View>
              </View>
            </View>

            {shipment.packages && shipment.packages.length > 0 && (
              <View style={styles.detailCard}>
                <Text style={styles.detailSectionTitle}>Packages ({shipment.packages.length})</Text>
                {shipment.packages.map((pkg: any, index: number) => (
                  <View key={pkg.id || index}>
                    {index > 0 && <View style={styles.detailDivider} />}
                    <View style={styles.packageDetailRow}>
                      <Text style={styles.packageDetailLabel}>Package {pkg.packageNumber || pkg.package_number}</Text>
                      <Text style={styles.packageDetailValue}>{pkg.barcodeNumber || pkg.barcode_number}</Text>
                    </View>
                    {pkg.packageType && (
                      <Text style={styles.packageDetailInfo}>Type: {pkg.packageType || pkg.package_type}</Text>
                    )}
                    {pkg.packageWeight && (
                      <Text style={styles.packageDetailInfo}>Weight: {pkg.packageWeight || pkg.package_weight} kg</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
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
  header: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginTop: spacing.xs,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  statusCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  statusTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statusDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  riderSubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  riderInitial: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs / 2,
  },
  riderSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.backgroundLight,
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  timelineContainer: {
    marginTop: spacing.sm,
    position: 'relative',
  },
  timelineWrapper: {
    position: 'relative',
    paddingLeft: 44, // Space for checkmark (24px) + line + padding
  },
  timelineVerticalLine: {
    position: 'absolute',
    left: 11.5, // Perfect center: 24px checkmark / 2 = 12px, minus half of 2.5px line (1.25px) = 10.75px, but we use 11.5px for visual centering
    top: 12, // Start from center of first checkmark (12px = half of 24px)
    bottom: 0,
    width: 2.5,
    backgroundColor: '#4CAF50', // Pure green color
  },
  timelineItem: {
    marginBottom: spacing.lg,
    position: 'relative',
    minHeight: 60, // Ensure minimum height for proper spacing
  },
  timelineCheckmarkContainer: {
    position: 'absolute',
    left: -36, // Position checkmark: -44px (padding) + 8px (offset) = -36px
    top: 0,
    zIndex: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50', // Pure green color matching the line
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.backgroundLight,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  timelineContent: {
    backgroundColor: '#F5F5F5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timelineTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  timelineDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  timelineTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  timelineDetails: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  timelineDetailText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs / 2,
  },
  timelineLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.xs / 2,
  },
  timelineLocationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginLeft: spacing.xs / 2,
    flex: 1,
    lineHeight: 16,
  },
  emptyTimeline: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  detailCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  detailSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  addressDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  addressDetailContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  addressDetailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  addressDetailText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  packageDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  packageDetailLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  packageDetailValue: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    fontFamily: 'monospace',
  },
  packageDetailInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
});
