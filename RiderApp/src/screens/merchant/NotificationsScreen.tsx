import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface Notification {
  id: string;
  type: 'delivery' | 'payment' | 'offer' | 'pickup';
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
  iconBg: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'delivery',
      title: 'Package Delivered',
      message: 'Your package CE2024001234567 has been delivered successfully',
      time: '2 hours ago',
      read: false,
      icon: 'cube',
      iconBg: '#E3F2FD',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Successful',
      message: '$45.99 has been deducted from your wallet',
      time: '5 hours ago',
      read: false,
      icon: 'wallet',
      iconBg: '#E8F5E9',
    },
    {
      id: '3',
      type: 'offer',
      title: 'Special Offer!',
      message: 'Get 20% off on your next 5 shipments',
      time: '1 day ago',
      read: true,
      icon: 'pricetag',
      iconBg: '#FFF3E0',
    },
    {
      id: '4',
      type: 'pickup',
      title: 'Shipment Picked Up',
      message: 'Your package has been picked up by the rider',
      time: '2 days ago',
      read: true,
      icon: 'cube',
      iconBg: '#E3F2FD',
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header */}
      <View style={styles.orangeHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount} unread</Text>
        </View>
      </View>

      {/* White Content Section */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={() => {
            // TODO: Implement mark all as read functionality
            console.log('Mark all notifications as read');
          }}
        >
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>

        {/* Notifications List */}
        {notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.read && styles.notificationCardUnread,
            ]}
          >
            <View 
              style={[
                styles.iconContainer,
                { backgroundColor: notification.iconBg }
              ]}
            >
              <Ionicons 
                name={notification.icon as any} 
                size={24} 
                color={
                  notification.type === 'delivery' || notification.type === 'pickup' 
                    ? '#2196F3' 
                    : notification.type === 'payment' 
                    ? '#4CAF50' 
                    : '#FF9800'
                } 
              />
            </View>
            
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                {!notification.read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 160,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  headerTextContainer: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  markAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
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
  notificationCardUnread: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFF9F5',
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
    backgroundColor: colors.primary,
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
});

