import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { profileApi, authApi } from "../../services/api";

interface ProfileData {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  address?: string;
  city?: string;
  country?: string;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getProfile();
      if (response.success && response.data?.profile) {
        setProfile(response.data.profile);
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "M";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getMerchantId = (userId?: string) => {
    if (!userId) return "MER-001";
    return `MER-${userId.substring(0, 6).toUpperCase()}`;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "+1 (555) 123-4567";
    // Format phone number if needed
    return phone;
  };

  const formatAddress = () => {
    if (!profile) return "123 Broadway, New York, NY 10001";
    const parts = [];
    if (profile.address) parts.push(profile.address);
    if (profile.city) parts.push(profile.city);
    if (profile.country) parts.push(profile.country);
    return parts.length > 0
      ? parts.join(", ")
      : "123 Broadway, New York, NY 10001";
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "RoleSelection" }],
            });
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  const handleNavigation = (screen: string) => {
    const parent = navigation.getParent();
    if (!parent) return;

    switch (screen) {
      case "EditProfile":
        parent.navigate("EditProfile");
        break;
      case "DeliveredOrders":
        // Navigate to delivered orders screen
        parent.navigate("DeliveredOrders");
        break;
      case "Notifications":
        parent.navigate("NotificationSettings");
        break;
      case "PaymentMethods":
        parent.navigate("PaymentMethods");
        break;
      case "SavedAddresses":
        parent.navigate("ManageAddresses");
        break;
      case "PrivacySecurity":
        parent.navigate("PrivacySecurity");
        break;
      case "TermsPrivacy":
        parent.navigate("Terms");
        break;
      case "HelpSupport":
        parent.navigate("HelpCenter");
        break;
      default:
        parent.navigate("ComingSoon", {
          featureName: screen,
          description:
            "This feature is under development and will be available soon!",
        });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const businessName =
    profile?.businessName || profile?.fullName || "Tech Store NYC";
  const merchantId = getMerchantId(profile?.id);
  const phone = formatPhone(profile?.phone);
  const email = profile?.email || "contact@techstore.com";
  const address = formatAddress();

  return (
    <View style={styles.container}>
      {/* Orange Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
        <Text style={styles.headerSubtitle}>
          Manage your profile & settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Information Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(businessName)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.merchantId}>Merchant ID: {merchantId}</Text>
            </View>
          </View>

          {/* Contact Details */}
          <View style={styles.contactSection}>
            <View style={styles.contactItem}>
              <Ionicons
                name="call-outline"
                size={18}
                color={colors.textLight}
              />
              <Text style={styles.contactText}>{phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.textLight}
              />
              <Text style={styles.contactText}>{email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons
                name="business-outline"
                size={18}
                color={colors.textLight}
              />
              <Text style={styles.contactText}>{address}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleNavigation("EditProfile")}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Order Management Section */}
        <Text style={styles.sectionTitle}>Order Management</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleNavigation("DeliveredOrders")}
        >
          <View style={styles.menuItemLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}
            >
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={colors.success}
              />
            </View>
            <Text style={styles.menuItemLabel}>Delivered Orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("Notifications")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#F3E5F5" }]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#9C27B0"
                />
              </View>
              <Text style={styles.menuItemLabel}>Notifications</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("PaymentMethods")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}
              >
                <Ionicons name="card-outline" size={22} color="#2196F3" />
              </View>
              <Text style={styles.menuItemLabel}>Payment Methods</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("SavedAddresses")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#E3F2FD" }]}
              >
                <Ionicons name="location-outline" size={22} color="#2196F3" />
              </View>
              <Text style={styles.menuItemLabel}>Saved Addresses</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("PrivacySecurity")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#E8F5E9" }]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={colors.success}
                />
              </View>
              <Text style={styles.menuItemLabel}>Privacy & Security</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("TermsPrivacy")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#FFF9C4" }]}
              >
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color="#FBC02D"
                />
              </View>
              <Text style={styles.menuItemLabel}>Terms & Privacy Policy</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleNavigation("HelpSupport")}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#FFE0B2" }]}
              >
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.menuItemLabel}>Help & Support</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CodExpress v1.0.0</Text>
          <Text style={styles.footerText}>
            © 2025 CodExpress. All rights reserved.
          </Text>
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 160,
  },
  headerTitle: {
    fontSize: typography.fontSize["3xl"],
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
  },
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  merchantId: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  contactSection: {
    marginBottom: spacing.lg,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  contactText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginLeft: spacing.sm,
    flex: 1,
  },
  editButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  editButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textLight,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  menuItemLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.md,
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textLight,
    marginBottom: spacing.xs,
  },
});
