import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { useNotifications, Notification } from '../../hooks/useNotifications';

// Simple time ago helper
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

export default function NotificationsScreen({ navigation }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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

  // Responsive logic
  const isTablet = windowWidth > 768;
  const contentWidth = isTablet ? 600 : '100%';

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.centerWrapper}>
      <TouchableOpacity
        style={[
          styles.notificationCard,
          { width: contentWidth },
          !item.isRead && styles.notificationCardUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View 
          style={[
            styles.iconContainer,
            { backgroundColor: getBgColorForType(item.type) }
          ]}
        >
          <Ionicons 
            name={getIconForType(item.type) as any} 
            size={24} 
            color={getColorForType(item.type)} 
          />
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>We'll notify you when something important happens.</Text>
    </View>
  );

  const ListHeaderComponent = () => (
    unreadCount > 0 ? (
      <View style={styles.centerWrapper}>
        <View style={[styles.headerActions, { width: contentWidth }]}>
          <TouchableOpacity 
            onPress={() => markAllAsRead()}
            disabled={isMarkingAllAsRead}
          >
            {isMarkingAllAsRead ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.markAllText}>Mark all as read</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    ) : null
  );

  return (
    <View style={styles.container}>
      {/* Orange Rounded Header with Safe Area */}
      <View style={[styles.orangeHeader, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>{unreadCount} unread messages</Text>
        </View>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={isLoading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} /> : ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFC',
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingBottom: 30,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: spacing.lg,
  },
  headerActions: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginHorizontal: spacing.lg,
  },
  notificationCardUnread: {
    borderColor: colors.primary,
    backgroundColor: '#FFF9F5',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
});
