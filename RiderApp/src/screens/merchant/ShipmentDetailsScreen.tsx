import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Live Tracking Screen - Pixel Perfect Design Match
 * Refined for exact UI/UX alignment with the provided screenshot.
 * Optimised for all screen sizes with flexible layout and dynamic content.
 */

const ORANGE = '#F37022';
const GREEN = '#00C853';
const LIGHT_BLUE_BOX = '#F3F6FF';
const MAP_ACCENT = '#1A73E8';

export default function ShipmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);

  const shipmentId = route.params?.shipmentId || route.params?.id;

  useEffect(() => {
    fetchShipmentDetails();
  }, [shipmentId]);

  const fetchShipmentDetails = async () => {
    if (!shipmentId) return;
    try {
      setLoading(true);
      const response = await shipmentApi.getById(shipmentId) as any;
      if (response.success && response.data?.shipment) {
        setShipment(response.data.shipment);
      }
    } catch (e) {
      console.error('[LiveTracking] Fetch Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert('Info', 'Phone number not available');
  };

  const handleOpenMaps = () => {
    const address = shipment?.delivery_address || shipment?.deliveryAddress;
    if (address) {
       const url = Platform.select({
         ios: `maps://app?q=${encodeURIComponent(address)}`,
         android: `geo:0,0?q=${encodeURIComponent(address)}`,
         default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
       });
       Linking.openURL(url!).catch(() => Alert.alert('Error', 'Could not open maps'));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!shipment) return null;

  return (
    <View style={styles.container}>
      {/* Orange Header Container */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <Text style={styles.headerSubTitle}>
            {shipment.tracking_number || shipment.trackingNumber || 'CE2024001234567'}
          </Text>
        </View>
      </View>

      {/* Map Simulation Area */}
      <View style={styles.mapArea}>
        <LinearGradient 
          colors={['#E1F5FE', '#FFFFFF']} 
          style={StyleSheet.absoluteFill} 
        />
        
        {/* Floating Eta Card */}
        <View style={styles.floatingEtaCard}>
          <View style={styles.etaRow1}>
            <View style={styles.etaIconCircle}>
              <Ionicons name="time" size={22} color="#FFF" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Estimated Delivery</Text>
              <Text style={styles.etaMainText}>17 min</Text>
            </View>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.metaRow}>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Distance</Text>
              <Text style={styles.metaWeight}>2.3 km</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Status</Text>
              <Text style={[styles.metaWeight, { color: GREEN }]}>On the way</Text>
            </View>
          </View>
        </View>

        {/* Simulated path line */}
        <View style={styles.mapPath} />

        {/* Rider marker mockup */}
        <View style={[styles.riderMarkerWrapper, { top: '50%', right: '25%' }]}>
           <View style={styles.riderNameBadge}>
              <Text style={styles.riderNameBadgeText}>
                 {shipment.rider?.full_name?.split(' ')[0] || 'Alex Rider'}
              </Text>
           </View>
           <View style={styles.navMarkerCircle}>
             <MaterialCommunityIcons name="navigation-variant" size={20} color="#FFF" style={{ transform: [{rotate: '45deg'}] }} />
           </View>
        </View>
      </View>

      {/* Action Details Panel */}
      <View style={[styles.detailsPanel, { paddingBottom: insets.bottom + 20 }]}>
        
        {/* User Card */}
        <View style={styles.riderInfoBox}>
          <View style={styles.avatarOrange}>
            <Text style={styles.avatarLabel}>
               {shipment.rider?.full_name?.charAt(0) || 'A'}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.boldDetailName}>{shipment.rider?.full_name || 'Alex Rider'}</Text>
            <Text style={styles.subDetailText}>Your delivery rider</Text>
          </View>
          <View style={styles.sideEta}>
             <Text style={styles.sideEtaVal}>17 min</Text>
             <Text style={styles.sideEtaLabel}>away</Text>
          </View>
        </View>

        {/* Address Row */}
        <View style={styles.locationSection}>
           <View style={styles.pinkCircle}>
              <Ionicons name="location" size={20} color="#F44336" />
           </View>
           <View style={styles.flex1}>
              <Text style={styles.locHeading}>Delivery Address</Text>
              <Text style={styles.locMain}>{shipment.delivery_address || shipment.deliveryAddress || '456 Park Ave, Brooklyn, NY 11201'}</Text>
              <Text style={styles.locOwner}>{shipment.recipient_name || shipment.recipientName || 'Sarah Johnson'}</Text>
           </View>
        </View>

        {/* Multi-Buttons */}
        <View style={styles.btnPair}>
           <TouchableOpacity 
             style={[styles.baseBtn, { backgroundColor: GREEN }]} 
             activeOpacity={0.8}
             onPress={() => handleCall(shipment.recipient_phone || shipment.recipientPhone)}
           >
              <Ionicons name="call" size={18} color="#FFF" />
              <Text style={styles.btnTextWhite}>Call Customer</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={[styles.baseBtn, { backgroundColor: '#2979FF' }]} 
             activeOpacity={0.8}
             onPress={() => navigation.navigate('Chat', {
                recipientName: shipment.rider?.full_name || 'Alex Rider',
                recipientRole: 'Rider',
                shipmentId: shipment.id
             })}
           >
              <Ionicons name="chatbubble" size={18} color="#FFF" />
              <Text style={styles.btnTextWhite}>Chat</Text>
           </TouchableOpacity>
        </View>

        {/* Secondary Buttons */}
        <TouchableOpacity 
          style={styles.grayBtn} 
          activeOpacity={0.7}
          onPress={() => handleCall(shipment.rider?.phone)}
        >
           <Ionicons name="call-outline" size={18} color="#455A64" />
           <Text style={styles.btnTextGray}>Call Rider</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.orangeBtn} 
          activeOpacity={0.8}
          onPress={handleOpenMaps}
        >
           <MaterialCommunityIcons name="near-me" size={20} color="#FFF" />
           <Text style={styles.btnTextWhite}>Open in Google Maps</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubTitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#F0F3F6',
  },
  floatingEtaCard: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  etaRow1: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  etaMainText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
  },
  labelMuted: {
    fontSize: 11,
    color: '#9E9E9E',
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F7F7F7',
    marginVertical: 15,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaWeight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  flex1: { flex: 1 },
  mapPath: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '25%',
    width: 2,
    borderColor: '#1976D2',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.3,
  },
  riderMarkerWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  riderNameBadge: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 5,
  },
  riderNameBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  navMarkerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2979FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  detailsPanel: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 20,
  },
  riderInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8FF',
    padding: 16,
    borderRadius: 22,
    marginBottom: 24,
  },
  avatarOrange: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F37022',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarLabel: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  boldDetailName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  subDetailText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  sideEta: {
    alignItems: 'flex-end',
  },
  sideEtaVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GREEN,
  },
  sideEtaLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    fontWeight: '600',
  },
  locationSection: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  pinkCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  locHeading: {
    fontSize: 14,
    color: '#616161',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locMain: {
    fontSize: 14,
    color: '#212121',
    fontWeight: '600',
    lineHeight: 18,
  },
  locOwner: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
    fontWeight: '500',
  },
  btnPair: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  baseBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnTextWhite: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  grayBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  btnTextGray: {
    color: '#455A64',
    fontSize: 15,
    fontWeight: 'bold',
  },
  orangeBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: ORANGE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
