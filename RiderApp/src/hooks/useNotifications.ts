import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}

export const useNotifications = (limit: number = 20) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    isError,
    error
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response: any = await notificationsApi.getNotifications({ limit });
      return response.data;
    },
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;
  const pagination = data?.pagination;

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getIconForType = (type: string): string => {
    switch (type) {
      case 'delivery':
      case 'shipment':
        return 'cube';
      case 'payment':
        return 'wallet';
      case 'offer':
        return 'pricetag';
      case 'pickup':
        return 'bicycle'; // or 'cube'
      case 'security':
        return 'shield-checkmark';
      default:
        return 'notifications';
    }
  };

  const getColorForType = (type: string): string => {
    switch (type) {
      case 'delivery':
      case 'shipment':
      case 'pickup':
        return '#2196F3'; // Blue
      case 'payment':
        return '#4CAF50'; // Green
      case 'offer':
        return '#FF9800'; // Orange
      case 'security':
        return '#F44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };

  const getBgColorForType = (type: string): string => {
    switch (type) {
      case 'delivery':
      case 'shipment':
      case 'pickup':
        return '#E3F2FD'; // Light Blue
      case 'payment':
        return '#E8F5E9'; // Light Green
      case 'offer':
        return '#FFF3E0'; // Light Orange
      case 'security':
        return '#FFEBEE'; // Light Red
      default:
        return '#F5F5F5'; // Light Grey
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    pagination,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending,
    getIconForType,
    getColorForType,
    getBgColorForType
  };
};
