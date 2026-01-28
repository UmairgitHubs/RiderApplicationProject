import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { riderApi } from '../../services/api'; 
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PickupConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId, order, scannedCode } = route.params || {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Damaged'>('Excellent');

  // Mutation for confirming pickup
  const pickupMutation = useMutation({
    mutationFn: async () => {
       // Assuming we send condition and scanned code
       const payload = {
           shipmentId: orderId,
           condition,
           scannedCode
       };
       const response = await riderApi.pickupOrder(payload);
       if (!response.success && response.error) {
         throw new Error(response.error.message || 'Failed to pickup');
       }
       return response.data;
    },
    onSuccess: () => {
        Alert.alert('Success', 'Pickup Confirmed Successfully!');
        
        queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        queryClient.invalidateQueries({ queryKey: ['activeOrders'] });

        // Navigate back to Home or Next Step
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
            <Text style={styles.headerTitle}>Pickup Confirmation</Text>
            <Text style={styles.headerSubtitle}>Complete pickup details</Text>
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

          {/* Generated IDs */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}># Generated IDs</Text>
              
              <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Inbit ID</Text>
                  <Text style={styles.idValueHighlight}>{order?.tracking_number || 'INB49221582'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Merchant ID</Text>
                  <Text style={styles.idValue}>{((order?.merchant_id || '').substring(0, 8)).toUpperCase() || 'MERGJQRXP'}</Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.idRow}>
                  <Text style={styles.idLabel}>Rider ID</Text>
                  <Text style={styles.idValue}>{((order?.rider_id || '').substring(0, 8)).toUpperCase() || 'RIDL06VZH'}</Text>
              </View>
          </View>

          {/* Pickup Location */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}>Pickup Location</Text>
              <Text style={styles.locationName}>{order?.merchant?.business_name || 'Cherry Boutique'}</Text>
              <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.textLight} />
                  <Text style={styles.locationText}>{order?.pickup_address || '555 Cherry Ln, North District, NY'}</Text>
              </View>
          </View>

          {/* Package Condition */}
          <View style={styles.card}>
              <Text style={styles.cardHeader}>Package Condition</Text>
              <View style={styles.conditionRow}>
                  <TouchableOpacity 
                    style={[styles.conditionBtn, condition === 'Excellent' && styles.conditionBtnActive]}
                    onPress={() => setCondition('Excellent')}
                  >
                      {condition === 'Excellent' && <View style={styles.checkIcon}><Ionicons name="checkmark" size={12} color="#000" /></View>}
                      {!condition.includes('Excellent') && <Ionicons name="checkmark" size={20} color="#000" />}
                      <Text style={[styles.conditionLabel, condition === 'Excellent' && styles.conditionLabelActive]}>Excellent</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.conditionBtn, condition === 'Good' && styles.conditionBtnActive]}
                    onPress={() => setCondition('Good')}
                  >
                      <Text style={{ fontSize: 20 }}>~</Text>
                      <Text style={[styles.conditionLabel, condition === 'Good' && styles.conditionLabelActive]}>Good</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.conditionBtn, condition === 'Damaged' && styles.conditionBtnActive]}
                    onPress={() => setCondition('Damaged')}
                  >
                       <Text style={{ fontSize: 20, fontWeight: 'bold' }}>!</Text>
                      <Text style={[styles.conditionLabel, condition === 'Damaged' && styles.conditionLabelActive]}>Damaged</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => pickupMutation.mutate()}
            disabled={pickupMutation.isPending}
          >
              {pickupMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
              ) : (
                  <>
                    <Ionicons name="cube-outline" size={20} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Confirm Pickup & Inbit</Text>
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
      backgroundColor: '#00C853', // Green from Image 1
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
      backgroundColor: '#E8F5E9',
      borderColor: '#C8E6C9',
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
      backgroundColor: '#00C853',
      justifyContent: 'center',
      alignItems: 'center',
  },
  successTitle: {
      color: '#1B5E20',
      fontSize: 14,
      fontWeight: '600',
  },
  successSubtitle: {
      color: '#00C853',
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
      marginBottom: spacing.lg,
  },
  idRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
  },
  idLabel: {
      color: '#9E9E9E',
      fontSize: 14,
  },
  idValue: {
      color: '#333',
      fontWeight: '600',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  idValueHighlight: {
      color: '#FF6B00',
      fontWeight: 'bold',
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
      height: 1,
      backgroundColor: '#F5F5F5',
      marginVertical: spacing.xs,
  },
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
  conditionRow: {
      flexDirection: 'row',
      gap: spacing.md,
  },
  conditionBtn: {
      flex: 1,
      height: 80,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 5,
  },
  conditionBtnActive: {
      borderColor: '#00C853',
      backgroundColor: '#E8F5E9',
  },
  conditionLabel: {
      fontSize: 12,
      color: '#333',
  },
  conditionLabelActive: {
      color: '#00C853',
      fontWeight: '600',
  },
  checkIcon: {
      
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
      backgroundColor: '#66BB6A', // Light Green matching image button
      height: 56,
      borderRadius: 15,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      shadowColor: '#66BB6A',
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
