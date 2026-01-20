import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

export default function RiderOrderDetailsScreen({ navigation, route }: any) {
  const [orderStatus, setOrderStatus] = useState<'assigned' | 'arrived-pickup' | 'picked-up' | 'arrived-delivery' | 'delivered'>('assigned');

  const order = {
    trackingId: 'CE2024001234567',
    earnings: 45.99,
    merchantName: 'Tech Store NYC',
    merchantPhone: '+1 (555) 123-4567',
    pickupAddress: '123 Main St, Manhattan, NY 10001',
    deliveryAddress: '456 Park Ave, Brooklyn, NY 11201',
    recipientName: 'Sarah Johnson',
    recipientPhone: '+1 (555) 987-6543',
    itemType: 'Electronics',
    itemWeight: '2.5 kg',
    packageSize: 'Medium',
    declaredValue: '$100.00',
    distance: '2.3 km',
    estimatedTime: '18 min',
    specialInstructions: 'Please handle with care. Fragile items inside.',
    orderTime: 'Dec 1, 2024 - 08:30 AM',
    pickupTime: 'Dec 1, 2024 - 09:15 AM',
    estimatedDelivery: 'Dec 1, 2024 - 11:00 AM',
  };

  const handleCall = (phoneNumber: string, name: string) => {
    Alert.alert(
      `Call ${name}`,
      phoneNumber,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
      ]
    );
  };

  const handleNavigate = (address: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  const handleStatusUpdate = () => {
    const statusFlow: any = {
      'assigned': 'arrived-pickup',
      'arrived-pickup': 'picked-up',
      'picked-up': 'arrived-delivery',
      'arrived-delivery': 'delivered',
    };

    if (orderStatus === 'delivered') {
      navigation.goBack();
    } else {
      setOrderStatus(statusFlow[orderStatus]);
    }
  };

  const getStatusText = () => {
    switch (orderStatus) {
      case 'assigned':
        return 'Arrive at Pickup';
      case 'arrived-pickup':
        return 'Confirm Pickup';
      case 'picked-up':
        return 'Arrive at Delivery';
      case 'arrived-delivery':
        return 'Complete Delivery';
      case 'delivered':
        return 'Completed';
      default:
        return 'Update Status';
    }
  };

  const getCurrentStep = () => {
    const steps = ['assigned', 'arrived-pickup', 'picked-up', 'arrived-delivery', 'delivered'];
    return steps.indexOf(orderStatus);
  };

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
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>{order.trackingId}</Text>
        </View>

        {/* Earnings Badge */}
        <View style={styles.earningsBadge}>
          <Ionicons name="cash" size={24} color={colors.success} />
          <Text style={styles.earningsText}>${order.earnings.toFixed(2)}</Text>
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
              <View style={[styles.stepDot, getCurrentStep() >= 0 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Assigned</Text>
            </View>
            <View style={[styles.stepLine, getCurrentStep() >= 1 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, getCurrentStep() >= 2 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Picked Up</Text>
            </View>
            <View style={[styles.stepLine, getCurrentStep() >= 3 && styles.stepLineActive]} />
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, getCurrentStep() >= 4 && styles.stepDotActive]} />
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
                  <Text style={styles.infoValue}>{order.merchantName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(order.merchantPhone, order.merchantName)}
                >
                  <Ionicons name="call" size={20} color={colors.textWhite} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: colors.info }]}
                  onPress={() => navigation.navigate('Chat', {
                    recipientName: order.merchantName,
                    recipientRole: 'Merchant',
                    recipientId: 'merchant-id-123', // This should be dynamic
                    recipientPhone: order.merchantPhone,
                    shipmentId: order.trackingId // This should be dynamic
                  })}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.address}>{order.pickupAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => handleNavigate(order.pickupAddress)}
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
                  <Text style={styles.infoValue}>{order.recipientName}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => handleCall(order.recipientPhone, order.recipientName)}
                >
                  <Ionicons name="call" size={20} color={colors.textWhite} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.callButton, { backgroundColor: colors.info }]}
                  onPress={() => navigation.navigate('Chat', {
                    recipientName: order.recipientName,
                    recipientRole: 'Customer',
                    recipientId: 'customer-id-456',
                    recipientPhone: order.recipientPhone,
                    shipmentId: order.trackingId
                  })}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color={colors.textWhite} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.address}>{order.deliveryAddress}</Text>
            <TouchableOpacity 
              style={styles.navigateButton}
              onPress={() => handleNavigate(order.deliveryAddress)}
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
              <Text style={styles.detailValue}>{order.itemType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Package Size</Text>
              <Text style={styles.detailValue}>{order.packageSize}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{order.itemWeight}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Declared Value</Text>
              <Text style={styles.detailValue}>{order.declaredValue}</Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <View style={styles.instructionsCard}>
              <Ionicons name="information-circle" size={24} color={colors.warning} />
              <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
            </View>
          </View>
        )}

        {/* Time Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <Ionicons name="time-outline" size={20} color={colors.textLight} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Order Placed</Text>
                <Text style={styles.timelineValue}>{order.orderTime}</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <Ionicons name="navigate-outline" size={20} color={colors.textLight} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Distance</Text>
                <Text style={styles.timelineValue}>{order.distance} • {order.estimatedTime}</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <Ionicons name="flag-outline" size={20} color={colors.textLight} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Estimated Delivery</Text>
                <Text style={styles.timelineValue}>{order.estimatedDelivery}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        {orderStatus !== 'delivered' && (
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => {
              Alert.alert('Report Issue', 'What seems to be the problem?');
            }}
          >
            <Ionicons name="warning-outline" size={20} color={colors.error} />
            <Text style={styles.reportButtonText}>Report Issue</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.statusButton}
          onPress={handleStatusUpdate}
        >
          <Text style={styles.statusButtonText}>{getStatusText()}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textWhite} />
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
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
    padding: spacing.lg,
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



