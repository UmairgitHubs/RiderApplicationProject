import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface SystemSettings {
  base_delivery_fee: number;
  package_weight_fee: number; // Assuming this might exist or we use a heuristic
  currency: string;
  min_order_value: number;
}

const fetchSystemSettings = async (): Promise<SystemSettings> => {
  const response = await api.get('/settings/info');
  // Handle different response structures if needed
  const res = response as any;
  if (res.data && res.data.data) {
    return res.data.data;
  }
  return res.data;
};

export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
