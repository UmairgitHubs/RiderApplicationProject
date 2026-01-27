import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { profileApi } from '../services/api';

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  newOrders: boolean;
  deliveryAlerts: boolean;
  payments: boolean;
  promotions: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    newOrders: true,
    deliveryAlerts: true,
    payments: true,
    promotions: false,
    systemUpdates: false,
    weeklyReports: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch initial settings
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await profileApi.getProfile();
      
      if (response.success && response.data?.profile) {
        const profile = response.data.profile;
        setSettings({
          pushEnabled: profile.pushNotifications ?? true,
          emailEnabled: profile.emailNotifications ?? true,
          smsEnabled: profile.smsNotifications ?? true,
          newOrders: profile.notifOrderUpdates ?? true,
          deliveryAlerts: profile.notifDeliveryAlerts ?? true,
          payments: profile.notifPayments ?? true,
          promotions: profile.notifPromotions ?? false,
          systemUpdates: profile.notifSystemUpdates ?? false,
          weeklyReports: profile.weeklyReports ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a specific setting
  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    // Optimistic update
    const previousSettings = { ...settings };
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaving(true);

    try {
      // Map local keys to API keys
      const apiKeys: Record<keyof NotificationSettings, string> = {
        pushEnabled: 'pushNotifications',
        emailEnabled: 'emailNotifications',
        smsEnabled: 'smsNotifications',
        newOrders: 'notifOrderUpdates', // Map 'New Orders' to 'notifOrderUpdates' (which is technically correct for riders logic)
        deliveryAlerts: 'notifDeliveryAlerts',
        payments: 'notifPayments',
        promotions: 'notifPromotions',
        systemUpdates: 'notifSystemUpdates',
        weeklyReports: 'weeklyReports',
      };

      const updateData = { [apiKeys[key]]: value };
      console.log('📝 Updating Profile:', updateData);
      
      const response: any = await profileApi.updateProfile(updateData);
      console.log('✅ Update Profile Response:', response);

      if (!response.success) {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      // Revert on error
      setSettings(previousSettings);
      Alert.alert('Error', 'Failed to save preference. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    refreshSettings: fetchSettings
  };
};
