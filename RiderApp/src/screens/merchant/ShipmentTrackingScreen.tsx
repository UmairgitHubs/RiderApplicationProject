import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';
import { api, shipmentApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TimelineItem {
  title: string;
  desc: string;
  time: string;
  id: string;
  entity: string;
  loc: string;
  isCompleted: boolean;
}

/**
 * ShipmentTrackingScreen - Senior Developer Edition
 * - Complete Backend Integration
 * - Dynamic Timeline Generation
 * - Pull-to-Refresh Support
 * - Error Boundaries & Empty States
 */

const ORANGE = '#F37022';
const GREEN = '#00C853';
const BG_COLOR = '#F9FAFB';

export default function ShipmentTrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipment, setShipment] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'details'>('timeline');

  const shipmentId = route.params?.shipmentId || route.params?.id;

  const fetchShipmentDetails = useCallback(async (isRefreshing = false) => {
    if (!shipmentId) return;
    try {
      if (!isRefreshing) setLoading(true);
      const response = await shipmentApi.getById(shipmentId) as any;
      if (response.success && response.data?.shipment) {
        setShipment(response.data.shipment);
      }
    } catch (e) {
      console.error('[ShipmentTracking] Fetch Error:', e);
      Alert.alert('Error', 'Failed to fetch shipment details');
    } finally {
      if (!isRefreshing) setLoading(false);
      setRefreshing(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    fetchShipmentDetails();
  }, [fetchShipmentDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShipmentDetails(true);
  }, [fetchShipmentDetails]);

  const getStatusDisplay = (status: string) => {
    const statusMap: any = {
      pending: { label: 'Pending', icon: 'clock-outline', color: '#FFA000', desc: 'Awaiting rider assignment' },
      assigned: { label: 'Rider Assigned', icon: 'account-check-outline', color: '#2196F3', desc: 'Rider is on the way to pickup' },
      picked_up: { label: 'Picked Up', icon: 'package-variant', color: GREEN, desc: 'Package is collected' },
      in_transit: { label: 'In Transit', icon: 'truck-delivery-outline', color: '#673AB7', desc: 'Package is moving to destination' },
      arrived_at_hub: { label: 'At Hub', icon: 'warehouse', color: '#009688', desc: 'Processing at hub' },
      out_for_delivery: { label: 'Out for Delivery', icon: 'moped-outline', color: '#E91E63', desc: 'Arriving today' },
      delivered: { label: 'Delivered', icon: 'check-circle-outline', color: GREEN, desc: 'Successfully delivered' },
      cancelled: { label: 'Cancelled', icon: 'close-circle-outline', color: '#F44336', desc: 'Shipment cancelled' },
    };
    return statusMap[status] || { label: status, icon: 'package-variant', color: '#616161', desc: 'Processing shipment' };
  };

  const currentStatus = getStatusDisplay(shipment?.status);

  // Transform backend history into visual timeline
  const getTimeline = (): TimelineItem[] => {
    if (!shipment) return [];
    
    const history = shipment.tracking_history || [];
    const timeline = history.map((h: any) => {
      let title = '';
      let desc = '';
      
      switch(h.status) {
        case 'pending': title = 'Order Created'; desc = 'Shipment created by merchant'; break;
        case 'assigned': title = 'Rider Assigned'; desc = 'Rider assigned to pickup'; break;
        case 'picked_up': title = 'Picked Up'; desc = 'Package picked up from merchant'; break;
        case 'arrived_at_hub': title = 'Arrived at Hub'; desc = 'Package received at hub facility'; break;
        case 'dispatched_from_hub': title = 'Dispatched from Hub'; desc = 'Package dispatched for delivery'; break;
        case 'out_for_delivery': title = 'Out for Delivery'; desc = 'Package is on its way to recipient'; break;
        case 'delivered': title = 'Delivered'; desc = 'Package successfully delivered'; break;
        case 'cancelled': title = 'Cancelled'; desc = 'Shipment has been cancelled'; break;
        default: title = h.status.replace(/_/g, ' ').toUpperCase(); desc = h.notes || 'Status update';
      }

      return {
        title,
        desc,
        time: new Date(h.created_at).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        id: h.id.substring(0, 8).toUpperCase(),
        entity: h.notes || 'System Update',
        loc: h.location_address || 'CodExpress Network',
        isCompleted: true
      };
    });

    // If history is empty, add a default start point
    if (timeline.length === 0) {
      timeline.push({
        title: 'Order Created',
        desc: 'Shipment is being processed',
        time: new Date(shipment.created_at).toLocaleString(),
        id: shipment.merchant_id?.substring(0, 8).toUpperCase(),
        entity: 'Merchant',
        loc: shipment.pickup_address,
        isCompleted: true
      });
    }

    return timeline;
  };

  const timelineData = getTimeline();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!shipment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
        <Text style={styles.errorText}>No shipment found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Track Shipment</Text>
          <Text style={styles.headerSubtitle}>{shipment.tracking_number}</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ORANGE} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusInfoRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name={currentStatus.icon as any} size={24} color={currentStatus.color} />
            </View>
            <View>
              <Text style={styles.topStatusTitle}>{currentStatus.label}</Text>
              <Text style={styles.topStatusDesc}>{currentStatus.desc}</Text>
            </View>
          </View>
          
          <View style={styles.riderSubCard}>
            <View style={styles.avatar}>
               <Text style={styles.avatarText}>{shipment.rider?.full_name?.charAt(0) || 'A'}</Text>
            </View>
            <View>
              <Text style={styles.riderName}>{shipment.rider?.full_name || 'Awaiting Rider'}</Text>
              <Text style={styles.riderRole}>{shipment.rider ? 'Your delivery rider' : 'Not yet assigned'}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={styles.actionBox}
            onPress={() => navigation.navigate('ShipmentDetails', { shipmentId: shipment.id })}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="location" size={22} color="#2196F3" />
            </View>
            <Text style={styles.actionLabel}>Track Map</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBox}
            onPress={() => navigation.navigate('Chat', { 
              recipientName: shipment.rider?.full_name || 'Support', 
              recipientRole: shipment.rider ? 'Rider' : 'Support',
              recipientId: shipment.rider?.id,
              recipientPhone: shipment.rider?.phone,
              shipmentId: shipment.id
            })}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="chatbubble" size={22} color={GREEN} />
            </View>
            <Text style={styles.actionLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBox}
            onPress={() => {
              const phone = shipment.rider?.phone;
              if (phone) {
                Linking.openURL(`tel:${phone}`);
              } else if (!shipment.rider) {
                Alert.alert('Not Assigned', 'No rider has been assigned to this shipment yet.');
              } else {
                Alert.alert('Not Available', 'Rider contact number is not available.');
              }
            }}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="call" size={22} color={ORANGE} />
            </View>
            <Text style={styles.actionLabel}>Call Rider</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
            onPress={() => setActiveTab('timeline')}
          >
            <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>Timeline</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Content */}
        {activeTab === 'timeline' ? (
          <View style={styles.timelineList}>
            {timelineData.map((item: TimelineItem, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.leftLineBox}>
                   <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                   </View>
                   {index < timelineData.length - 1 && <View style={styles.verticalLine} />}
                </View>
                
                <View style={styles.timelineCard}>
                   <Text style={styles.timelineTitle}>{item.title}</Text>
                   <Text style={styles.timelineDesc}>{item.desc}</Text>
                   
                   <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                      <Text style={styles.timeText}>{item.time}</Text>
                   </View>

                   <View style={styles.infoBox}>
                      <View style={styles.infoLine}>
                         <Ionicons name="key-outline" size={14} color="#607D8B" />
                         <Text style={styles.infoKey}>Ref ID: <Text style={styles.infoValue}>{item.id}</Text></Text>
                      </View>
                      <Text style={styles.entityName}>{item.entity}</Text>
                      <View style={styles.infoLine}>
                         <Ionicons name="location-outline" size={14} color="#607D8B" />
                         <Text style={styles.locText} numberOfLines={1}>{item.loc}</Text>
                      </View>
                   </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.detailsContainer}>
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                 <MaterialCommunityIcons name="package-variant-closed" size={20} color={ORANGE} />
                 <Text style={styles.detailCardTitle}>Package Details</Text>
              </View>
              <View style={styles.detailContent}>
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyLabel}>Tracking Number</Text>
                  <Text style={styles.valueTextBold}>{shipment.tracking_number}</Text>
                </View>
                <View style={styles.cardDividerLight} />
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyLabel}>Type</Text>
                  <Text style={styles.valueTextBold}>{shipment.package_type || 'N/A'}</Text>
                </View>
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyLabel}>Weight</Text>
                  <Text style={styles.valueTextBold}>{shipment.package_weight || '0'} kg</Text>
                </View>
                <View style={styles.keyValueRow}>
                  <Text style={styles.keyLabel}>Delivery Fee</Text>
                  <Text style={[styles.valueTextBold, { color: GREEN }]}>Rs. {Number(shipment.delivery_fee || 0).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                 <Ionicons name="business" size={20} color={GREEN} />
                 <Text style={styles.detailCardTitle}>Merchant & Pickup</Text>
              </View>
              <View style={styles.detailContent}>
                 <Text style={styles.locNameBold}>{shipment.merchant?.business_name || shipment.merchant?.full_name}</Text>
                 <Text style={styles.locAddrText}>{shipment.pickup_address}</Text>
                 <Text style={styles.locPhoneText}>{shipment.merchant?.phone || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                 <Ionicons name="location" size={20} color="#F44336" />
                 <Text style={styles.detailCardTitle}>Recipient & Delivery</Text>
              </View>
              <View style={styles.detailContent}>
                 <Text style={styles.locNameBold}>{shipment.recipient_name}</Text>
                 <Text style={styles.locAddrText}>{shipment.delivery_address}</Text>
                 <Text style={styles.locPhoneText}>{shipment.recipient_phone}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_COLOR },
  flex1: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#999', marginTop: 10, marginBottom: 20 },
  retryBtn: { backgroundColor: ORANGE, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#FFF', fontWeight: 'bold' },
  header: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  backBtn: { padding: 8, marginRight: 10 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  content: { flex: 1 },
  statusCard: {
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  topStatusTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  topStatusDesc: { fontSize: 13, color: '#757575' },
  riderSubCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: ORANGE, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFF', fontWeight: 'bold' },
  riderName: { fontSize: 14, fontWeight: '700', color: '#333' },
  riderRole: { fontSize: 12, color: '#999' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, marginBottom: 24 },
  actionBox: { alignItems: 'center' },
  actionIconCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 15, 
    backgroundColor: '#EEF6FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#616161' },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#EEEEEE', 
    marginHorizontal: 16, 
    borderRadius: 12, 
    padding: 4, 
    marginBottom: 20 
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9E9E9E' },
  activeTabText: { color: '#333' },
  timelineList: { paddingHorizontal: 16, paddingBottom: 40 },
  timelineItem: { flexDirection: 'row' },
  leftLineBox: { alignItems: 'center', width: 40 },
  checkCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: GREEN, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  verticalLine: { width: 2, flex: 1, backgroundColor: GREEN, marginVertical: -5 },
  timelineCard: { 
    flex: 1, 
    backgroundColor: '#FFF', 
    marginBottom: 20, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  timelineTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  timelineDesc: { fontSize: 13, color: '#757575', marginBottom: 8 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timeText: { fontSize: 12, color: '#9E9E9E', marginLeft: 5 },
  infoBox: { backgroundColor: '#F9FAFC', borderRadius: 10, padding: 12 },
  infoLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoKey: { fontSize: 11, color: '#78909C', marginLeft: 6, fontWeight: '600' },
  infoValue: { color: '#333', fontWeight: 'bold' },
  entityName: { fontSize: 13, fontWeight: '600', color: '#455A64', marginLeft: 20, marginBottom: 4 },
  locText: { fontSize: 11, color: '#78909C', marginLeft: 6, flex: 1 },
  // Details Tab Styles
  detailsContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  detailCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  detailCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  detailCardTitle: { fontSize: 13, fontWeight: '700', color: '#607D8B', marginLeft: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailContent: { gap: 12 },
  keyValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  keyLabel: { fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  valueTextBold: { fontSize: 13, color: '#333', fontWeight: '700' },
  cardDividerLight: { height: 1, backgroundColor: '#F5F5F5', marginVertical: 4 },
  locNameBold: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  locAddrText: { fontSize: 13, color: '#757575', lineHeight: 18, marginBottom: 2 },
  locPhoneText: { fontSize: 13, color: '#757575', fontWeight: '500' },
});
