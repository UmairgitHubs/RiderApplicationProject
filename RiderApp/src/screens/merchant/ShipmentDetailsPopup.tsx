import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, borderRadius } from '../../theme';
import { shipmentApi } from '../../services/api';

/**
 * Senior Refactor - Phase 2: Compact & Visual Match
 * Focus: Scroll efficiency and 1:1 design match for the bottom segments.
 */

interface ShipmentDetailsPopupProps {
  visible: boolean;
  onClose: () => void;
  shipmentId: string | null;
  trackingId?: string | null;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShipmentDetailsPopup({ visible, onClose, shipmentId, trackingId }: ShipmentDetailsPopupProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (visible && (shipmentId || trackingId)) {
      fetchDetails();
    } else if (!visible) {
      setDetails(null);
      setError(null);
      setShowQR(false);
    }
  }, [visible, shipmentId, trackingId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      let response: any;
      if (shipmentId) {
         response = await shipmentApi.getById(shipmentId);
      } else if (trackingId) {
         response = await shipmentApi.track(trackingId);
      }
      
      if (response?.success && response?.data) {
        setDetails(response.data.shipment || response.data);
      } else {
        setError('Record not found');
      }
    } catch (err) {
      setError('Communication error');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop: Absolute fill to catch outside taps without wrapping content */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        
        {/* Surface: Clean View container to avoid touch conflicts with ScrollView */}
        <View style={styles.surface}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shipment Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#616161" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#F37022" />
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Ionicons name="alert-circle" size={40} color="#F44336" />
              <Text style={styles.errorMsg}>{error}</Text>
            </View>
          ) : details ? (
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.scrollContent}
              bounces={true}
              keyboardShouldPersistTaps="handled" 
            >
              <View style={styles.innerPadding}>
                {/* Tracking Number Card */}
                <View style={styles.trackingCard}>
                  <Text style={styles.labelSmall}>Tracking Number</Text>
                  <Text style={styles.trackingValue}>{details.tracking_number || details.trackingNumber || 'N/A'}</Text>
                  <View style={styles.accentDash} />
                </View>

                {/* Rider Status */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ASSIGNED RIDER</Text>
                </View>
                <View style={styles.riderBox}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color="#2196F3" />
                  </View>
                  <View>
                    <Text style={styles.boldText}>
                      {details.rider?.full_name || details.rider?.fullName || 'Pending Assignment'}
                    </Text>
                    <Text style={styles.subtext}>
                      {details.rider ? `ID: RID-${details.rider.id.slice(0, 4).toUpperCase()}` : 'Waiting for system...'}
                    </Text>
                  </View>
                </View>

                {/* Receiver Info */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>RECEIVER</Text>
                </View>
                <InfoRow icon="person" label="Name" value={details.recipient_name || details.recipientName} />
                <View style={{ height: 12 }} />
                <InfoRow icon="call" label="Phone" value={details.recipient_phone || details.recipientPhone} />
                <View style={{ height: 12 }} />
                <InfoRow icon="location" label="Delivery Address" value={details.delivery_address || details.deliveryAddress} />

                {/* Package Specifications */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>PACKAGE INFO</Text>
                </View>
                <View style={styles.grid}>
                   <View style={styles.gridItem}>
                      <Text style={styles.labelSmall}>Type</Text>
                      <Text style={styles.boldTextSmall}>{details.package_type || details.packageType || 'Package'}</Text>
                   </View>
                   <View style={styles.gridItem}>
                      <Text style={styles.labelSmall}>Weight</Text>
                      <Text style={styles.boldTextSmall}>
                        {details.package_weight || details.packageWeight ? `${details.package_weight || details.packageWeight} kg` : 'N/A'}
                      </Text>
                   </View>
                </View>
                <View style={styles.timeRow}>
                   <Ionicons name="time-outline" size={14} color="#757575" />
                   <Text style={[styles.subtext, { marginLeft: 4 }]}>
                      Created: {new Date(details.created_at || details.createdAt).toLocaleDateString()}
                   </Text>
                </View>

                {/* INSTRUCTIONS (Exact Match) */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
                </View>
                <View style={styles.instrBox}>
                  <Text style={styles.instrText}>
                    {details.special_instructions || details.specialInstructions || 'Fragile - Handle with care'}
                  </Text>
                </View>

                {/* Pricing Summary (Exact Match) */}
                <View style={styles.priceBox}>
                   <View>
                      <Text style={styles.priceLabel}>Total Price</Text>
                      <View style={styles.paidTag}>
                        <Text style={styles.paidLabel}>Paid</Text>
                      </View>
                   </View>
                   <Text style={styles.priceNum}>
                     Rs. {(Number(details.delivery_fee || details.deliveryFee || 0) + Number(details.cod_amount || details.codAmount || 0)).toFixed(2)}
                   </Text>
                </View>

                {/* QR Access */}
                 <TouchableOpacity style={styles.qrBtn} activeOpacity={0.8} onPress={() => setShowQR(true)}>
                    <Ionicons name="qr-code-outline" size={20} color="#F37022" />
                    <Text style={styles.qrText}>View QR Code</Text>
                 </TouchableOpacity>
              </View>
            </ScrollView>
          ) : null}
        </View>

        {/* QR Code Modal Overlay */}
        <Modal
          visible={showQR}
          transparent
          animationType="fade"
          onRequestClose={() => setShowQR(false)}
        >
          <View style={styles.qrOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setShowQR(false)} 
            />
            <View style={styles.qrSurface}>
              <Text style={styles.qrTitle}>Shipment QR Code</Text>
              <Text style={styles.qrSub}>{details?.tracking_number || details?.trackingNumber}</Text>
              
              <View style={styles.qrContainer}>
                {details && (
                  <QRCode
                    value={details.tracking_number || details.trackingNumber}
                    size={200}
                    color="#000"
                    backgroundColor="#fff"
                  />
                )}
              </View>

              <TouchableOpacity 
                style={styles.qrCloseBtn} 
                onPress={() => setShowQR(false)}
              >
                <Text style={styles.qrCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const InfoRow = ({ icon, label, value }: any) => (
  <View style={styles.row}>
    <View style={styles.iconCircle}>
       <Ionicons name={icon} size={16} color="#F37022" />
    </View>
    <View style={{ flex: 1 }}>
       <Text style={styles.labelSmall}>{label}</Text>
       <Text style={styles.rowVal}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  surface: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: '100%',
  },
  innerPadding: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeBtn: {
    width: 32,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stateContainer: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMsg: { marginTop: 10, color: '#666' },
  
  // -- Cards --
  trackingCard: {
    backgroundColor: '#FFF8F4',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFEFE5',
    marginBottom: 20,
  },
  labelSmall: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  trackingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  accentDash: {
    width: 24,
    height: 4,
    backgroundColor: '#F37022',
    borderRadius: 2,
    marginTop: 10,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  riderBox: {
    backgroundColor: '#F1F8FF',
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  boldText: { fontSize: 15, fontWeight: '700', color: '#333' },
  boldTextSmall: { fontSize: 14, fontWeight: '700', color: '#333' },
  subtext: { fontSize: 12, color: '#757575' },
  
  // -- Info Rows --
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rowVal: { fontSize: 14, fontWeight: '500', color: '#444' },

  // -- Package --
  grid: { flexDirection: 'row', gap: 12 },
  gridItem: {
    flex: 1,
    backgroundColor: '#F7F8F9',
    padding: 14,
    borderRadius: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  // -- INSTRUCTIONS --
  instrBox: {
    backgroundColor: '#FFFDE7',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFF59D',
    marginBottom: 20,
  },
  instrText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },

  // -- PRICE --
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  priceLabel: { fontSize: 14, fontWeight: '600', color: '#2E7D32', marginBottom: 4 },
  paidTag: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  paidLabel: { fontSize: 10, fontWeight: '700', color: '#2E7D32' },
  priceNum: { fontSize: 24, fontWeight: '700', color: '#1B5E20' },

  // -- ACTION --
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF8F2',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  qrText: { fontSize: 16, fontWeight: '700', color: '#F37022' },
  
  // -- QR Modal Styles --
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrSurface: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  qrSub: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 24,
  },
  qrCloseBtn: {
    width: '100%',
    backgroundColor: '#F37022',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
