import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';
import { socketService } from '../../services/socket';

const ORANGE = '#F37022';
const GREEN = '#00C853';

export default function ShipmentDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [eta, setEta] = useState<string>('Calculating...');
  const [distance, setDistance] = useState<string>('...');

  const shipmentId = route.params?.shipmentId || route.params?.id;

  // Initial Fetch
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
        
        // If rider has a current location in DB, set it initially
        if (response.data.shipment.rider) {
            const { current_latitude, current_longitude } = response.data.shipment.rider;
            if (current_latitude && current_longitude) {
                setRiderLocation({
                    latitude: parseFloat(current_latitude),
                    longitude: parseFloat(current_longitude)
                });
            }
        }
      }
    } catch (e) {
      console.error('[LiveTracking] Fetch Error:', e);
      Alert.alert('Error', 'Failed to load shipment details');
    } finally {
      setLoading(false);
    }
  };

  // Socket Connection for Live Updates
  useEffect(() => {
    let socket: any;

    const connectSocket = async () => {
        socket = await socketService.connect();
        if (socket) {
            console.log('🔌 Connected to socket for tracking:', shipmentId);
            
            // Join the specific order room for reliable updates
            socket.emit('join_order', { orderId: shipmentId });

            // Listen for location updates
            socket.on('shipment:location-update', (data: any) => {
                if (data.shipmentId === shipmentId && data.location) {
                    console.log('📍 New Rider Location:', data.location);
                    const newLocation = {
                        latitude: data.location.lat,
                        longitude: data.location.lng
                    };
                    setRiderLocation(newLocation);
                    
                    // Animate map to new location
                    mapRef.current?.animateCamera({
                        center: newLocation,
                        zoom: 15
                    }, { duration: 1000 });
                }
            });

            // Listen for status updates
            socket.on('shipment:status-update', (data: any) => {
                if (data.shipmentId === shipmentId) {
                    // Refresh details to get full updated object if needed
                    fetchShipmentDetails(); 
                }
            });
        }
    };

    connectSocket();

    return () => {
        if (socket) {
            socket.off('shipment:location-update');
            socket.off('shipment:status-update');
        }
    };
  }, [shipmentId]);

  // Calculate Distance Helper
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Recalculate ETA and Distance
  useEffect(() => {
    if (!riderLocation || !shipment) return;

    let targetLat: number | null = null;
    let targetLng: number | null = null;
    
    // Determine target based on status
    if (['pending', 'assigned'].includes(shipment.status)) {
        // Going to pickup
        if (shipment.pickup_latitude && shipment.pickup_longitude) {
            targetLat = parseFloat(shipment.pickup_latitude);
            targetLng = parseFloat(shipment.pickup_longitude);
        }
    } else {
        // Going to delivery (or default)
        if (shipment.delivery_latitude && shipment.delivery_longitude) {
            targetLat = parseFloat(shipment.delivery_latitude);
            targetLng = parseFloat(shipment.delivery_longitude);
        }
    }

    if (targetLat && targetLng) {
        const dist = calculateDistance(riderLocation.latitude, riderLocation.longitude, targetLat, targetLng);
        setDistance(`${dist.toFixed(1)} km`);
        
        // Estimate ETA: Assuming 20km/h avg speed in city = 3 min per km + 5 min buffer
        // Or simplified: (dist / speed) * 60
        const speedKmph = 20; 
        const timeHours = dist / speedKmph;
        const timeMins = Math.ceil(timeHours * 60) + 5; // +5 mins for parking/handover
        
        if (timeMins > 60) {
            const h = Math.floor(timeMins / 60);
            const m = timeMins % 60;
            setEta(`${h} hr ${m} min`);
        } else {
            setEta(`${timeMins} min`);
        }

        // Auto Fit Map (Debounced slightly preferred but direct is ok for now)
        if (mapRef.current) {
            mapRef.current.fitToCoordinates([
                riderLocation,
                { latitude: targetLat, longitude: targetLng }
            ], {
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true
            });
        }
    }
  }, [riderLocation, shipment]);

  // Handle Calls
  const handleCall = (phone: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert('Info', 'Phone number not available');
  };

  // Open External Maps
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

  if (!shipment) return (
      <View style={styles.errorContainer}>
          <Text>Shipment not found</Text>
      </View>
  );

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Live Tracking</Text>
          <Text style={styles.headerSubTitle}>
            {shipment.tracking_number || shipment.trackingNumber || 'Tracking...'}
          </Text>
        </View>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
                latitude: riderLocation?.latitude || (shipment?.pickup_latitude ? parseFloat(shipment.pickup_latitude) : 33.6844),
                longitude: riderLocation?.longitude || (shipment?.pickup_longitude ? parseFloat(shipment.pickup_longitude) : 73.0479),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }}
        >
            {riderLocation && (
                <Marker 
                    coordinate={riderLocation}
                    title={shipment.rider?.full_name || "Rider"}
                    description="Current Location"
                >
                    <View style={styles.markerContainer}>
                        <View style={styles.markerCircle}>
                             <MaterialCommunityIcons name="bike" size={20} color="#FFF" />
                        </View>
                        <View style={styles.markerArrow} />
                    </View>
                </Marker>
            )}
            
            {/* Destination Marker */}
             {(
              (['pending', 'assigned'].includes(shipment.status) && shipment.pickup_latitude && shipment.pickup_longitude) ||
              (!['pending', 'assigned'].includes(shipment.status) && shipment.delivery_latitude && shipment.delivery_longitude)
             ) && (
                <Marker
                    coordinate={{
                        latitude: parseFloat(['pending', 'assigned'].includes(shipment.status) ? shipment.pickup_latitude : shipment.delivery_latitude),
                        longitude: parseFloat(['pending', 'assigned'].includes(shipment.status) ? shipment.pickup_longitude : shipment.delivery_longitude)
                    }}
                    title={['pending', 'assigned'].includes(shipment.status) ? "Pickup" : "Delivery"}
                    pinColor={GREEN}
                />
             )}
        </MapView>
        
        {/* Floating ETA Card */}
        <View style={styles.floatingEtaCard}>
          <View style={styles.etaRow1}>
            <View style={styles.etaIconCircle}>
              <Ionicons name="time" size={22} color="#FFF" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Estimated Delivery</Text>
              <Text style={styles.etaMainText}>{eta}</Text>
            </View>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.metaRow}>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Distance</Text>
              <Text style={styles.metaWeight}>{distance}</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.labelMuted}>Status</Text>
              <Text style={[styles.metaWeight, { color: GREEN }]}>
                {shipment.status === 'out_for_delivery' ? 'On the way' : shipment.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Details Panel */}
      <View style={[styles.detailsPanel, { paddingBottom: insets.bottom + 20 }]}>
        
        {/* Rider Info */}
        <View style={styles.riderInfoBox}>
          <View style={styles.avatarOrange}>
            <Text style={styles.avatarLabel}>
               {shipment.rider?.full_name?.charAt(0) || 'A'}
            </Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.boldDetailName}>{shipment.rider?.full_name || 'Finding Rider...'}</Text>
            <Text style={styles.subDetailText}>Your delivery rider</Text>
          </View>
          <View style={styles.sideEta}>
             <Text style={styles.sideEtaVal}>{eta}</Text>
             <Text style={styles.sideEtaLabel}>away</Text>
          </View>
        </View>

        {/* Address */}
        <View style={styles.locationSection}>
           <View style={styles.pinkCircle}>
              <Ionicons name="location" size={20} color="#F44336" />
           </View>
           <View style={styles.flex1}>
              <Text style={styles.locHeading}>Delivery Address</Text>
              <Text style={styles.locMain} numberOfLines={2}>
                {shipment.delivery_address || shipment.deliveryAddress || 'Address not available'}
              </Text>
              <Text style={styles.locOwner}>
                {shipment.recipient_name || shipment.recipientName || 'Customer'}
              </Text>
           </View>
        </View>

        {/* Action Buttons */}
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
                recipientName: shipment.rider?.full_name || 'Rider',
                recipientRole: 'Rider',
                recipientId: shipment.rider?.id,
                shipmentId: shipment.id
             })}
             disabled={!shipment.rider}
           >
              <Ionicons name="chatbubble" size={18} color="#FFF" />
              <Text style={styles.btnTextWhite}>Chat</Text>
           </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.grayBtn} 
          activeOpacity={0.7}
          onPress={() => handleCall(shipment.rider?.phone)}
          disabled={!shipment.rider}
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
  errorContainer: {
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
  mapContainer: {
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
    marginTop: -30, // Overlap map nicely
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
    alignItems: 'center',
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
  markerContainer: {
      alignItems: 'center',
  },
  markerCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2979FF',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#FFF',
  },
  markerArrow: {
      width: 0,
      height: 0,
      backgroundColor: 'transparent',
      borderStyle: 'solid',
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 10,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: '#2979FF',
      transform: [{ rotate: '180deg' }],
      marginTop: -2,
  }
});
