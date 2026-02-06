import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

const ORANGE_HEADER = '#F26E21'; 
const PURPLE_ACCENT = '#9C27B0';
const STEP_GREEN = '#E8F5E9'; 
const STEP_ICON_GREEN = '#4CAF50'; 
const STEP_ORANGE = '#FFF3E0'; 
const STEP_ICON_ORANGE = '#FF9800'; 
const MSG_BLUE = '#E3F2FD';

export default function FranchiseTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  // @ts-ignore
  const { shipmentId, trackingNumber } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipment, setShipment] = useState<any>(null);

  const fetchShipmentDetails = async (isRef = false) => {
    try {
      if (!shipmentId) return;
      if (!isRef) setLoading(true);
      const response = await shipmentApi.getById(shipmentId) as any;
      if (response.success && response.data?.shipment) {
        setShipment(response.data.shipment);
      }
    } catch (error) {
      console.error('Error fetching franchise shipment details:', error);
    } finally {
      if (!isRef) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchShipmentDetails();
    // Poll every 15 seconds for updates
    const interval = setInterval(() => {
        fetchShipmentDetails(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [shipmentId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShipmentDetails(true);
  }, []);

  const handleCopyTracking = async () => {
    const tn = shipment?.trackingNumber || trackingNumber;
    if (tn) {
      await Clipboard.setStringAsync(tn);
      Alert.alert('Copied', 'Tracking number copied to clipboard');
    }
  };

  const handleCallRider = () => {
      if (shipment?.rider?.phone) {
          Linking.openURL(`tel:${shipment.rider.phone}`);
      } else {
          Alert.alert('Unavailable', 'Rider phone number is not available');
      }
  };

  const handleChatRider = () => {
      if (!shipment?.rider?.id) return;
      
      (navigation as any).navigate('Chat', {
          shipmentId: shipment.id,
          recipientId: shipment.rider.id,
          recipientName: shipment.rider.full_name,
          recipientRole: 'rider'
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE_HEADER} />
      </View>
    );
  }

  const currentStatus = shipment?.status || 'pending';
  // Logic for flow steps
  const isPickedUp = ['picked_up', 'received_at_hub', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus);
  const isAtHub = ['received_at_hub', 'in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus);
  const isOutForDelivery = ['in_transit', 'out_for_delivery', 'delivered'].includes(currentStatus);
  const isDelivered = currentStatus === 'delivered';

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                    <Text style={styles.stepSubtitle}>{shipment?.merchant?.business_name || 'Store Pickup'}</Text>
                    <Text style={styles.stepTime}>{isPickedUp ? 'Completed' : 'Pending'}</Text> 
                </View>
            </View>

            {/* Step 2: Franchise Hub */}
            <View style={styles.stepContainer}>
                <View style={[styles.timelineLine, { backgroundColor: isAtHub ? STEP_ICON_GREEN : '#E0E0E0' }]} />
                <View style={[styles.stepIconContainer, { backgroundColor: isAtHub ? STEP_GREEN : '#f0f0f0' }]}>
                    <Ionicons name="checkmark" size={16} color={isAtHub ? STEP_ICON_GREEN : '#ccc'} />
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>2. Franchise Hub Distribution</Text>
                    <Text style={styles.stepSubtitle}>{shipment?.hub?.name || 'Central Hub'}</Text>
                    <Text style={styles.stepTime}>{isAtHub ? 'Processed' : 'Waiting'}</Text>
                </View>
            </View>

            {/* Step 3: Out for Delivery */}
            <View style={styles.stepContainer}>
                <View style={[styles.timelineLine, { backgroundColor: isOutForDelivery ? STEP_ICON_GREEN : '#E0E0E0' }]} />
                 <View style={[styles.stepIconContainer, { 
                     backgroundColor: isOutForDelivery ? STEP_ORANGE : '#f0f0f0', 
                     borderColor: isOutForDelivery ? '#FF9800' : 'transparent', 
                     borderWidth: isOutForDelivery ? 1 : 0 
                 }]}>
                    {isOutForDelivery && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9800' }} />}
                    {!isOutForDelivery && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' }} />}
                </View>
                <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: isOutForDelivery ? '#E65100' : '#212121' }]}>3. Out for Delivery</Text>
                    <Text style={styles.stepSubtitle}>{shipment?.recipient_name || shipment?.recipientName || 'Recipient'}</Text>
                    <Text style={styles.stepTime}>
                        {isDelivered ? 'Delivered successfully' : isOutForDelivery ? 'Rider is on the way' : 'Estimated: 1 day'}
                    </Text>
                </View>
            </View>

            {/* Interactive Rider Info Section */}
            {(isOutForDelivery || shipment?.rider) && (
                <View style={styles.riderSection}>
                    <View style={styles.riderInfo}>
                        <View style={styles.riderAvatar}>
                            <Ionicons name="person" size={20} color="#666" />
                        </View>
                        <View>
                            <Text style={styles.riderName}>{shipment?.rider?.full_name || 'Assigned Rider'}</Text>
                            <Text style={styles.riderBike}>
                                {shipment?.rider?.rider?.vehicle_type || 'Delivery Partner'} • {shipment?.rider?.rider?.vehicle_number || '---'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.contactButtons}>
                        <TouchableOpacity style={styles.chatButton} onPress={handleChatRider}>
                             <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.callButton} onPress={handleCallRider}>
                             <Ionicons name="call-outline" size={20} color={STEP_ICON_GREEN} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

        </View>

            {/* Status & ETA Card */}
            <View style={styles.card}>
                <View style={styles.statusHeaderRow}>
                    <View style={styles.statusIconBg}>
                         <Ionicons name={isDelivered ? "checkmark-circle" : "cube"} size={26} color="#E65100" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusTitle}>{statusToText(currentStatus)}</Text>
                        <Text style={styles.statusDesc}>
                            {isDelivered
                                ? 'Package delivered successfully.'
                                : isOutForDelivery
                                  ? 'Your package is out for delivery.'
                                  : 'Package is moving through our network.'}
                        </Text>
                    </View>
                </View>

            <View style={styles.etaBox}>
                <Ionicons name="time-outline" size={20} color="#1565C0" />
                <Text style={styles.etaText}>
                    <Text style={{fontWeight: 'bold'}}>ETA: </Text> 
                    {shipment?.estimatedDeliveryTime 
                        ? `${shipment.estimatedDeliveryTime} mins` 
                        : isDelivered ? 'Delivered' : 'By End of Day'}
                </Text>
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
        'received_at_hub': 'At Hub',
        'in_transit': 'In Transit',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
        'failed': 'Delivery Failed'
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
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: 180,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
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
    marginTop: -40,
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
      marginBottom: 20, 
      position: 'relative',
  },
  timelineLine: {
      position: 'absolute',
      left: 15, // center of icon (32/2 - 1)
      top: -24, // overlap with previous
      bottom: 24,
      width: 2,
      backgroundColor: '#E0E0E0',
      zIndex: -1,
  },
  stepIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
  },
  stepContent: {
      flex: 1,
      paddingTop: 4,
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

  // Rider Section
  riderSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'white',
      padding: 12,
      borderRadius: 12,
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#EFEFEF',
  },
  riderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
  },
  riderAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#F5F5F5',
      justifyContent: 'center',
      alignItems: 'center',
  },
  riderName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
  },
  riderBike: {
      fontSize: 12,
      color: '#757575',
  },
  contactButtons: {
      flexDirection: 'row',
      gap: 10,
  },
  chatButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: PURPLE_ACCENT,
      justifyContent: 'center',
      alignItems: 'center',
  },
  callButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#E8F5E9',
      justifyContent: 'center',
      alignItems: 'center',
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
      color: '#1565C0',
      fontSize: 14,
  }
});
