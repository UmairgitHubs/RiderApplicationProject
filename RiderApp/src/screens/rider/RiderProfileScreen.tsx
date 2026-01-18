import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { profileApi, riderApi, authApi } from '../../services/api';

export default function RiderProfileScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [performance, setPerformance] = useState({
    deliveries: 0,
    onTimeRate: 0,
    rating: 0,
  });

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch profile
      const profileResponse = await profileApi.getProfile();
      const profileData = profileResponse?.data?.profile || {};
      setProfile(profileData);

      // Fetch earnings for performance stats
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const earningsResponse = await riderApi.getEarnings({
        startDate: firstDayOfMonth.toISOString(),
        endDate: today.toISOString(),
      });

      // Calculate performance metrics
      const totalDeliveries = profileData.totalDeliveries || 0;
      const rating = parseFloat(profileData.rating || 0);
      // On-time rate would need to be calculated from delivery history
      // For now, using a default or calculated value
      const onTimeRate = 98; // This should come from backend stats

      setPerformance({
        deliveries: totalDeliveries,
        onTimeRate,
        rating,
      });
    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      // Use default data if API fails
      setProfile({
        fullName: 'Mike Johnson',
        email: 'mike.johnson@codexpress.com',
        phone: '+1 (555) 987-6543',
        vehicleType: 'Honda CBR 250R',
        vehicleNumber: 'ABC-123',
        rating: 4.9,
        totalDeliveries: 156,
      });
      setPerformance({
        deliveries: 156,
        onTimeRate: 98,
        rating: 4.9,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData])
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authApi.logout();
            const parent = navigation.getParent();
            if (parent) {
              parent.replace('RoleSelection');
            }
          },
        },
      ]
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'R';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRiderId = (userId: string) => {
    if (!userId) return 'RID-001';
    // Generate a readable ID from user ID
    return `RID-${userId.substring(0, 3).toUpperCase()}`;
  };

  const menuItems = [
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      color: '#9C27B0',
      screen: 'NotificationSettings',
    },
    {
      icon: 'car-outline',
      label: 'Vehicle Information',
      color: '#2196F3',
      screen: 'VehicleInformation',
    },
    {
      icon: 'location-outline',
      label: 'Working Areas',
      color: '#4CAF50',
      screen: 'WorkingAreas',
    },
    {
      icon: 'lock-closed-outline',
      label: 'Privacy & Security',
      color: '#FF9800',
      screen: 'PrivacySecurity',
    },
    {
      icon: 'document-text-outline',
      label: 'Terms & Privacy Policy',
      color: '#E91E63',
      screen: 'Terms',
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      color: '#2196F3',
      screen: 'HelpCenter',
    },
  ];

  const handleMenuItemPress = (screen: string) => {
    const parent = navigation.getParent();
    if (!parent) return;

    switch (screen) {
      case 'NotificationSettings':
        parent.navigate('Notifications');
        break;
      case 'VehicleInformation':
        parent.navigate('ComingSoon', {
          featureName: 'Vehicle Information',
          description: 'Manage your vehicle details and documents.',
        });
        break;
      case 'WorkingAreas':
        parent.navigate('ComingSoon', {
          featureName: 'Working Areas',
          description: 'Set your preferred delivery areas.',
        });
        break;
      case 'PrivacySecurity':
        parent.navigate('PrivacySecurity');
        break;
      case 'Terms':
        parent.navigate('Terms');
        break;
      case 'HelpCenter':
        parent.navigate('HelpCenter');
        break;
      default:
        parent.navigate('ComingSoon', {
          featureName: screen,
          description: 'This feature is coming soon!',
        });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const initials = getInitials(profile?.fullName || 'Rider');
  const riderId = getRiderId(profile?.id || '');
  const rating = parseFloat(profile?.rating || 0);
  const reviews = profile?.totalDeliveries || 0;

  return (
    <View style={styles.container}>
      {/* Green Header */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Account</Text>
        <Text style={styles.headerSubtitle}>Manage your profile & settings</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.fullName || 'Rider'}</Text>
              <Text style={styles.riderId}>Rider ID: {riderId}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFC107" />
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)} ({reviews} reviews)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={18} color={colors.textLight} />
              <Text style={styles.contactText}>{profile?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={18} color={colors.textLight} />
              <Text style={styles.contactText}>{profile?.email || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="car-outline" size={18} color={colors.textLight} />
              <Text style={styles.contactText}>
                {profile?.vehicleType || 'N/A'} · {profile?.vehicleNumber || 'N/A'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => {
              const parent = navigation.getParent();
              if (parent) {
                parent.navigate('EditProfile');
              }
            }}
          >
            <LinearGradient
              colors={['#4CAF50', '#66BB6A']}
              style={styles.editProfileButtonGradient}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Performance Section */}
        <View style={styles.performanceCard}>
          <Text style={styles.performanceTitle}>This Month's Performance</Text>
          <View style={styles.performanceStats}>
            <View style={styles.performanceStatBox}>
              <Text style={styles.performanceStatValue}>{performance.deliveries}</Text>
              <Text style={styles.performanceStatLabel}>Deliveries</Text>
            </View>
            <View style={styles.performanceStatBox}>
              <Text style={styles.performanceStatValue}>{performance.onTimeRate}%</Text>
              <Text style={styles.performanceStatLabel}>On-Time</Text>
            </View>
            <View style={styles.performanceStatBox}>
              <Text style={styles.performanceStatValue}>{performance.rating.toFixed(1)}</Text>
              <Text style={styles.performanceStatLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Navigation List */}
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuItemPress(item.screen)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutItem}
          onPress={handleLogout}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
            </View>
            <Text style={[styles.menuItemLabel, { color: colors.error }]}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CodExpress v1.0.0</Text>
          <Text style={styles.footerText}>© 2025 CodExpress. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: -spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  riderId: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  contactInfo: {
    marginBottom: spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
  },
  editProfileButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  editProfileButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  performanceCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  performanceTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  performanceStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  performanceStatBox: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  performanceStatValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: '#4CAF50',
    marginBottom: spacing.xs,
  },
  performanceStatLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  logoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
});
