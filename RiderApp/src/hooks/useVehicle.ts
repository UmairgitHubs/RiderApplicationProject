import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/api';
import { Alert } from 'react-native';

export const VECHICLE_QUERY_KEY = ['vehicle'];

export interface VehicleData {
  type: string;
  number: string;
  model: string;
  color: string;
  status: 'Active' | 'Inactive';
}

export const useVehicle = () => {
  const queryClient = useQueryClient();

  const {
    data: vehicle,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: VECHICLE_QUERY_KEY,
    queryFn: async (): Promise<VehicleData | null> => {
      try {
        const response = await profileApi.getProfile() as any;
        if (response.success && response.data?.profile) {
          const { vehicleType, vehicleNumber, vehicleModel, vehicleColor } = response.data.profile;
          if (vehicleType && vehicleNumber) {
            return {
              type: vehicleType,
              model: vehicleModel || 'Unknown Model',
              number: vehicleNumber,
              color: vehicleColor || 'Standard',
              status: 'Active',
            };
          }
        }
        return null;
      } catch (error) {
        console.error('Error fetching vehicle:', error);
        throw error;
      }
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: { type: string; number: string; model: string }) => {
      // Map frontend model to backend vehicleType
      return profileApi.updateProfile({
        vehicleType: data.type,
        vehicleModel: data.model,
        vehicleNumber: data.number,
        vehicleColor: 'Standard', // Default for now
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VECHICLE_QUERY_KEY });
      // Invalidate profile query too if it exists separately
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to update vehicle');
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      return profileApi.updateProfile({
        vehicleType: '',
        vehicleNumber: '',
        vehicleModel: '',
        vehicleColor: '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VECHICLE_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to remove vehicle');
    },
  });

  return {
    vehicle,
    isLoading,
    isError,
    refetch,
    addVehicle: updateVehicleMutation.mutateAsync,
    isAdding: updateVehicleMutation.isPending,
    deleteVehicle: deleteVehicleMutation.mutateAsync,
    isDeleting: deleteVehicleMutation.isPending,
  };
};
