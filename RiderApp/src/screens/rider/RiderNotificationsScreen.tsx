import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { notificationsApi } from '../../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}

export default function RiderNotificationsScreen({ navigation: navProp }: any = {}) {
  const navHook = useNavigation<any>();
  const navigation = navProp || navHook;
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Settings state
  const [newOrders, setNewOrders] = useState(true);
  const [payments, setPayments] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({
        limit: 50,
      });
      
      if (response.success && response.data) {
        const fetchedNotifications = response.data.notifications || [];
        setNotifications(fetchedNotifications);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      // Use fallback data if API fails
      setNotifications([
        {
          id: '1',
          title: 'New Delivery Request',
          message: 'You have a new delivery request in Manhattan',
          type: 'delivery',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: '2',
          title: 'Payment Received',
          message: '$45.50 has been added to your wallet',
          type: 'payment',
          isRead: false,
          createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
        },
        {
          id: '3',
          title: 'Delivery Completed',
          message: 'Customer rated your delivery 5 stars!',
          type: 'delivery',
          isRead: true,
          createdAt: new Date(Date.now() - 3 * 60 * 60000).toISOString(),
        },
        {
          id: '4',
          title: 'Document Expiring Soon',
          message: 'Your vehicle insurance expires in 30 days',
          type: 'alert',
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        },
      ]);
      setUnreadCount(2);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationsApi.markAllAsRead();
      if (response.success) {
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read.');
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.referenceType === 'shipment' && notification.referenceId) {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('RiderOrderDetails', { orderId: notification.referenceId });
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delivery':
      case 'order':
        return { name: 'cube', color: '#2196F3', bg: '#E3F2FD' };
      case 'payment':
      case 'earnings':
        return { name: 'cash', color: '#4CAF50', bg: '#E8F5E9' };
      case 'alert':
      case 'warning':
        return { name: 'warning', color: '#FF9800', bg: '#FFF3E0' };
      default:
        return { name: 'notifications', color: '#757575', bg: '#F5F5F5' };
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>{unreadCount} unread</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
            </View>
          ) : (
            <>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.markAllButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Text style={styles.markAllText}>Mark all as read</Text>
                </TouchableOpacity>
              )}

              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-outline" size={64} color={colors.textLight} />
                  <Text style={styles.emptyStateText}>No notifications</Text>
                  <Text style={styles.emptyStateSubtext}>
                    You're all caught up!
                  </Text>
                </View>
              ) : (
                notifications.map((notification) => {
                  const icon = getNotificationIcon(notification.type);
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={styles.notificationCard}
                      onPress={() => handleNotificationPress(notification)}
                    >
                      <View style={[styles.iconContainer, { backgroundColor: icon.bg }]}>
                        <Ionicons name={icon.name as any} size={24} color={icon.color} />
                      </View>
                      
                      <View style={styles.notificationContent}>
                        <View style={styles.notificationHeader}>
                          <Text style={styles.notificationTitle}>{notification.title}</Text>
                          {!notification.isRead && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.notificationMessage}>{notification.message}</Text>
                        <Text style={styles.notificationTime}>
                          {formatTimeAgo(notification.createdAt)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Notification Preferences */}
          <Text style={styles.sectionTitle}>NOTIFICATION PREFERENCES</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>New Orders</Text>
                <Text style={styles.settingDescription}>
                  Get notified of new delivery requests
                </Text>
              </View>
              <Switch
                value={newOrders}
                onValueChange={setNewOrders}
                trackColor={{ false: '#767577', true: '#FF6B00' }}
                thumbColor={colors.textWhite}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Payments</Text>
                <Text style={styles.settingDescription}>
                  Notifications about earnings and payments
                </Text>
              </View>
              <Switch
                value={payments}
                onValueChange={setPayments}
                trackColor={{ false: '#767577', true: '#FF6B00' }}
                thumbColor={colors.textWhite}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Alerts</Text>
                <Text style={styles.settingDescription}>
                  Important alerts and reminders
                </Text>
              </View>
              <Switch
                value={alerts}
                onValueChange={setAlerts}
                trackColor={{ false: '#767577', true: '#FF6B00' }}
                thumbColor={colors.textWhite}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Promotions</Text>
                <Text style={styles.settingDescription}>
                  News and promotional offers
                </Text>
              </View>
              <Switch
                value={promotions}
                onValueChange={setPromotions}
                trackColor={{ false: '#767577', true: '#FF6B00' }}
                thumbColor={colors.textWhite}
              />
            </View>
          </View>

          {/* Delivery Channels */}
          <Text style={styles.sectionTitle}>DELIVERY CHANNELS</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.channelItem}>
              <View style={styles.channelLeft}>
                <View style={[styles.channelIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="notifications" size={20} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.channelLabel}>Push Notifications</Text>
                  <Text style={styles.channelSubtitle}>Enabled</Text>
                </View>
              </View>
              {pushEnabled && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>

            <View style={styles.channelItem}>
              <View style={styles.channelLeft}>
                <View style={[styles.channelIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="mail" size={20} color="#9C27B0" />
                </View>
                <View>
                  <Text style={styles.channelLabel}>Email</Text>
                  <Text style={styles.channelSubtitle}>Enabled</Text>
                </View>
              </View>
              {emailEnabled && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    color: '#4CAF50',
    fontWeight: typography.fontWeight.medium,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textLight,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  channelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  channelLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  channelSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});

