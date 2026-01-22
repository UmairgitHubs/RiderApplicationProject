import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

const ORANGE_HEADER = '#F26E21'; // Matches the image header
const PURPLE_ACCENT = '#9C27B0'; // For franchise flow icon/text
const STEP_GREEN = '#E8F5E9'; // Light green bg for steps
const STEP_ICON_GREEN = '#4CAF50'; // Green check
const STEP_ORANGE = '#FFF3E0'; // Light orange for active step
const STEP_ICON_ORANGE = '#FF9800'; // Orange dot
const BLUE_ETA_BG = '#E3F2FD'; // Light blue for ETA
const BLUE_ETA_TEXT = '#1565C0'; // Blue text

// Main tracking screen for franchise orders
export default function FranchiseTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  // @ts-ignore
  const { shipmentId, trackingNumber } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    try {
      if (!shipmentId) return;
      setLoading(true);
      const response = await shipmentApi.getById(shipmentId) as any;
      if (response.success && response.data?.shipment) {
        setShipment(response.data.shipment);
      }
    } catch (error) {
      console.error('Error fetching franchise shipment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTracking = async () => {
    const tn = shipment?.trackingNumber || trackingNumber;
    if (tn) {
      await Clipboard.setStringAsync(tn);
      // Could show toast here
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE_HEADER} />
      </View>
    );
  }

  const currentStatus = shipment?.status || 'pending';
  // Simplified logic for flow steps based on status
  const isPickedUp = ['picked_up', 'in_transit', 'delivered'].includes(currentStatus);
  const isAtHub = ['in_transit', 'delivered'].includes(currentStatus); // Simplified adaptation
  const isOutForDelivery = ['delivered'].includes(currentStatus) || currentStatus === 'in_transit'; 
  
  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 20) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Your Order</Text>
        <Text style={styles.headerSubtitle}>Franchise Delivery Flow</Text>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tracking Number Card */}
        <View style={styles.card}>
            <View style={styles.trackingRow}>
                <View>
                    <Text style={styles.label}>Tracking Number</Text>
                    <Text style={styles.trackingNumber}>{shipment?.trackingNumber || trackingNumber || '---'}</Text>
                </View>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyTracking}>
                    <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Franchise Delivery Flow Card */}
        <View style={[styles.card, styles.flowCard]}>
            <View style={styles.flowHeader}>
                <Ionicons name="business" size={20} color={PURPLE_ACCENT} />
                <Text style={styles.flowTitle}>Franchise Delivery Flow</Text>
            </View>

            {/* Step 1: Merchant Pickup */}
            <View style={styles.stepContainer}>
                <View style={[styles.stepIconContainer, { backgroundColor: isPickedUp ? STEP_GREEN : '#f0f0f0' }]}>
                    <Ionicons name="checkmark" size={16} color={isPickedUp ? STEP_ICON_GREEN : '#ccc'} />
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>1. Merchant Pickup</Text>
                    <Text style={styles.stepSubtitle}>{shipment?.merchant?.merchant?.business_name || shipment?.merchant?.business_name || shipment?.merchant?.full_name || 'Store Pickup'}</Text>
                    <Text style={styles.stepTime}>
                        {isPickedUp ? 'Completed' : 'Pending'}
                    </Text> 
                </View>
            </View>
            {/* Connector & Rider Info */}
            <View style={styles.connectorContainer}>
                 <View style={styles.riderRow}>
                     <Ionicons name="arrow-forward" size={14} color="#999" />
                     <Text style={styles.riderText}>
                        Rider: {shipment?.rider ? `${shipment.rider.full_name}` : 'Assigning...'}
                     </Text>
                 </View>
            </View>


            {/* Step 2: Franchise Hub */}
            <View style={styles.stepContainer}>
                <View style={[styles.stepIconContainer, { backgroundColor: isAtHub ? STEP_GREEN : '#f0f0f0' }]}>
                    <Ionicons name="checkmark" size={16} color={isAtHub ? STEP_ICON_GREEN : '#ccc'} />
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>2. Franchise Hub</Text>
                    <Text style={styles.stepSubtitle}>{shipment?.hub?.name || 'Central Hub'}</Text>
                    <Text style={styles.stepTime}>{isAtHub ? 'Processed' : 'Waiting'}</Text>
                </View>
            </View>
             {/* Connector & Rider Info */}
             <View style={styles.connectorContainer}>
                 <View style={styles.riderRow}>
                     <Ionicons name="arrow-forward" size={14} color="#999" />
                     <Text style={styles.riderText}>
                        Rider: {isAtHub && shipment?.rider ? `${shipment.rider.full_name}` : 'Pending assignment'}
                     </Text>
                 </View>
            </View>

            {/* Step 3: Customer Delivery */}
            <View style={styles.stepContainer}>
                 {/* Active State */}
                 <View style={[styles.stepIconContainer, { 
                     backgroundColor: isOutForDelivery ? STEP_ORANGE : '#f0f0f0', 
                     borderColor: isOutForDelivery ? '#FF9800' : 'transparent', 
                     borderWidth: isOutForDelivery ? 1 : 0 
                 }]}>
                    {isOutForDelivery && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9800' }} />}
                    {!isOutForDelivery && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' }} />}
                </View>
                <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: isOutForDelivery ? '#E65100' : '#212121' }]}>3. Customer Delivery</Text>
                    <Text style={styles.stepSubtitle}>{shipment?.recipientName || 'Recipient'}</Text>
                    <Text style={styles.stepTime}>
                        {isOutForDelivery ? 'Arriving soon' : shipment?.status === 'delivered' ? 'Delivered' : 'Estimated: 1 day'}
                    </Text>
                </View>
            </View>
        </View>

            {/* Status & ETA Card */}
            <View style={styles.card}>
                <View style={styles.statusHeaderRow}>
                    <View style={styles.statusIconBg}>
                        {isOutForDelivery || currentStatus === 'delivered' ? (
                             <Ionicons name="bicycle" size={24} color="#E65100" /> 
                        ) : (
                             <Ionicons name="cube" size={24} color="#E65100" />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusTitle}>{statusToText(currentStatus)}</Text>
                        <Text style={styles.statusDesc}>
                            {currentStatus === 'delivered' 
                                ? 'Package has been successfully delivered'
                                : currentStatus === 'in_transit'
                                  ? 'Delivery rider is heading to your location'
                                  : 'Shipment is being processed'}
                        </Text>
                    </View>
                </View>

            <View style={styles.etaBox}>
                <Ionicons name="time-outline" size={20} color={BLUE_ETA_TEXT} />
                <Text style={styles.etaText}><Text style={{fontWeight: 'bold'}}>ETA:</Text> Arriving in 1 hour</Text>
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

function statusToText(status: string) {
    const map: any = {
        'pending': 'Pending Pickup',
        'assigned': 'Rider Assigned',
        'picked_up': 'Picked Up',
        'in_transit': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
    };
    return map[status] || 'Processing';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: ORANGE_HEADER,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl, // Extra padding for curve effect if needed, or just flat
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: 180, // Taller header as per image
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50, // Approximate status bar area
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: 'white',
    marginTop: 40,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    marginTop: -40, // Overlap the header
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.xs,
  },
  flowCard: {
      backgroundColor: '#F8F9FE', 
      borderWidth: 1,
      borderColor: '#E1BEE7',
  },
  trackingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
  },
  label: {
      fontSize: 12,
      color: '#757575',
      marginBottom: 4,
  },
  trackingNumber: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#212121',
  },
  copyButton: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
  },
  copyText: {
      color: '#1976D2',
      fontWeight: 'bold',
      fontSize: 12,
  },
  
  // Flow Strings
  flowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
  },
  flowTitle: {
      color: PURPLE_ACCENT,
      fontSize: 16,
      fontWeight: 'bold',
  },
  stepContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
  },
  stepIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  stepContent: {
      flex: 1,
  },
  stepTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#212121',
      marginBottom: 2,
  },
  stepSubtitle: {
      fontSize: 12,
      color: '#616161',
      marginBottom: 2,
  },
  stepTime: {
      fontSize: 11,
      color: '#757575',
  },
  connectorContainer: {
      marginLeft: 16, 
      paddingLeft: 24, // Indent for the arrow
      marginVertical: 8,
  },
  riderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
  },
  riderText: {
      fontSize: 11, 
      color: '#9E9E9E',
  },
  
  // Status Card
  statusHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 16,
  },
  statusIconBg: {
      width: 48,
      height: 48,
      backgroundColor: '#FFF3E0',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },
  statusTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#212121',
  },
  statusDesc: {
      fontSize: 12,
      color: '#757575',
      maxWidth: 200,
  },
  etaBox: {
      backgroundColor: '#E3F2FD',
      padding: 16,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  etaText: {
      color: BLUE_ETA_TEXT,
      fontSize: 14,
  }
});
