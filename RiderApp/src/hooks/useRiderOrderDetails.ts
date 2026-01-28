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

  // Accept Order Mutation
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await riderApi.acceptOrder(orderId);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to accept order');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      Alert.alert('Success', 'Order accepted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to accept order');
    },
  });

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

  // Drop off at Hub Mutation
  const dropOffMutation = useMutation({
    mutationFn: async () => {
      const response = await riderApi.dropOffAtHub(orderId);
      if (!response.success && response.error) {
        throw new Error(response.error.message || 'Failed to drop off at hub');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['activeOrders'] });
      Alert.alert('Success', 'Order dropped off at Hub', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to drop off at hub');
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

    const isSecondLeg = !!order.pickup_rider_id || order.status === 'received_at_hub';
    const isFirstLeg = !isSecondLeg && order.hub_id;

    switch (order.status) {
      case 'pending':
      case 'assigned':
         return {
            label: isSecondLeg ? 'Confirm Hub Pickup' : 'Confirm Pickup',
            onPress: () => {
                Alert.alert(
                  isSecondLeg ? 'Confirm Hub Pickup' : 'Confirm Pickup', 
                  isSecondLeg ? 'Are you at the Hub to collect this package?' : 'Are you at the Merchant to collect this package?', 
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => pickupMutation.mutate() }
                  ]
                )
            },
            isLoading: pickupMutation.isPending,
            variant: 'primary'
         };
      case 'in_transit':
      case 'picked_up':
         // Determine if this is a Hub-to-Destination leg 
         // Leg 2 criteria: either it's been dropped at hub already, or it's currently at hub status, 
         // or it has a previous rider who picked it up.
         
         if (order.hub_id && !isSecondLeg) {
             return {
                label: 'Submitted to Hub',
                onPress: () => {
                    Alert.alert('Confirm Hub Drop-off', 'Are you at the Hub sorting center?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Confirm', onPress: () => dropOffMutation.mutate() }
                    ])
                },
                isLoading: dropOffMutation.isPending,
                variant: 'primary'
             };
         }

         // Action: Complete Delivery (Leg 2 or Direct)
         return {
            label: 'Delivered to Customer',
            onPress: () => {
                Alert.alert('Confirm Delivery', 'Are you sure you have delivered the package to the customer?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm', onPress: () => completeMutation.mutate() }
                ])
            },
            isLoading: completeMutation.isPending,
            variant: 'success'
         };
      case 'received_at_hub':
         // If it's at hub but no rider is currently assigned (status is received_at_hub)
         // Allow the rider viewing it to Accept it (Leg 2)
         if (!order.rider_id) {
             return {
                label: 'Accept Order (Hub Pickup)',
                onPress: () => {
                    Alert.alert('Accept Order', 'Do you want to accept this order for delivery from the Hub to the Customer?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Accept', onPress: () => acceptMutation.mutate() }
                    ])
                },
                isLoading: acceptMutation.isPending,
                variant: 'primary'
             };
         }

         return {
            label: 'At Hub (Waiting for Assignment)',
            onPress: () => {},
            isLoading: false,
            variant: 'disabled'
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
    isProcessing: pickupMutation.isPending || completeMutation.isPending || dropOffMutation.isPending
  };
};
