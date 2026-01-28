import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { riderApi } from '../../services/api'; 
import { useMutation, useQueryClient } from '@tanstack/react-query';

const { width } = Dimensions.get('window');

export default function DeliveryConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, order, scannedCode } = route.params || {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');

  // Mutation for confirming delivery
  const deliveryMutation = useMutation({
    mutationFn: async () => {
       // Assuming specific delivery confirmation endpoint
       const response = await riderApi.completeDelivery({ 
          shipmentId: orderId,
          scannedCode,
          paymentMethod,
          codAmount: order?.cod_amount ? Number(order.cod_amount) : 0,
       });
       if (!response.success && response.error) {
         throw new Error(response.error.message || 'Failed to complete delivery');
       }
       return response.data;
    },
    onSuccess: () => {
        Alert.alert('Success', 'Delivery Confirmed Successfully!');
        
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['activeOrders'] });

        // Navigate back to Home
        navigation.popToTop(); 
    },
    onError: (err: any) => {
        Alert.alert('Error', err.message);
    }
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>Delivery Confirmation</Text>
            <Text style={styles.headerSubtitle}>Finalize handover</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Success Banner */}
          <View style={styles.successCard}>
              <View style={styles.successIcon}>
                  <Ionicons name="cube-outline" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Package Verified</Text>
                  <Text style={styles.successSubtitle}>{scannedCode || 'Verified Scan'}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={28} color="#00C853" />
          </View>

          {/* Recipient Info */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}>Recipient Details</Text>
              <Text style={styles.recipientName}>{order?.recipient_name || 'Customer Name'}</Text>
              
              <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoText}>{order?.recipient_phone || 'N/A'}</Text>
              </View>

              <View style={[styles.divider, { marginVertical: spacing.md }]} />

              <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoText}>{order?.delivery_address || 'Delivery Address'}</Text>
              </View>
          </View>

          {/* Payment Collection (COD) */}
          <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                  <Text style={styles.cardHeader}>Payment Collection</Text>
                  <View style={styles.codBadge}>
                      <Text style={styles.codText}>COD</Text>
                  </View>
              </View>
              
              <View style={styles.amountContainer}>
                  <Text style={styles.amountLabel}>Amount to Collect</Text>
                  <Text style={styles.amountValue}>${order?.cod_amount || order?.codAmount || '0.00'}</Text>
              </View>

              <Text style={styles.paymentMethodLabel}>Payment Method</Text>
              <View style={styles.paymentRow}>
                  <TouchableOpacity 
                    style={[styles.paymentBtn, paymentMethod === 'Cash' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('Cash')}
                  >
                      <Ionicons name="cash-outline" size={20} color={paymentMethod === 'Cash' ? '#2962FF' : '#757575'} />
                      <Text style={[styles.paymentBtnText, paymentMethod === 'Cash' && styles.paymentBtnTextActive]}>Cash</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.paymentBtn, paymentMethod === 'Online' && styles.paymentBtnActive]}
                    onPress={() => setPaymentMethod('Online')}
                  >
                       <Ionicons name="card-outline" size={20} color={paymentMethod === 'Online' ? '#2962FF' : '#757575'} />
                      <Text style={[styles.paymentBtnText, paymentMethod === 'Online' && styles.paymentBtnTextActive]}>Pre-paid / Online</Text>
                  </TouchableOpacity>
              </View>
          </View>

          {/* Proof of Delivery (Signature Mock) */}
           <View style={styles.card}>
              <Text style={styles.cardHeader}>Proof of Delivery</Text>
              <TouchableOpacity style={styles.signatureBox}>
                   <Ionicons name="pencil" size={24} color={colors.textLight} />
                   <Text style={styles.signatureText}>Tap to collect signature</Text>
              </TouchableOpacity>
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
                    <Ionicons name="checkmark-done-circle-outline" size={24} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirm Delivery</Text>
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
    backgroundColor: '#F5F7FA',
  },
  header: {
      backgroundColor: '#2962FF', // Blue for Delivery
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
      backgroundColor: '#FFF',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 5,
      elevation: 2,
  },
  successIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#2962FF',
      justifyContent: 'center',
      alignItems: 'center',
  },
  successTitle: {
      color: '#1E293B',
      fontSize: 16,
      fontWeight: 'bold',
  },
  successSubtitle: {
      color: '#64748B',
      fontSize: 13,
  },
  card: {
      backgroundColor: '#FFF',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 3,
      elevation: 1,
  },
  cardTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
  },
  cardHeader: {
      fontSize: 15,
      fontWeight: '700',
      color: '#334155',
      marginBottom: spacing.sm,
  },
  recipientName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#0F172A',
      marginBottom: spacing.xs,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
  },
  infoText: {
      color: '#475569',
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
  },
  divider: {
      height: 1,
      backgroundColor: '#F1F5F9',
  },
  amountContainer: {
      backgroundColor: '#F8FAFC',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: '#E2E8F0',
  },
  amountLabel: {
      fontSize: 12,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
      marginBottom: 4,
  },
  amountValue: {
      fontSize: 28,
      fontWeight: '800',
      color: '#0F172A',
  },
  codBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
  },
  codText: {
      color: '#D97706',
      fontSize: 10,
      fontWeight: 'bold',
  },
  paymentMethodLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#334155',
      marginBottom: spacing.sm,
  },
  paymentRow: {
      flexDirection: 'row',
      gap: spacing.md,
  },
  paymentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: '#E2E8F0',
      backgroundColor: '#FFF',
  },
  paymentBtnActive: {
      borderColor: '#2962FF',
      backgroundColor: '#EFF6FF',
  },
  paymentBtnText: {
      fontSize: 14,
      color: '#64748B',
      fontWeight: '500',
  },
  paymentBtnTextActive: {
      color: '#2962FF',
      fontWeight: '700',
  },
  signatureBox: {
      height: 100,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderStyle: 'dashed',
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.sm,
  },
  signatureText: {
      color: '#94A3B8',
      fontSize: 14,
      marginTop: spacing.xs,
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
      backgroundColor: '#2962FF', // Blue match header
      height: 56,
      borderRadius: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      shadowColor: '#2962FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
  },
  confirmButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
  }
});
