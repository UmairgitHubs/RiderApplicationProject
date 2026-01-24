import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi, riderApi, ApiResponse } from '../services/api';
import { Alert, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const useRiderOrderDetails = (orderId: string) => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  // Fetch Order Details
  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await shipmentApi.getById(orderId) as ApiResponse;
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to fetch order details');
      }
      return response.data;
    },
    enabled: !!orderId,
  });

  const order = orderData?.shipment;

  // Pickup Order Mutation
  const pickupMutation = useMutation({
    mutationFn: async () => {
      const response = await riderApi.pickupOrder(orderId);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to pick up order');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] }); // Refresh details
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });  // Refresh dashboard
      Alert.alert('Success', 'Order marked as picked up');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to pick up order');
    },
  });

  // Complete Delivery Mutation
  const completeMutation = useMutation({
    mutationFn: async () => {
      // For now, we assume no COD and no notes, or we can prompt for them.
      // The user asked for "Complete flow", so let's stick to simple "Complete" for now.
      const response = await riderApi.completeDelivery({ shipmentId: orderId });
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to complete delivery');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      queryClient.invalidateQueries({ queryKey: ['riderEarnings'] }); // Refresh earnings
      Alert.alert('Success', 'Delivery completed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to complete delivery');
    },
  });

  // Helper Functions
  const handleCall = (phoneNumber: string, name: string) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number available');
      return;
    }
    Alert.alert(
      `Call ${name}`,
      phoneNumber,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phoneNumber}`) },
      ]
    );
  };

  const handleNavigate = (address: string) => {
    if (!address) {
        Alert.alert('Error', 'No address available');
        return;
    }
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    // Fallback to Google Maps web if native scheme fails or we just prefer it universal
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    
    Linking.openURL(url || googleUrl).catch(() => Linking.openURL(googleUrl));
  };


  // Logic for the primary action button
  const getButtonAction = () => {
    if (!order) return null;

    switch (order.status) {
      case 'pending':
      case 'assigned':
         // Action: Arrive at Pickup / Pick Up
         // Since we just have 'pickupOrder', we used that.
         return {
            label: 'Confirm Pickup',
            onPress: () => {
                Alert.alert('Confirm Pickup', 'Are you sure you have picked up the package?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => pickupMutation.mutate() }
                ])
            },
            isLoading: pickupMutation.isPending,
            variant: 'primary'
         };
      case 'in_transit':
      case 'picked_up':
         // Action: Complete Delivery
         return {
            label: 'Complete Delivery',
            onPress: () => {
                Alert.alert('Confirm Delivery', 'Are you sure you have delivered the package?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => completeMutation.mutate() }
                ])
            },
            isLoading: completeMutation.isPending,
            variant: 'success'
         };
      case 'delivered':
      case 'completed':
         return {
            label: 'Completed',
            onPress: () => {},
            isLoading: false,
            variant: 'disabled'
         };
      default:
         return { label: `Unknown Status (${order.status})`, onPress: () => {}, isLoading: false, variant: 'disabled' };
    }
  };

  return {
    order,
    isLoading,
    error,
    refetch,
    handleCall,
    handleNavigate,
    buttonAction: getButtonAction(),
    isProcessing: pickupMutation.isPending || completeMutation.isPending
  };
};
