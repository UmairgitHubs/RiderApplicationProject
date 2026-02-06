// Delivery Confirmation Screen Component
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { riderApi } from '../../services/api'; 
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export default function DeliveryConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, order, scannedCode } = route.params || {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [notes, setNotes] = useState('');

  // Mutation for confirming delivery
  // Query for Dropoff Count (Hub Mode)
  const { data: activeOrdersData } = useQuery({
    queryKey: ['activeOrders'],
    queryFn: () => riderApi.getActiveOrders().then(res => res.data.orders || []),
    enabled: !!route.params?.isHubArrival 
  });

  const dropoffCount = activeOrdersData?.filter((o: any) => 
      o.status === 'picked_up' || o.status === 'in_transit' || o.shipment?.status === 'picked_up'
  ).length || 0;

  const deliveryMutation = useMutation({
    mutationFn: async () => {
       if (!orderId) throw new Error('Invalid Order ID');

       const payload = {
           shipmentId: orderId,
           scannedCode,
           paymentMethod,
           notes,
           // If COD is needed, we might need to confirm amount collected
           codAmount: order?.codAmount
       };
       const response = await riderApi.completeDelivery(payload);
       if (!response.success && response.error) {
         throw new Error(response.error.message || 'Failed to complete delivery');
       }
       return response.data;
    },
    onSuccess: () => {
        Alert.alert('Success', 'Delivery Completed Successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Reset stack to navigate back to the Urgent Routes screen
              navigation.reset({
                index: 0,
                routes: [{ 
                    name: 'RiderApp',
                    params: { 
                        screen: 'Route', 
                        params: { routeType: 'urgent' } 
                    }
                }],
              });
            }
          }
        ]);
        
        queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
    onError: (err: any) => {
        console.log("Delivery Error:", err);
        Alert.alert('Error', err.message || "Failed to complete delivery.");
    }
  });

  // Hub Dropoff Mutation
  const hubDropoffMutation = useMutation({
    mutationFn: async () => {
       const shipmentsToDrop = activeOrdersData?.filter((o: any) => 
           o.status === 'picked_up' || o.status === 'in_transit' || o.shipment?.status === 'picked_up'
       ) || [];
       
       if (shipmentsToDrop.length === 0) return;

       // Execute in parallel
       const promises = shipmentsToDrop.map((s: any) => riderApi.dropOffAtHub(s.id));
       const responses = await Promise.all(promises);
       
       const failed = responses.find(r => !r.success);
       if (failed) throw new Error(failed.error?.message || 'Failed to dropoff some items');
    },
    onSuccess: () => {
        Alert.alert('Success', 'Handover Confirmed!', [
            { 
                text: 'OK', 
                onPress: () => {
                   navigation.reset({
                       index: 0,
                       routes: [{ 
                           name: 'RiderApp',
                           params: { 
                               screen: 'Route', 
                               params: { routeType: 'urgent' } 
                           }
                       }],
                   });
                } 
            }
        ]);
        queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
    },
    onError: (e: any) => {
        Alert.alert('Error', e.message || 'Failed to update shipments status');
    }
  });

  // Hub Drop-off View
  if (route.params?.isHubArrival) {
     const hubDetails = route.params?.hubDetails || {};
     return (
        <View style={styles.container}>
            <View
                style={[styles.header, { backgroundColor: '#607D8B', paddingTop: insets.top + spacing.sm }]}
            >
             <TouchableOpacity
                onPress={() => navigation.goBack()}
             >
                <Ionicons name="arrow-back" size={24} color="#FFF" />
             </TouchableOpacity>
             <View style={{ marginLeft: spacing.md }}>
                 <Text style={styles.headerTitle}>Hub Arrival</Text>
                 <Text style={styles.headerSubtitle}>End of Route</Text>
             </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                 {/* Hub Details Card */}
                 <View style={styles.card}>
                    <Text style={styles.cardHeader}>Hub Details</Text>
                    <Text style={styles.locationName}>{hubDetails.name || 'Central Hub'}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={16} color={colors.textLight} />
                        <Text style={styles.locationText}>{hubDetails.address || 'Hub Address'}</Text>
                    </View>
                 </View>

                 {/* Handover Details */}
                 <View style={styles.card}>
                     <Text style={styles.cardHeader}>Handover Summary</Text>
                     
                     <View style={styles.amountRow}>
                         <Text style={styles.amountLabel}>Shipments to Dropoff</Text>
                         <Text style={[styles.amountValue, { color: '#607D8B' }]}>{dropoffCount}</Text>
                     </View>

                     <View style={styles.divider} />
                     
                     <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 10 }}>
                         <View style={{ backgroundColor: '#ECEFF1', padding: 8, borderRadius: 8 }}>
                             <Ionicons name="cube-outline" size={24} color="#607D8B" />
                         </View>
                         <Text style={{ flex: 1, color: '#455A64', fontSize: 13, lineHeight: 18 }}>
                             Please handover all {dropoffCount} collected packages to the Hub Manager.
                         </Text>
                     </View>
                 </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
                 <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: '#607D8B' }]}
                    onPress={() => {
                        Alert.alert(
                            'Confirm Handover', 
                            `Are you sure you have handed over ${dropoffCount} packages?`,
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Confirm & Finish', 
                                    onPress: () => {
                                        hubDropoffMutation.mutate();
                                    } 
                                }
                            ]
                        );
                    }}
                 >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirm Handover</Text>
                 </TouchableOpacity>
            </View>
        </View>
     );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Delivery Confirmation</Text>
            <Text style={styles.headerSubtitle}>Complete delivery details</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          {/* Success Banner */}
          <View style={styles.successCard}>
              <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={24} color="#FFF" />
              </View>
              <View>
                  <Text style={styles.successTitle}>QR Code Scanned</Text>
                  <Text style={styles.successSubtitle}>{scannedCode || 'Verified'}</Text>
              </View>
          </View>

          {/* Recipient Details */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}>Recipient Details</Text>
              <Text style={styles.locationName}>{order?.recipientName || 'Customer'}</Text>
              <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textLight} />
                  <Text style={styles.locationText}>{order?.deliveryAddress || 'Delivery Address'}</Text>
              </View>
          </View>

          {/* Payment Collection */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}>Payment Collection</Text>
              
              <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Total to Collect</Text>
                  <Text style={styles.amountValue}>USD {order?.codAmount || '0.00'}</Text>
              </View>

              <View style={styles.divider} />

              <Text style={[styles.cardHeader, { fontSize: 14, marginTop: spacing.md }]}>Payment Method</Text>
              <View style={styles.conditionRow}>
                  <TouchableOpacity 
                    style={[styles.conditionBtn, paymentMethod === 'Cash' && styles.conditionBtnActive]}
                    onPress={() => setPaymentMethod('Cash')}
                  >
                      {paymentMethod === 'Cash' && <View style={styles.checkIcon}><Ionicons name="checkmark" size={12} color="#000" /></View>}
                      <Ionicons name="cash-outline" size={20} color="#000" />
                      <Text style={[styles.conditionLabel, paymentMethod === 'Cash' && styles.conditionLabelActive]}>Cash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.conditionBtn, paymentMethod === 'Online' && styles.conditionBtnActive]}
                    onPress={() => setPaymentMethod('Online')}
                  >
                       {paymentMethod === 'Online' && <View style={styles.checkIcon}><Ionicons name="checkmark" size={12} color="#000" /></View>}
                      <Ionicons name="card-outline" size={20} color="#000" />
                      <Text style={[styles.conditionLabel, paymentMethod === 'Online' && styles.conditionLabelActive]}>Online</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => deliveryMutation.mutate()}
            disabled={deliveryMutation.isPending}
          >
              {deliveryMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
              ) : (
                  <>
                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Complete Delivery</Text>
                  </>
              )}
          </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
      backgroundColor: '#2196F3', // Blue for Delivery
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
  },
  headerTitle: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '600',
  },
  headerSubtitle: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
  },
  content: {
      padding: spacing.lg,
      paddingBottom: 100,
  },
  successCard: {
      backgroundColor: '#E3F2FD',
      borderColor: '#BBDEFB',
      borderWidth: 1,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
  },
  successIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#2196F3',
      justifyContent: 'center',
      alignItems: 'center',
  },
  successTitle: {
      color: '#0D47A1',
      fontSize: 14,
      fontWeight: '600',
  },
  successSubtitle: {
      color: '#2196F3',
      fontSize: 12,
      fontWeight: 'bold',
  },
  card: {
      backgroundColor: '#FFF',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
  },
  cardHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: spacing.sm,
  },
  backButton: { marginRight: spacing.md },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ECEFF1', justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: spacing.md },
  locationName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: spacing.xs,
  },
  locationRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
  },
  locationText: {
      color: '#757575',
      fontSize: 13,
      flex: 1,
      lineHeight: 18,
  },
  amountRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
  },
  amountLabel: {
      fontSize: 14,
      color: '#757575',
  },
  amountValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2196F3',
  },
  conditionRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
  },
  conditionBtn: {
      flex: 1,
      height: 60,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
      flexDirection: 'row',
  },
  conditionBtnActive: {
      borderColor: '#2196F3',
      backgroundColor: '#E3F2FD',
  },
  conditionLabel: {
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
  },
  conditionLabelActive: {
      color: '#2196F3',
      fontWeight: '600',
  },
  checkIcon: {
      position: 'absolute',
      top: 5,
      right: 5,
  },
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFF',
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: '#F0F0F0',
  },
  confirmButton: {
      backgroundColor: '#2196F3', // Blue for Delivery
      height: 56,
      borderRadius: 15,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      shadowColor: '#2196F3',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  confirmButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '600',
  }
});
