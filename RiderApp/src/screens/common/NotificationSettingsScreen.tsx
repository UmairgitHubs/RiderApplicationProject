import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Switch,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { profileApi } from '../../services/api';

export default function NotificationSettingsScreen({ navigation }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Notification channel preferences
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  // Notification type preferences
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [deliveryAlerts, setDeliveryAlerts] = useState(true);
  const [paymentNotifications, setPaymentNotifications] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [newsUpdates, setNewsUpdates] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);

  const isTablet = windowWidth > 768;
  const contentWidth = isTablet ? 600 : '100%';

  // Fetch notification settings when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchNotificationSettings();
    }, [])
  );

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      const response: any = await profileApi.getProfile();
      
      if (response.success && response.data?.profile) {
        const profile = response.data.profile;
        // Channel preferences
        setPushEnabled(profile.pushNotifications ?? true);
        setEmailEnabled(profile.emailNotifications ?? true);
        setSmsEnabled(profile.smsNotifications ?? true);
        
        // Alert type preferences
        setOrderUpdates(profile.notifOrderUpdates ?? true);
        setDeliveryAlerts(profile.notifDeliveryAlerts ?? true);
        setPaymentNotifications(profile.notifPayments ?? true);
        setPromotions(profile.notifPromotions ?? false);
        setNewsUpdates(profile.notifSystemUpdates ?? false);
        setWeeklyReports(profile.weeklyReports ?? true);
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSetting = async (
    field: string,
    value: boolean,
    revertCallback: () => void
  ) => {
    try {
      setSaving(true);
      
      const updateData: any = {};
      updateData[field] = value;
      
      const response: any = await profileApi.updateProfile(updateData);
      
      if (!response.success) {
        revertCallback();
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notification setting:', error);
      revertCallback();
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Channel toggle handlers
  const handlePushToggle = (value: boolean) => {
    setPushEnabled(value);
    updateNotificationSetting('pushNotifications', value, () => setPushEnabled(!value));
  };

  const handleEmailToggle = (value: boolean) => {
    setEmailEnabled(value);
    updateNotificationSetting('emailNotifications', value, () => setEmailEnabled(!value));
  };

  const handleSmsToggle = (value: boolean) => {
    setSmsEnabled(value);
    updateNotificationSetting('smsNotifications', value, () => setSmsEnabled(!value));
  };
   
  // Alert type toggle handlers
  const handleOrderUpdatesToggle = (value: boolean) => {
    setOrderUpdates(value);
    updateNotificationSetting('notifOrderUpdates', value, () => setOrderUpdates(!value));
  };

  const handleDeliveryAlertsToggle = (value: boolean) => {
    setDeliveryAlerts(value);
    updateNotificationSetting('notifDeliveryAlerts', value, () => setDeliveryAlerts(!value));
  };

  const handlePaymentNotificationsToggle = (value: boolean) => {
    setPaymentNotifications(value);
    updateNotificationSetting('notifPayments', value, () => setPaymentNotifications(!value));
  };

  const handlePromotionsToggle = (value: boolean) => {
    setPromotions(value);
    updateNotificationSetting('notifPromotions', value, () => setPromotions(!value));
  };

  const handleNewsUpdatesToggle = (value: boolean) => {
    setNewsUpdates(value);
    updateNotificationSetting('notifSystemUpdates', value, () => setNewsUpdates(!value));
  };

  const handleWeeklyReportsToggle = (value: boolean) => {
    setWeeklyReports(value);
    updateNotificationSetting('weeklyReports', value, () => setWeeklyReports(!value));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={[styles.orangeHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Notification Settings</Text>
          <Text style={styles.subtitle}>Manage your delivery and system alerts</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerWrapper}>
          <View style={{ width: contentWidth }}>
            {/* Notification Channels */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CHANNELS</Text>
              
              <View style={styles.settingCard}>
                <ToggleItem 
                  icon="phone-portrait" 
                  label="Push Notifications" 
                  desc="Receive alerts on your device"
                  value={pushEnabled}
                  onValueChange={handlePushToggle}
                  color={colors.primary}
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="mail" 
                  label="Email" 
                  desc="Receive updates via email"
                  value={emailEnabled}
                  onValueChange={handleEmailToggle}
                  color={colors.primary}
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="chatbubble" 
                  label="SMS" 
                  desc="Mobile text alerts"
                  value={smsEnabled}
                  onValueChange={handleSmsToggle}
                  color={colors.primary}
                  disabled={saving}
                />
              </View>
            </View>

            {/* Notification Types */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ALERT TYPES</Text>
              
              <View style={styles.settingCard}>
                <ToggleItem 
                  icon="cube" 
                  label="Order Updates" 
                  desc="Status changes and tracking"
                  value={orderUpdates}
                  onValueChange={handleOrderUpdatesToggle}
                  color="#2196F3"
                  bg="#E3F2FD"
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="checkmark-circle" 
                  label="Delivery Alerts" 
                  desc="Pickup and delivery notifications"
                  value={deliveryAlerts}
                  onValueChange={handleDeliveryAlertsToggle}
                  color={colors.success}
                  bg="#E8F5E9"
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="cash" 
                  label="Payments" 
                  desc="Earnings and wallet updates"
                  value={paymentNotifications}
                  onValueChange={handlePaymentNotificationsToggle}
                  color={colors.warning}
                  bg="#FFF3E0"
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="pricetag" 
                  label="Promotions" 
                  desc="Special deals and discounts"
                  value={promotions}
                  onValueChange={handlePromotionsToggle}
                  color="#E91E63"
                  bg="#FCE4EC"
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="newspaper" 
                  label="System Updates" 
                  desc="News and app announcements"
                  value={newsUpdates}
                  onValueChange={handleNewsUpdatesToggle}
                  color="#9C27B0"
                  bg="#F3E5F5"
                  disabled={saving}
                />
                <Divider />
                <ToggleItem 
                  icon="stats-chart" 
                  label="Weekly Reports" 
                  desc="Summary of your activity"
                  value={weeklyReports}
                  onValueChange={handleWeeklyReportsToggle}
                  color="#FF9800"
                  bg="#FFF3E0"
                  disabled={saving}
                />
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#0277BD" />
              <Text style={styles.infoText}>
                Crucial security and account-related alerts will still be sent even if other notifications are disabled.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Saving Indicator */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const ToggleItem = ({ icon, label, desc, value, onValueChange, color, bg, disabled }: any) => (
  <View style={styles.settingItem}>
    <View style={styles.settingLeft}>
      <View style={[styles.iconContainer, bg ? { backgroundColor: bg } : {}]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{desc}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#767577', true: colors.primary }}
      thumbColor={Platform.OS === 'ios' ? undefined : colors.textWhite}
      disabled={disabled}
    />
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  headerTop: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 12,
    letterSpacing: 1,
    paddingLeft: 4,
  },
  settingCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: spacing.lg,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: '#E1F5FE',
    padding: spacing.lg,
    borderRadius: 20,
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#B3E5FC',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0277BD',
    lineHeight: 20,
    fontWeight: '500',
  },
  savingOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    gap: spacing.sm,
  },
  savingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
});
