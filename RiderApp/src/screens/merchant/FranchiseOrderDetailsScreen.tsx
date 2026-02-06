import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shipmentApi } from '../../services/api';
import { colors, typography, spacing, borderRadius } from '../../theme';

// Theme Colors from design
const THEME = {
  headerOrange: '#F26E21',
  purple: '#8A2BE2',
  purpleLight: '#F3E5F5',
  bg: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#757575',
  success: '#E8F5E9',
  successText: '#4CAF50',
  btnLightOrange: '#FFF3E0',
  btnOrangeText: '#FF9800'
};

const { width } = Dimensions.get('window');

export default function FranchiseOrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { shipment } = (route.params as any) || {};

  // If shipment is passed directly, use it. Otherwise use route params if available.
  // Ideally, 'shipment' here represents the "Batch" object or a representative shipment.
  
  const orderId = shipment?.batchId || shipment?.trackingNumber || 'FR-BATCH-001';
  
  const [loading, setLoading] = useState(true);
  const [shipmentsList, setShipmentsList] = useState<any[]>([]);
  const [batchStats, setBatchStats] = useState({
      totalPrice: 0,
      totalItems: 0,
      status: 'Processing'
  });

  useEffect(() => {
    fetchBatchShipments();
  }, [orderId]);

  const fetchBatchShipments = async () => {
      try {
          if (!orderId) return;
          setLoading(true);
          const response = await shipmentApi.getAll({ batchId: orderId } as any) as any;
          
          if (response.success && response.data?.shipments) {
              const list = response.data.shipments;
              setShipmentsList(list);
              
              // Calculate stats
              const total = list.reduce((sum: number, item: any) => sum + (Number(item.deliveryFee) || 0), 0);
              const currentStatus = list.length > 0 ? list[0].status : 'pending';
              
              setBatchStats({
                  totalPrice: total,
                  totalItems: list.length || shipment?.packageCount || 0,
                  status: currentStatus
              });
          }
      } catch (error) {
          console.error("Failed to fetch batch shipments", error);
      } finally {
          setLoading(false);
      }
  };

  const getLogisticsInfo = () => {
      // Derive logistics info from the first shipment that has it
      const shipmentWithRider = shipmentsList.find(s => s.rider);
      const shipmentWithHub = shipmentsList.find(s => s.hub);

      return {
          hubAddress: shipmentWithHub?.hub?.address || 'Pending Hub Assignment',
          hubCity: shipmentWithHub?.hub?.city || 'Distribution Center',
          riderName: shipmentWithRider?.rider?.full_name || 'Waiting for Rider...',
          vehicleType: shipmentWithRider?.rider?.vehicle_type || '---',
          vehiclePlate: shipmentWithRider?.rider?.vehicle_number || '---'
      };
  };

  const logistics = getLogisticsInfo();

  // Helper for status badge
  const getStatusBadge = (status: string) => {
      const isDelivered = status === 'delivered';
      const isOut = status === 'in_transit' || status === 'out_for_delivery';
      
      return {
          bg: isDelivered ? '#E8F5E9' : isOut ? '#E3F2FD' : '#FFF3E0',
          color: isDelivered ? '#2E7D32' : isOut ? '#1976D2' : '#F57C00',
          label: status.replace('_', ' ').toUpperCase()
      };
  };

  const batchStatus = getStatusBadge(batchStats.status);

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      {/* Orange Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Franchise Bulk Order</Text>
                <Text style={styles.headerSubtitle}>Total {batchStats.totalItems} Orders</Text>
            </View>
            <View style={{ width: 40 }} /> 
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
          {/* Main Summary Card */}
          <View style={styles.mainCard}>
              <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                      <Ionicons name="business" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>Bulk Franchise Order</Text>
                      <Text style={styles.cardSubtitle}>Key handling Required</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: batchStatus.bg }]}>
                      <Text style={[styles.statusText, { color: batchStatus.color }]}>{batchStatus.label}</Text>
                  </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.batchInfoRow}>
                  <View>
                      <Text style={styles.batchLabel}>Batch Track ID</Text>
                      <Text style={styles.batchValue}>{orderId}</Text>
                  </View>
              </View>
              <Text style={styles.itemCount}>
                  {batchStats.totalItems} parcels • {batchStats.totalItems} different locations
              </Text>

              <View style={styles.infoBanner}>
                   <Ionicons name="time-outline" size={16} color="#E65100" />
                   <Text style={styles.infoBannerText}>
                       All orders currently out for delivery
                   </Text>
              </View>
          </View>

          {/* Active Orders List */}
          <Text style={styles.sectionTitle}>Active Orders (Tap to Track Individually)</Text>
          
          {loading ? (
              <ActivityIndicator size="large" color={THEME.headerOrange} style={{ marginVertical: 20 }} />
          ) : (
              <View style={styles.listContainer}>
                  {shipmentsList.map((item, index) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.orderItem}
                        onPress={() => (navigation as any).navigate('FranchiseTracking', { 
                            shipmentId: item.id, 
                            trackingNumber: item.trackingNumber 
                        })}
                      >
                          <View style={styles.orderIndexCircle}>
                              <Text style={styles.orderIndexText}>{index + 1}</Text>
                          </View>
                          
                          <View style={styles.orderInfo}>
                              <View style={styles.orderHeader}>
                                  <Text style={styles.recipientName}>{item.recipientName}</Text>
                                  {item.status === 'delivered' && (
                                       <Ionicons name="checkmark-done" size={16} color={THEME.purple} />
                                  )}
                              </View>
                              <Text style={styles.orderAddress} numberOfLines={1}>{item.deliveryAddress}</Text>
                              
                              <View style={styles.orderFooter}>
                                  <Text style={styles.orderPrice}>${(Number(item.deliveryFee) || 0).toFixed(2)}</Text>
                                  <View style={styles.trackBtn}>
                                      <Text style={styles.trackBtnText}>Track Delivery</Text>
                                  </View>
                              </View>
                          </View>
                      </TouchableOpacity>
                  ))}
                  
                  {shipmentsList.length === 0 && (
                      <Text style={styles.emptyText}>No shipments found for this batch.</Text>
                  )}
              </View>
          )}

          {/* Franchise Delivery Flow */}
          <View style={styles.sectionCard}>
              <Text style={styles.cardSectionTitle}>Franchise Delivery Flow</Text>
              
              <View style={styles.timeline}>
                  <View style={styles.timelineItem}>
                      <View style={[styles.timelineIcon, { backgroundColor: '#E8F5E9' }]}>
                          <Ionicons name="checkmark" size={14} color="#4CAF50" />
                      </View>
                      <View style={styles.timelineContent}>
                          <Text style={styles.timelineTitle}>1. Available for Pickup</Text>
                          <Text style={styles.timelineSubtitle}>{shipmentsList[0]?.merchant?.business_name || 'Store Location'}</Text>
                      </View>
                  </View>
                  <View style={styles.timelineLine} />
                  
                  <View style={styles.timelineItem}>
                      <View style={[styles.timelineIcon, { backgroundColor: ['picked_up', 'in_transit', 'delivered'].includes(batchStats.status) ? '#E8F5E9' : '#F5F5F5' }]}>
                          <Ionicons name="checkmark" size={14} color={['picked_up', 'in_transit', 'delivered'].includes(batchStats.status) ? "#4CAF50" : "#BDBDBD"} />
                      </View>
                      <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, { color: ['picked_up', 'in_transit', 'delivered'].includes(batchStats.status) ? THEME.text : '#9E9E9E' }]}>2. Picked Up by Rider</Text>
                          <Text style={styles.timelineSubtitle}>{logistics.riderName}</Text>
                      </View>
                  </View>
                  <View style={styles.timelineLine} />

                  <View style={styles.timelineItem}>
                       <View style={[styles.timelineIcon, { 
                           borderColor: ['in_transit', 'delivered'].includes(batchStats.status) ? '#FF9800' : '#E0E0E0', 
                           borderWidth: 2, 
                           backgroundColor: '#FFF' 
                        }]}>
                          <View style={{ 
                              width: 8, height: 8, borderRadius: 4, 
                              backgroundColor: ['in_transit', 'delivered'].includes(batchStats.status) ? '#FF9800' : 'transparent' 
                          }} />
                      </View>
                      <View style={styles.timelineContent}>
                          <Text style={[styles.timelineTitle, { color: ['in_transit', 'delivered'].includes(batchStats.status) ? THEME.text : '#9E9E9E' }]}>3. Out for Delivery</Text>
                          <Text style={styles.timelineSubtitle}>Distributed to delivery riders</Text>
                      </View>
                  </View>
              </View>
          </View>

          {/* Logistics Information */}
          <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Logistics Information</Text>
          </View>
          
          <View style={styles.logisticsCard}>
              <View style={styles.logisticsRow}>
                  <View>
                      <Text style={styles.logisticsLabel}>Hub Address</Text>
                      <Text style={styles.logisticsValue}>{logistics.hubAddress}</Text>
                      <Text style={styles.logisticsSub}>{logistics.hubCity}</Text>
                  </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.logisticsRow}>
                  <View>
                      <Text style={styles.logisticsLabel}>Vehicle Type</Text>
                      <Text style={styles.logisticsValue}>{logistics.vehicleType}</Text>
                      <Text style={styles.logisticsSub}>Plate: {logistics.vehiclePlate}</Text>
                  </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.logisticsRow}>
                   <View>
                      <Text style={styles.logisticsLabel}>Rider Name</Text>
                      <Text style={styles.logisticsValue}>{logistics.riderName}</Text>
                   </View>
              </View>
          </View>

          {/* Important Info Box */}
          <View style={styles.importantInfoBox}>
              <View style={styles.infoBoxHeader}>
                   <Ionicons name="information-circle-outline" size={20} color="#1976D2" />
                   <Text style={styles.infoBoxTitle}>Read me: Information</Text>
              </View>
              <Text style={styles.infoBoxText}>• This is a bulk order. It is split into {batchStats.totalItems} smaller tracking packets.</Text>
              <Text style={styles.infoBoxText}>• All tracks are real-time via handling partners.</Text>
              <Text style={styles.infoBoxText}>• See individual shipment tabs for specific proofs of delivery.</Text>
          </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: THEME.headerOrange,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 2,
  },
  content: {
    flex: 1,
    marginTop: -20, // Negative margin to overlap header
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  
  // Main Card
  mainCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: THEME.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
  },
  cardSubtitle: {
    fontSize: 12,
    color: THEME.purple,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  batchInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  batchLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  batchValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
  },
  itemCount: {
    fontSize: 13,
    color: THEME.textSecondary,
    marginBottom: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 12,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },

  // Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
      marginTop: 24,
      marginBottom: 8,
  },
  
  // Order List
  listContainer: {
    gap: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  orderIndexCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: THEME.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  orderIndexText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.text,
  },
  orderAddress: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.purple,
  },
  trackBtn: {
    backgroundColor: THEME.btnLightOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: THEME.btnOrangeText,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },

  // Section Card
  sectionCard: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 16,
  },
  
  // Timeline
  timeline: {
    marginLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginLeft: 9, // Center with icon (20/2 - 2/2)
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    marginTop: -2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: THEME.text,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: 2,
  },

  // Logistics Card
  logisticsCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  logisticsRow: {
    marginBottom: 4,
  },
  logisticsLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginBottom: 2,
  },
  logisticsValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 1,
  },
  logisticsSub: {
    fontSize: 11,
    color: '#9E9E9E',
  },

  // Important Info
  importantInfoBox: {
      backgroundColor: '#E3F2FD',
      borderRadius: 16,
      padding: 16,
      marginTop: 24,
  },
  infoBoxHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
  },
  infoBoxTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#1565C0',
  },
  infoBoxText: {
      fontSize: 12,
      color: '#1E88E5',
      marginBottom: 4,
      lineHeight: 18,
  },
});
