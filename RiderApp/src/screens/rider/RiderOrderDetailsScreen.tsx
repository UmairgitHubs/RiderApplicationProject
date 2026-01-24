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

  // Map backend fields to UI fields
  const displayOrder = {
    trackingId: order.tracking_number,
    earnings: Number(order.delivery_fee),
    merchantName: order.merchant?.full_name || order.merchant?.business_name || 'Merchant',
    merchantPhone: order.merchant?.phone || '',
    pickupAddress: order.pickup_address,
    deliveryAddress: order.delivery_address,
    recipientName: order.recipient_name,
    recipientPhone: order.recipient_phone,
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
      title: 'Order Placed',
      time: new Date(order.created_at).toLocaleString(),
      icon: 'time-outline',
      description: 'Order created by merchant'
    }
  ];

  // Add history events
  trackingHistory.slice().reverse().forEach((event: any) => {
    if (event.status === 'pending') return; // Skip pending if it's just creation
    
    let title = '';
    let icon: any = 'ellipse-outline';
    
    switch(event.status) {
        case 'assigned': title = 'Assigned to Rider'; icon = 'person-outline'; break; // Could be "You" if we check ID but "Rider" is safe
        case 'picked_up': title = 'Picked Up'; icon = 'cube-outline'; break;
        case 'in_transit': title = 'In Transit'; icon = 'navigate-outline'; break;
        case 'delivered': title = 'Delivered'; icon = 'checkmark-circle-outline'; break;
        default: title = event.status;
    }

    if (title) {
        timelineEvents.push({
            title,
            time: new Date(event.created_at).toLocaleString(),
            icon,
            description: event.location_address || event.notes
        });
    }
  });

  // If not delivered, show Estimated Delivery at the end
  if (order.status !== 'delivered') {
    timelineEvents.push({
        title: 'Estimated Delivery',
        time: displayOrder.estimatedDelivery,
        icon: 'flag-outline',
        description: `${displayOrder.distance} • ${displayOrder.estimatedTime}`
    });
  }

  const getStepStatus = () => {
    switch(order.status) {
        case 'assigned': return 0; // Assigned
        case 'picked_up': return 2; // Picked Up (Skipping Arrived at Pickup visually if backend doesn't track it explicitly)
        case 'in_transit': return 2;
        case 'delivered': return 4;
        default: return 0;
    }
  };

  const currentStep = getStepStatus();

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
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

        {/* Earnings Badge */}
        <View style={styles.earningsBadge}>
          <Ionicons name="cash" size={24} color={colors.success} />
          <Text style={styles.earningsText}>${displayOrder.earnings.toFixed(2)}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Steps */}
        <View style={styles.progressCard}>
          <View style={styles.progressSteps}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 0 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Assigned</Text>
            </View>
            <View style={[styles.stepLine, currentStep >= 1 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Picked Up</Text>
            </View>
            <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, currentStep >= 4 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* Pickup Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoHeaderLeft}>
                <View style={styles.pickupIcon}>
                  <View style={styles.pickupDot} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Pickup Location</Text>
                  <Text style={styles.infoValue}>{displayOrder.merchantName}</Text>
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
                  style={[styles.callButton, { backgroundColor: colors.info }]}
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
              </View>
            </View>
            <Text style={styles.address}>{displayOrder.pickupAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => handleNavigate(displayOrder.pickupAddress)}
            >
              <Ionicons name="navigate" size={20} color={colors.primary} />
              <Text style={styles.navigateButtonText}>Navigate to Pickup</Text>
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
                <View>
                  <Text style={styles.infoLabel}>Delivery Location</Text>
                  <Text style={styles.infoValue}>{displayOrder.recipientName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(displayOrder.recipientPhone, displayOrder.recipientName)}
                >
                  <Ionicons name="call" size={20} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.address}>{displayOrder.deliveryAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => handleNavigate(displayOrder.deliveryAddress)}
            >
              <Ionicons name="navigate" size={20} color={colors.primary} />
              <Text style={styles.navigateButtonText}>Navigate to Delivery</Text>
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

        {/* Time Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            {timelineEvents.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <Ionicons name={event.icon as any} size={20} color={index === timelineEvents.length - 1 ? colors.primary : colors.textLight} />
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

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.lg }]}>
         {/* Only show report button if not delivered */}
        {order.status !== 'delivered' && (
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => {
              Alert.alert('Report Issue', 'Please contact support or the merchant for assistance.');
            }}
          >
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={styles.reportButtonText}>Report</Text>
          </TouchableOpacity>
        )}
        
        {buttonAction ? (
            <TouchableOpacity 
              style={[
                styles.statusButton, 
                buttonAction.variant === 'success' && { backgroundColor: colors.success },
                buttonAction.variant === 'disabled' && { backgroundColor: colors.textLight }
              ]}
              onPress={buttonAction.onPress}
              disabled={buttonAction.variant === 'disabled' || isProcessing}
            >
              {isProcessing ? (
                 <ActivityIndicator color={colors.textWhite} />
              ) : (
                <>
                  <Text style={styles.statusButtonText}>{buttonAction.label}</Text>
                  {buttonAction.variant !== 'disabled' && (
                     <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
                  )}
                </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.backgroundLight,
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
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginBottom: spacing.md,
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
  earningsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  earningsText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 140,
  },
  progressCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    marginBottom: spacing.xs,
    borderWidth: 3,
    borderColor: colors.background,
  },
  stepDotActive: {
    backgroundColor: colors.success,
  },
  stepLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    textAlign: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.success,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
  },
  deliveryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  address: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  navigateButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  detailsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  },
  detailValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  instructionsCard: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#FFF3E0',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  instructionsText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
  },
  timelineCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  timelineValue: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  reportButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.error,
    fontWeight: typography.fontWeight.bold,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statusButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
});



