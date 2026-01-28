import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Linking, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../theme';

const { width, height } = Dimensions.get('window');
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export default function NavigationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const { 
    type = 'Pickup', 
    address, 
    latitude, 
    longitude,
    recipientName,
    trackingId,
    orderId,
    order,
    phone
  } = (route.params as any) || {};

  // Destination State (Dynamic resolution)
  const [destCoords, setDestCoords] = useState({
      latitude: Number(latitude) || 0,
      longitude: Number(longitude) || 0
  });

  const hasValidDest = destCoords.latitude !== 0 && destCoords.longitude !== 0;

  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [userHeading, setUserHeading] = useState(0); 
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [routeSteps, setRouteSteps] = useState<any[]>([]); 
  const [currentStep, setCurrentStep] = useState<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [navState, setNavState] = useState<'idle' | 'active' | 'paused'>('idle');
  
  const [tripStats, setTripStats] = useState({
      duration: '-- min',
      distance: '-- km',
      arrivalTime: '--:--'
  });
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // 1. Resolve Address if Coords Missing (Self-Healing)
  useEffect(() => {
      if (!hasValidDest && address) {
          (async () => {
              try {
                  const geocoded = await Location.geocodeAsync(address);
                  if (geocoded && geocoded.length > 0) {
                      setDestCoords({
                          latitude: geocoded[0].latitude,
                          longitude: geocoded[0].longitude
                      });
                  }
              } catch (e) {
                  console.error("Geocoding failed", e);
              }
          })();
      }
  }, [address, hasValidDest]);

  // 2. Tracking Logic
  useEffect(() => {
    let subscription: Location.LocationSubscription;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for navigation.');
        return;
      }

      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation(initialLoc.coords);
      setUserHeading(initialLoc.coords.heading || 0);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, 
          distanceInterval: 10 
        },
        (newLoc) => {
          const { latitude, longitude, heading } = newLoc.coords;
          setUserLocation(newLoc.coords);
          setUserHeading(heading || 0);
          
          if (navState === 'active' && hasValidDest) {
             mapRef.current?.animateCamera({
                 center: { latitude, longitude },
                 pitch: 60,
                 heading: heading || 0,
                 zoom: 18,
             }, { duration: 1000 });

             const dist = Math.sqrt(
                 Math.pow(latitude - lastUpdatePos.current.latitude, 2) + 
                 Math.pow(longitude - lastUpdatePos.current.longitude, 2)
             );
             
             if (dist > 0.0005 || lastUpdatePos.current.latitude === 0) {
                 updateRouteDetails(latitude, longitude);
                 lastUpdatePos.current = { latitude, longitude };
             }
          }
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) subscription.remove();
    };
  }, [navState, hasValidDest]);

  const updateRouteDetails = async (startLat: number, startLng: number) => {
      if (!GOOGLE_API_KEY || !hasValidDest) return;

      try {
          const mode = 'driving';
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${destCoords.latitude},${destCoords.longitude}&key=${GOOGLE_API_KEY}&mode=${mode}`;
          
          const resp = await fetch(url);
          const data = await resp.json();

          if (data.status === 'OK' && data.routes && data.routes.length > 0) {
              const routeData = data.routes[0];
              const points = decodePolyline(routeData.overview_polyline.points);
              setRouteCoords(points);
              
              if (routeData.legs && routeData.legs.length > 0) {
                  const leg = routeData.legs[0];
                  
                  if (leg.steps) {
                      setRouteSteps(leg.steps);
                      setCurrentStep(leg.steps[0]);
                  }

                  const durationSecs = leg.duration.value;
                  const arrivalDate = new Date(Date.now() + durationSecs * 1000);
                  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  setTripStats({
                      duration: leg.duration.text,
                      distance: leg.distance.text,
                      arrivalTime: arrivalTimeStr
                  });
              }
          }
      } catch (error) {
          console.error("Route Fetch Error", error);
      }
  };

  const lastUpdatePos = useRef({ latitude: 0, longitude: 0 });

  useEffect(() => {
    if (userLocation && hasValidDest && routeCoords.length === 0) {
        setIsLoadingRoute(true);
        updateRouteDetails(userLocation.latitude, userLocation.longitude)
           .finally(() => setIsLoadingRoute(false));
    }
  }, [userLocation, hasValidDest]);

  useEffect(() => {
    if (isMapReady && userLocation && hasValidDest) {
        if (navState === 'active') {
             // Handled in watcher
        } else if (navState !== 'paused') {
            mapRef.current?.fitToCoordinates([
                { latitude: userLocation.latitude, longitude: userLocation.longitude },
                { latitude: destCoords.latitude, longitude: destCoords.longitude }
            ], {
                edgePadding: { top: 120, right: 50, bottom: 420, left: 50 },
                animated: true
            });
        }
    }
  }, [navState, isMapReady, hasValidDest, routeCoords.length]);

  const decodePolyline = (t: string) => {
    let points = [];
    let index = 0, len = t.length;
    let lat = 0, lng = 0;
    while (index < len) {
        let b, shift = 0, result = 0;
        do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += dlat; shift = 0; result = 0;
        do { b = t.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += dlng;
        points.push({ latitude: (lat / 1E5), longitude: (lng / 1E5) });
    }
    return points;
  };

  const handleStartNavigation = () => {
    if (navState === 'active') {
        setNavState('paused');
        if(mapRef.current && userLocation) {
             mapRef.current.animateCamera({ pitch: 0, heading: 0, zoom: 15 }, { duration: 500 });
        }
    } else {
        setNavState('active');
        if (userLocation) {
            updateRouteDetails(userLocation.latitude, userLocation.longitude);
        }
    }
  };

  const handleMarkAsReached = () => {
    navigation.navigate('QRScanner', {
      orderId: order?.id || orderId,
      order: order,
      scanType: type === 'Pickup' ? 'pickup' : 'delivery'
    });
  };

  const handleExternalMaps = () => {
    if (!hasValidDest) return;
    const query = `${destCoords.latitude},${destCoords.longitude}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `google.navigation:q=${query}`,
    });
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}&dir_action=navigate`;
    
    Linking.canOpenURL(url || '').then(supported => {
        if (supported) Linking.openURL(url || '');
        else Linking.openURL(googleUrl);
    }).catch(() => Linking.openURL(googleUrl));
  };

  const handleCall = () => {
    if (!phone) {
        Alert.alert('No Number', 'Phone number not available for this contact.');
        return;
    }
    const telUrl = `tel:${phone}`;
    Linking.canOpenURL(telUrl).then(supported => {
        if (supported) Linking.openURL(telUrl);
        else Alert.alert('Error', 'Unable to open phone dialer.');
    });
  };

  const getCleanInstruction = () => {
      if (!currentStep) return "Head to destination";
      return currentStep.html_instructions.replace(/<[^>]*>?/gm, '');
  };

  // Theme Colors
  const themeColor = type === 'Pickup' ? '#FF6B00' : '#2962FF';

  if (!hasValidDest) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 20, color: colors.text }}>Resolving destination...</Text>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, padding: 10 }}>
                  <Text style={{ color: 'blue' }}>Cancel</Text>
              </TouchableOpacity>
          </View>
      )
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
            latitude: destCoords.latitude,
            longitude: destCoords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setIsMapReady(true)}
        customMapStyle={mapStyle}
      >
          {routeCoords.length > 0 && (
              <Polyline 
                coordinates={routeCoords} 
                strokeColor={themeColor} // Match polyline to theme
                strokeWidth={7} 
                lineCap="round"
                lineJoin="round"
              />
          )}

          <Marker coordinate={{ latitude: destCoords.latitude, longitude: destCoords.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.destMarkerContainer}>
                 <View style={[styles.destMarkerCircle, { backgroundColor: themeColor }]}>
                     <Ionicons name={type === 'Pickup' ? "cube" : "location"} size={14} color="#FFF" />
                 </View>
                 <View style={[styles.destMarkerArrow, { borderTopColor: themeColor }]} />
              </View>
          </Marker>
      </MapView>

      {/* --- ACTIVE NAVIGATION HEADER --- */}
      {navState === 'active' && (
      <View style={[styles.navHeaderContainer, { top: insets.top + (Platform.OS === 'android' ? 10 : 0) }]} pointerEvents="box-none">
          <View style={[styles.turnCard, { backgroundColor: themeColor }]}>
             <View style={styles.turnIconBg}>
                <Ionicons name="arrow-up" size={32} color="#FFF" />
             </View>
             <View style={styles.turnContent}>
                 <Text style={styles.turnInstruction} numberOfLines={2}>{getCleanInstruction()}</Text>
                 <Text style={styles.turnDistance}>{currentStep?.distance?.text || '0 m'}</Text>
             </View>
          </View>
      </View>
      )}

      {/* --- OVERVIEW HEADER --- */}
      {navState !== 'active' && (
      <View style={[styles.headerContainer, { top: 0 }]} pointerEvents="box-none">
          <View style={[styles.topBar, { backgroundColor: themeColor, paddingTop: insets.top + spacing.sm }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                  <Text style={styles.topBarTitle}>Navigate to {type}</Text>
                  <Text style={styles.topBarSubtitle}>{trackingId || 'Order #...'}</Text>
              </View>
          </View>
      </View>
      )}

      {/* --- FLOATING CARD --- */}
      {navState !== 'active' && (
      <View style={[styles.floatingCardWrapper, { top: insets.top + 80 }]} pointerEvents="box-none">
          <View style={styles.floatingCard}>
              <View style={styles.timerRow}>
                  <View style={[styles.timerIconCircle, { backgroundColor: themeColor }]}>
                      <Ionicons name="time" size={24} color="#FFF" />
                  </View>
                  <View>
                      <Text style={styles.timerLabel}>Estimated Time</Text>
                      {isLoadingRoute ? <ActivityIndicator size="small" color="#0F172A" /> : <Text style={styles.timerValue}>{tripStats.duration}</Text>}
                  </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                      <Text style={styles.timerLabel}>Distance</Text>
                      <Text style={styles.statValue}>{tripStats.distance}</Text>
                  </View>
                  <View style={styles.statItem}>
                      <Text style={styles.timerLabel}>Arrival</Text>
                      <Text style={styles.statValue}>{tripStats.arrivalTime}</Text>
                  </View>
              </View>
          </View>
      </View>
      )}

      {/* --- BOTTOM SHEET --- */}
      <View style={styles.bottomSheetWrapper} pointerEvents="box-none">
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              {navState === 'active' && (
                  <View style={styles.activeFooter}>
                      <View>
                          <Text style={[styles.activeFooterTime, { color: themeColor }]}>{tripStats.duration}</Text>
                          <Text style={styles.activeFooterDetails}>{tripStats.distance} • {tripStats.arrivalTime} arrival</Text>
                      </View>
                      <TouchableOpacity style={styles.exitNavBtn} onPress={handleStartNavigation} activeOpacity={0.7}>
                          <Ionicons name="close" size={24} color="#EF4444" />
                          <Text style={styles.exitNavText}>Exit</Text>
                      </TouchableOpacity>
                  </View>
              )}

              {navState !== 'active' && (
              <View style={styles.addressRow}>
                  <View style={styles.addressIconCircle}>
                      <Ionicons name="location-outline" size={24} color={themeColor} />
                  </View>
                  <View style={styles.addressTextContainer}>
                      <Text style={styles.addressTitle}>{type === 'Pickup' ? 'Pick up package' : 'Deliver package'}</Text>
                      <Text style={styles.addressSubtitle} numberOfLines={2}>{address || 'Loading...'}</Text>
                  </View>
              </View>
              )}

              <View style={styles.actionButtonRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCall} activeOpacity={0.7}>
                      <Ionicons name="call" size={20} color="#FFF" />
                      <Text style={styles.actionBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { flex: 1, height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, backgroundColor: themeColor }]} onPress={handleExternalMaps} activeOpacity={0.7}>
                      <Ionicons name="navigate-outline" size={20} color="#FFF" />
                      <Text style={styles.actionBtnText}>Google Maps</Text>
                  </TouchableOpacity>
              </View>
             
              {navState !== 'active' && (
              <View style={styles.mainActionsContainer}>
                  <TouchableOpacity style={[styles.mainStartBtn, { backgroundColor: '#0F172A' }]} onPress={handleStartNavigation} activeOpacity={0.8}>
                      <Ionicons name="navigate-circle" size={24} color="#FFF" />
                      <Text style={styles.mainStartBtnText}>Start Navigation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mainStartBtn, { backgroundColor: themeColor }]} 
                    onPress={handleMarkAsReached}
                    activeOpacity={0.8}
                  >
                      <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                      <Text style={styles.mainStartBtnText}>Mark as {type === 'Pickup' ? 'Reached Pickup' : 'Reached Delivery'}</Text>
                  </TouchableOpacity>
              </View>
              )}
          </View>
      </View>
    </View>
  );
}

const mapStyle = [
  { "featureType": "poi", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.business", "stylers": [{ "visibility": "off" }] }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  map: { ...StyleSheet.absoluteFillObject },
  
  headerContainer: { position: 'absolute', top: 0, width: '100%', zIndex: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingBottom: spacing.lg },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  topBarTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  topBarSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  navHeaderContainer: { position: 'absolute', width: '100%', zIndex: 30, alignItems: 'center' },
  turnCard: { width: '92%', backgroundColor: '#2962FF', borderRadius: 18, padding: spacing.md, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: {width:0, height:6}, shadowOpacity:0.2, shadowRadius:12, elevation:8 },
  turnIconBg: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  turnContent: { flex: 1 },
  turnInstruction: { color: '#FFF', fontSize: 19, fontWeight: '800', marginBottom: 2 },
  turnDistance: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },

  floatingCardWrapper: { position: 'absolute', width: '100%', alignItems: 'center', zIndex: 10 },
  floatingCard: { width: width * 0.92, backgroundColor: '#FFF', borderRadius: 24, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 8 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  timerIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  timerLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  timerValue: { color: '#0F172A', fontSize: 24, fontWeight: 'bold' },
  cardDivider: { height: 1.5, backgroundColor: '#F1F5F9', marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1 },
  statValue: { color: '#0F172A', fontSize: 18, fontWeight: '700' },

  bottomSheetWrapper: { position: 'absolute', bottom: 0, width: '100%', zIndex: 20 },
  bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 12 },
  
  activeFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  activeFooterTime: { fontSize: 28, fontWeight: '800', color: '#00C853' },
  activeFooterDetails: { fontSize: 15, color: '#64748B', marginTop: 4, fontWeight: '500' },
  exitNavBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 28 },
  exitNavText: { color: '#EF4444', fontWeight: '800', marginLeft: 6, fontSize: 15 },

  addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  addressIconCircle: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: spacing.md, borderWidth: 1, borderColor: '#F1F5F9' },
  addressTextContainer: { flex: 1 },
  addressTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  addressSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, fontWeight: '500' },
  actionButtonRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: { flex: 1, height: 54, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  callBtn: { backgroundColor: '#00C853' },
  mapBtn: { backgroundColor: '#2962FF' },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  
  mainActionsContainer: { gap: spacing.md },
  mainStartBtn: { width: '100%', height: 60, backgroundColor: '#0F172A', borderRadius: 20, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  reachedBtn: { backgroundColor: '#059669' }, 
  mainStartBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  destMarkerContainer: { alignItems: 'center', justifyContent: 'center' },
  destMarkerCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF' },
  destMarkerArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', transform: [{ translateY: -1 }] },
});
