import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useRiderOrderDetails } from '../../hooks/useRiderOrderDetails';

export default function RiderOrderDetailsScreen({ navigation, route }: any) {
  const { orderId } = route.params || {};
  const insets = useSafeAreaInsets();
  
  const {
    order,
    isLoading,
    error,
    handleCall,
    handleNavigate,
    buttonAction,
    isProcessing,
    refetch
  } = useRiderOrderDetails(orderId);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
        <Text style={styles.errorText}>Failed to load order</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isHubPickup = !!order.pickup_rider_id || order.status === 'received_at_hub';
  const isDirectDelivery = !order.hub_id;
  const isDeliveringToHub = order.hub_id && !isHubPickup && (order.status === 'pending' || order.status === 'assigned' || order.status === 'picked_up');

  // Map backend fields to UI fields
  const displayOrder = {
    trackingId: order.tracking_number,
    earnings: Number(order.delivery_fee),
    merchantName: order.merchant?.business_name || order.merchant?.full_name || 'Merchant',
    merchantPhone: order.merchant?.phone || '',
    pickupAddress: isHubPickup ? (order.hub?.address || order.hub?.name || 'Hub') : (order.pickup_address || order.merchant?.address),
    deliveryAddress: isDeliveringToHub ? (order.hub?.address || order.hub?.name || 'Hub') : order.delivery_address,
    recipientName: isDeliveringToHub ? (order.hub?.name || 'Hub Center') : order.recipient_name,
    recipientPhone: isDeliveringToHub ? '' : order.recipient_phone,
    itemType: order.package_type || order.shipment_type || 'Package',
    itemWeight: order.package_weight ? `${order.package_weight} kg` : 'N/A',
    packageSize: order.packages?.[0]?.package_size || 'Standard',
    declaredValue: order.package_value ? `$${order.package_value}` : 'N/A',
    distance: order.distance_km ? `${order.distance_km} km` : 'N/A',
    estimatedTime: order.estimated_delivery_time ? `${order.estimated_delivery_time} min` : 'N/A',
    specialInstructions: order.special_instructions || order.notes,
    orderTime: new Date(order.created_at).toLocaleString(),
    estimatedDelivery: order.scheduled_delivery_time 
       ? new Date(order.scheduled_delivery_time).toLocaleString()
       : new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString(), // Fallback estimate
  };

  // Build Dynamic Timeline
  const trackingHistory = order.tracking_history || [];
  const timelineEvents = [
    {
      id: `placed-${order.id}`,
      title: 'Order Placed',
      time: new Date(order.created_at).toLocaleString(),
      icon: 'time-outline',
      description: 'Order created by merchant'
    }
  ];

    // Add history events
    trackingHistory.slice().reverse().forEach((event: any, index: number) => {
      if (event.status === 'pending') return;
      
      let title = event.notes || ''; // Prioritize more descriptive notes
      let icon: any = 'ellipse-outline';
      
      if (!title) {
        switch(event.status) {
            case 'assigned': title = 'Assigned to Rider'; icon = 'person-outline'; break;
            case 'picked_up': title = 'Picked Up'; icon = 'cube-outline'; break;
            case 'in_transit': title = 'In Transit'; icon = 'navigate-outline'; break;
            case 'delivered': title = 'Delivered'; icon = 'checkmark-circle-outline'; break;
            case 'received_at_hub': title = 'Received at Hub'; icon = 'business-outline'; break;
            default: title = event.status;
        }
      } else {
        // Assign icons based on status even if we use notes as title
        switch(event.status) {
            case 'assigned': icon = 'person-outline'; break;
            case 'picked_up': icon = 'cube-outline'; break;
            case 'in_transit': icon = 'navigate-outline'; break;
            case 'delivered': icon = 'checkmark-circle-outline'; break;
            case 'received_at_hub': icon = 'business-outline'; break;
        }
      }
      
      timelineEvents.push({
          id: event.id || `evt-${index}`,
          title,
          time: new Date(event.created_at || event.timestamp).toLocaleString(),
          icon,
          description: event.location_address || event.location ? `at ${event.location_address || event.location}` : ''
    });
  });

  // Calculate current step for progress bar
  const getStepIndex = () => {
      const status = order.status;
      if (status === 'delivered') return 4;
      if (status === 'picked_up' || status === 'in_transit') return 2;
      if (status === 'assigned') return 0;
      return -1;
  };
  const currentStep = getStepIndex();

  return (
    <View style={styles.container}>
      {/* Premium Original Design Header */}
      <View style={[styles.orangeHeader, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>{displayOrder.trackingId}</Text>
        </View>

        {/* Earnings Badge - Matching design exactly */}
        <View style={styles.earningsBadge}>
          <Ionicons name="cash" size={26} color="#FFF" />
          <Text style={styles.earningsText}>${displayOrder.earnings.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
           <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressSteps}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 0 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Assigned</Text>
            </View>
            <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Picked Up</Text>
            </View>
            <View style={[styles.stepLine, currentStep >= 4 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 4 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Pickup Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{isHubPickup ? 'Hub Information' : 'Pickup Information'}</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoHeaderLeft}>
                <View style={styles.pickupIcon}>
                  <View style={styles.pickupDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{isHubPickup ? 'Origin Hub' : 'Pickup Location'}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{isHubPickup ? (order.hub?.name || 'Hub Center') : displayOrder.merchantName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(displayOrder.merchantPhone, displayOrder.merchantName)}
                >
                  <Ionicons name="call" size={20} color={colors.textWhite} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => navigation.navigate('Chat', {
                    recipientName: displayOrder.merchantName,
                    recipientRole: 'Merchant',
                    recipientId: order.merchant_id,
                    recipientPhone: displayOrder.merchantPhone,
                    shipmentId: order.id
                  })}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={colors.textWhite} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: '#333' }]}
                  onPress={() => navigation.navigate('QRScanner', {
                    orderId: order.id,
                    order: order,
                    scanType: 'pickup'
                  })}
                >
                  <Ionicons name="scan-outline" size={20} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.address}>{displayOrder.pickupAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => navigation.navigate('Navigation', {
                type: isHubPickup ? 'Hub' : 'Pickup',
                address: displayOrder.pickupAddress,
                latitude: Number(order?.pickup_latitude || order?.pickupLatitude || 0),
                longitude: Number(order?.pickup_longitude || order?.pickupLongitude || 0),
                recipientName: isHubPickup ? (order.hub?.name || 'Hub Center') : displayOrder.merchantName,
                trackingId: displayOrder.trackingId,
                distance: displayOrder.distance,
                estimatedTime: displayOrder.estimatedTime,
                phone: isHubPickup ? '' : displayOrder.merchantPhone,
              })}
            >
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={styles.navigateButtonText}>{isHubPickup ? 'Navigate to Hub' : 'Navigate to Pickup'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoHeaderLeft}>
                <View style={styles.deliveryIcon}>
                  <Ionicons name="location" size={20} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{isDeliveringToHub ? 'Target Hub' : 'Recipient'}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{displayOrder.recipientName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(displayOrder.recipientPhone, displayOrder.recipientName)}
                >
                  <Ionicons name="call" size={20} color={colors.textWhite} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: '#2962FF' }]}
                  onPress={() => navigation.navigate('QRScanner', {
                    orderId: order.id,
                    order: order,
                    scanType: 'delivery'
                  })}
                >
                  <Ionicons name="scan-outline" size={20} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.address}>{displayOrder.deliveryAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => navigation.navigate('Navigation', {
                type: isDeliveringToHub ? 'Hub' : 'Delivery',
                address: displayOrder.deliveryAddress,
                latitude: isDeliveringToHub ? Number(order.hub?.latitude) : Number(order?.delivery_latitude || order?.deliveryLatitude || 0),
                longitude: isDeliveringToHub ? Number(order.hub?.longitude) : Number(order?.delivery_longitude || order?.deliveryLongitude || 0),
                recipientName: displayOrder.recipientName,
                trackingId: displayOrder.trackingId,
                distance: displayOrder.distance,
                estimatedTime: displayOrder.estimatedTime,
                phone: displayOrder.recipientPhone,
              })}
            >
              <Ionicons name="navigate" size={18} color={colors.primary} />
              <Text style={styles.navigateButtonText}>{isDeliveringToHub ? 'Navigate to Hub' : 'Navigate to Delivery'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Package Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item Type</Text>
              <Text style={styles.detailValue}>{displayOrder.itemType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Package Size</Text>
              <Text style={styles.detailValue}>{displayOrder.packageSize}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{displayOrder.itemWeight}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Declared Value</Text>
              <Text style={styles.detailValue}>{displayOrder.declaredValue}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        {displayOrder.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle" size={24} color={colors.warning} />
              <Text style={styles.instructionsText}>{displayOrder.specialInstructions}</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            {timelineEvents.map((event, index) => (
                <View key={event.id} style={styles.timelineItem}>
                  <Ionicons name={event.icon as any} size={20} color={index === 0 ? colors.primary : colors.textLight} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>{event.title}</Text>
                    <Text style={styles.timelineValue}>
                        {event.time}
                        {event.description ? ` • ${event.description}` : ''}
                    </Text>
                  </View>
                </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Responsive Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, spacing.lg), paddingTop: spacing.md }]}>
        
        {buttonAction ? (
            <TouchableOpacity 
              style={[
                styles.statusButton, 
                buttonAction.variant === 'success' && { backgroundColor: colors.success },
                buttonAction.variant === 'primary' && { backgroundColor: colors.primary },
                buttonAction.variant === 'disabled' && { backgroundColor: '#64748B' }
              ]}
              onPress={buttonAction.onPress}
              disabled={buttonAction.variant === 'disabled' || isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                 <ActivityIndicator color={colors.textWhite} />
              ) : (
                <View style={styles.statusButtonContent}>
                  <Text style={styles.statusButtonText}>{buttonAction.label}</Text>
                  {buttonAction.variant !== 'disabled' && (
                     <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
                  )}
                </View>
              )}
            </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  errorText: {
     marginTop: spacing.md,
     fontSize: typography.fontSize.lg,
     color: colors.text,
     marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.textWhite,
    fontWeight: 'bold',
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  headerTextContainer: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textWhite,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
    fontWeight: '600',
  },
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  earningsText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  progressCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    marginBottom: spacing.xs,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  stepDotActive: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: -10,
    marginBottom: 16,
    zIndex: 1,
  },
  stepLineActive: {
    backgroundColor: colors.success,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: spacing.md,
    paddingLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  pickupIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
  },
  deliveryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  address: {
    fontSize: 15,
    color: '#475569',
    marginBottom: spacing.lg,
    lineHeight: 22,
    fontWeight: '600',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  navigateButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '900',
  },
  detailsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  instructionsCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    padding: spacing.lg,
    borderLeftWidth: 6,
    borderLeftColor: colors.warning,
  },
  instructionsText: {
    flex: 1,
    fontSize: 15,
    color: '#7C2D12',
    lineHeight: 24,
    fontWeight: '700',
  },
  timelineCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
  },
  timelineValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  reportButtonText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '900',
  },
  statusButton: {
    flex: 1,
    borderRadius: 20,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  statusButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.textWhite,
  },
});
