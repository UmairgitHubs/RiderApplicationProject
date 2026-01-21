import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shipmentApi } from '../../services/api';

// Custom purple theme colors matching the design image
const purpleTheme = {
  primary: '#8A2BE2', // BlueViolet
  light: '#F3E5F5', // Light Purple bg
  text: '#6A1B9A', // Darker purple text
  accent: '#E1BEE7', // Light purple accent
};


export default function FranchiseOrderDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { shipment } = (route.params as any) || {};

  // Mock data matching the image if real data isn't full yet
  const orderId = shipment?.trackingNumber || 'FR2024009876543';
  const itemCount = shipment?.packageCount || 6;
  const status = 'Out for Delivery'; // Or shipment?.status

  const [loading, setLoading] = React.useState(true);
  const [shipmentsList, setShipmentsList] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchBatchShipments();
  }, [orderId]);

  const fetchBatchShipments = async () => {
      try {
          if (!orderId) return;
          setLoading(true);
          // Assuming orderId passed is the batchId (which is the case from MerchantHome)
          // We cast params to any to allow batchId which we just added to backend
          const response = await shipmentApi.getAll({ batchId: orderId } as any) as any;
          if (response.success && response.data?.shipments) {
              setShipmentsList(response.data.shipments);
          }
      } catch (error) {
          console.error("Failed to fetch batch shipments", error);
      } finally {
          setLoading(false);
      }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'ios' ? 10 : 20) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Franchise Bulk Order</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
             <View style={styles.iconContainer}>
               <Ionicons name="business" size={24} color="white" />
             </View>
             <View>
               <Text style={styles.cardTitle}>Bulk Franchise Order</Text>
               <Text style={styles.cardSubtitle}>Multiple customers • Hub routed</Text>
             </View>
          </View>

          {/* Order ID Section */}
          <View style={styles.orderIdContainer}>
             <View>
                 <Text style={styles.label}>Franchise Order ID</Text>
                 <Text style={styles.orderId}>{orderId}</Text>
                 <Text style={styles.itemCount}>{shipmentsList.length || itemCount} pieces • {shipmentsList.length || itemCount} different customers</Text>
             </View>
             <View style={styles.statusBadge}>
                 <Text style={styles.statusText}>{status}</Text>
             </View>
          </View>
        </View>

        {/* Delivery Destinations */}
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Destinations</Text>
            <Text style={styles.sectionSubtitle}>(All Trackable):</Text>

            {loading ? (
                <View style={{ padding: 20 }}>
                     <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : (
                shipmentsList.map((dest, index) => (
                    <View key={dest.id || index} style={styles.destinationRow}>
                        <View style={styles.destinationNumber}>
                            <Text style={styles.destinationNumberText}>{index + 1}</Text>
                        </View>
                        <View style={styles.destinationInfo}>
                            <View style={styles.destinationHeader}>
                                <Text style={styles.destinationName}>{dest.recipientName || 'Unknown Recipient'}</Text>
                                <Ionicons name="navigate-outline" size={16} color={purpleTheme.primary} />
                            </View>
                            <Text style={styles.destinationAddress} numberOfLines={1}>{dest.deliveryAddress || 'No Address'}</Text>
                            <Text style={styles.secondaryTrackingId}>{dest.trackingNumber}</Text>
                        </View>
                    </View>
                ))
            )}
            
            {!loading && shipmentsList.length === 0 && (
                <Text style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    No shipments found in this batch.
                </Text>
            )}
        </View>

        {/* Delivery Flow */}
        <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Flow:</Text>
            
            <View style={styles.flowContainer}>
                {/* Step 1 */}
                <View style={styles.flowStep}>
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                    <Text style={styles.flowText}>Merchant → Pickup Rider → Hub</Text>
                </View>

                {/* Arrow */}
                <View style={styles.flowArrow}>
                     <Ionicons name="arrow-down" size={20} color={colors.textLight} />
                     <Text style={styles.flowSubText}>Sorted & assigned at hub</Text>
                </View>

                {/* Step 2 (Active) */}
                <View style={styles.flowStep}>
                    <View style={styles.activeCircle}>
                        <View style={styles.activeDot} />
                    </View>
                    <Text style={[styles.flowText, { color: '#FF9800' }]}>Hub → Delivery Riders → Customers</Text>
                </View>
            </View>
        </View>

        {/* Info/Rules Box */}
        <View style={styles.infoBox}>
            <View style={styles.infoHeader}>
                 <Ionicons name="cube" size={16} color="#795548" />
                 <Text style={styles.infoTitle}>Franchise Delivery Info:</Text>
            </View>
            <Text style={styles.infoText}>• Each piece goes to a different customer</Text>
            <Text style={styles.infoText}>• All {itemCount} pieces have unique tracking numbers</Text>
            <Text style={styles.infoText}>• All pieces routed through hub</Text>
            <Text style={styles.infoText}>• Separate delivery riders per area</Text>
            <Text style={styles.infoText}>• Track each delivery individually</Text>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
         <TouchableOpacity style={styles.trackAllButton}>
             <Ionicons name="navigate" size={20} color="white" style={{ marginRight: 8 }} />
             <Text style={styles.trackAllText}>Track All {itemCount} Orders</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Or colors.backgroundLight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  activeBadge: {
    backgroundColor: purpleTheme.light,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: purpleTheme.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: purpleTheme.accent,
    shadowColor: purpleTheme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#AB47BC', // Purple icon bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: purpleTheme.text,
  },
  cardSubtitle: {
    fontSize: typography.fontSize.sm,
    color: purpleTheme.primary,
    opacity: 0.8,
  },
  orderIdContainer: {
     backgroundColor: '#FAFAFA',
     padding: spacing.md,
     borderRadius: borderRadius.lg,
     marginTop: spacing.sm,
  },
  label: {
      fontSize: typography.fontSize.xs,
      color: colors.textLight,
      marginBottom: 2,
  },
  orderId: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: 2,
  },
  itemCount: {
      fontSize: typography.fontSize.sm,
      color: colors.textLight,
  },
  statusBadge: {
      position: 'absolute',
      right: spacing.md,
      top: spacing.md,
      backgroundColor: '#E8F5E9',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  statusText: {
      color: '#2E7D32',
      fontSize: typography.fontSize.xs,
      fontWeight: 'bold',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  sectionTitle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: 2,
  },
  sectionSubtitle: {
      fontSize: typography.fontSize.base,
      color: colors.textLight,
      marginBottom: spacing.md,
  },
  destinationRow: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      gap: spacing.md,
  },
  destinationNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#AB47BC', // Purple
      justifyContent: 'center',
      alignItems: 'center',
  },
  destinationNumberText: {
      color: 'white',
      fontWeight: 'bold',
  },
  destinationInfo: {
      flex: 1,
      backgroundColor: '#F3E5F5', // Very light purple
      borderRadius: borderRadius.md,
      padding: spacing.md,
  },
  destinationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
  },
  destinationName: {
      fontWeight: 'bold',
      color: colors.text,
  },
  destinationAddress: {
      fontSize: typography.fontSize.xs,
      color: colors.textLight,
      marginBottom: 4,
  },
  secondaryTrackingId: {
      fontSize: typography.fontSize.xs,
      color: purpleTheme.primary,
      fontWeight: 'bold',
  },
  
  // Delivery Flow
  flowContainer: {
      marginTop: spacing.sm,
  },
  flowStep: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
  },
  checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#4CAF50',
      justifyContent: 'center',
      alignItems: 'center',
  },
  activeCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FF9800',
      justifyContent: 'center',
      alignItems: 'center',
  },
  activeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF9800',
  },
  flowText: {
      fontSize: typography.fontSize.base,
      color: colors.text,
      flex: 1,
  },
  flowArrow: {
      paddingLeft: 12, // Align with circle center
      marginVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
  },
  flowSubText: {
      fontSize: typography.fontSize.xs,
      color: colors.textLight,
      fontStyle: 'italic',
  },
  
  // Info Box
  infoBox: {
      backgroundColor: '#F3E5F5', // Light purple
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      marginTop: spacing.sm,
  },
  infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
  },
  infoTitle: {
      fontWeight: 'bold',
      color: '#6A1B9A',
  },
  infoText: {
      fontSize: typography.fontSize.sm,
      color: '#6A1B9A',
      marginBottom: 4,
      opacity: 0.9,
  },

  // Footer
  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#fff',
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: '#eee',
  },
  trackAllButton: {
      backgroundColor: '#6200EA', // Deep Purple
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#6200EA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
  },
  trackAllText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: typography.fontSize.lg,
  },
});
