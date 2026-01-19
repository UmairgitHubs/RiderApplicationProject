import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useNotifications, Notification } from '../../hooks/useNotifications';

// Simple time ago helper
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

export default function NotificationsScreen({ navigation }: any) {
  const {
    notifications,
    unreadCount,
    isLoading,
    isRefetching,
    refetch,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
    getIconForType,
    getColorForType,
    getBgColorForType
  } = useNotifications();

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // Navigate based on type if needed
    // if (notification.type === 'shipment' && notification.referenceId) {
    //   navigation.navigate('ShipmentDetails', { shipmentId: notification.referenceId });
    // }
  };

  const handleMarkAllRead = () => {
     markAllAsRead();
  };

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
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
            disabled={isMarkingAllAsRead}
          >
             {isMarkingAllAsRead ? (
               <ActivityIndicator size="small" color={colors.primary} />
             ) : (
               <Text style={styles.markAllText}>Mark all as read</Text>
             )}
          </TouchableOpacity>
        )}

        {/* Loading State */}
        {isLoading && !isRefetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
           <View style={styles.emptyContainer}>
             <Ionicons name="notifications-off-outline" size={48} color={colors.textLight} />
             <Text style={styles.emptyText}>No notifications yet</Text>
           </View>
        ) : (
          /* Notifications List */
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.isRead && styles.notificationCardUnread,
              ]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View 
                style={[
                  styles.iconContainer,
                  { backgroundColor: getBgColorForType(notification.type) }
                ]}
              >
                <Ionicons 
                  name={getIconForType(notification.type) as any} 
                  size={24} 
                  color={getColorForType(notification.type)} 
                />
              </View>
              
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  {!notification.isRead && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{formatTimeAgo(notification.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    paddingBottom: 40,
  },
  markAllButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    padding: spacing.xs,
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  notificationCardUnread: {
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
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
     padding: spacing['2xl'],
     alignItems: 'center',
     gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.textLight,
  }
});
