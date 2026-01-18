import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { useNavigation, CommonActions } from "@react-navigation/native";

export default function HelpCenterScreen() {
  const navigation = useNavigation<any>();

  const quickActions = [
    {
      icon: "chatbubble-ellipses",
      label: "Live Chat",
      subtitle: "Chat with support agent",
      color: "#4CAF50", // Green
      backgroundColor: "#E8F5E9", // Light green
      onPress: () => {
        console.log("Live Chat button pressed");
        // Get the root navigator - HelpCenter is in root Stack, so parent should be root
        const rootNavigator = navigation.getParent() || navigation;

        try {
          // Navigate to ChatSupport screen
          if (rootNavigator && typeof rootNavigator.navigate === "function") {
            console.log("Navigating to ChatSupport");
            rootNavigator.navigate("ChatSupport" as never);
          } else {
            // Fallback: use CommonActions
            console.log("Using CommonActions fallback");
            navigation.dispatch(
              CommonActions.navigate({
                name: "ChatSupport",
              })
            );
          }
        } catch (error: any) {
          console.error("Navigation error:", error);
          // Last resort: try with CommonActions
          navigation.dispatch(
            CommonActions.navigate({
              name: "ChatSupport",
            })
          );
        }
      },
    },
    {
      icon: "help-circle",
      label: "FAQs",
      subtitle: "Find answers quickly",
      color: "#2196F3", // Blue
      backgroundColor: "#E3F2FD", // Light blue
      onPress: () => {
        // Navigate to FAQs section or scroll to it
        // For now, we'll just show a message
        console.log("FAQs pressed");
      },
    },
    {
      icon: "mail",
      label: "Email Support",
      subtitle: "We'll reply in 24 hours",
      color: "#FF6B00", // Orange
      backgroundColor: "#FFF3E0", // Light orange
      onPress: () => Linking.openURL("mailto:support@codexpress.com"),
    },
  ];

  const handlePhonePress = () => {
    Linking.openURL("tel:+18001234567");
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@codexpress.com");
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

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Help & Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quickActionItem,
                { backgroundColor: action.backgroundColor },
              ]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickActionIconContainer,
                  { backgroundColor: action.color + "20" },
                ]}
              >
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <View style={styles.quickActionTextContainer}>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
                <Text style={styles.quickActionSubtitle}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Information Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          {/* Phone */}
          <View style={styles.contactItem}>
            <View
              style={[
                styles.contactIconContainer,
                { backgroundColor: "#E8F5E9" },
              ]}
            >
              <Ionicons name="call" size={20} color="#4CAF50" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Phone</Text>
              <TouchableOpacity onPress={handlePhonePress}>
                <Text style={styles.contactValue}>+1 (800) 123-4567</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Email */}
          <View style={styles.contactItem}>
            <View
              style={[
                styles.contactIconContainer,
                { backgroundColor: "#E3F2FD" },
              ]}
            >
              <Ionicons name="mail" size={20} color="#2196F3" />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={styles.contactLabel}>Email</Text>
              <TouchableOpacity onPress={handleEmailPress}>
                <Text style={styles.contactValue}>support@codexpress.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Operating Hours Section */}
        <View style={[styles.card, styles.operatingHoursCard]}>
          <Text style={styles.operatingHoursTitle}>Operating Hours</Text>

          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Monday - Friday</Text>
            <Text style={styles.hoursTime}>8:00 AM - 10:00 PM</Text>
          </View>

          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Saturday</Text>
            <Text style={styles.hoursTime}>9:00 AM - 8:00 PM</Text>
          </View>

          <View style={styles.hoursRow}>
            <Text style={styles.hoursDay}>Sunday</Text>
            <Text style={styles.hoursTime}>10:00 AM - 6:00 PM</Text>
          </View>
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
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: spacing.lg,
    top: Platform.OS === "ios" ? 50 : 30,
    zIndex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  quickActionTextContainer: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  operatingHoursCard: {
    backgroundColor: colors.primary,
  },
  operatingHoursTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.md,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  hoursDay: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
  hoursTime: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    fontWeight: typography.fontWeight.medium,
  },
});
