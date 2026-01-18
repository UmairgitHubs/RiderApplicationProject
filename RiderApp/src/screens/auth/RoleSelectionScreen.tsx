import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing, borderRadius } from "../../theme";

export default function RoleSelectionScreen({ navigation }: any) {
  const handleMerchantPress = () => {
    navigation.navigate("Login", { userType: "merchant" });
  };

  const handleRiderPress = () => {
    navigation.navigate("Login", { userType: "rider" });
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoIconContainer}>
          <Ionicons name="cube" size={60} color={colors.textWhite} />
        </View>
        <Text style={styles.appName}>CodExpress</Text>
        <Text style={styles.tagline}>Fast. Reliable. Delivered.</Text>
      </View>

      {/* Role Selection Buttons */}
      <View style={styles.roleSection}>
        {/* Merchant Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={handleMerchantPress}
        >
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="storefront" size={24} color={colors.textWhite} />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Merchant</Text>
            <Text style={styles.roleSubtitle}>Manage business shipments</Text>
          </View>
        </TouchableOpacity>

        {/* Rider Button */}
        <TouchableOpacity style={styles.roleButton} onPress={handleRiderPress}>
          <View
            style={[
              styles.roleIconContainer,
              { backgroundColor: colors.success },
            ]}
          >
            <Ionicons name="bicycle" size={24} color={colors.textWhite} />
          </View>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleTitle}>Rider</Text>
            <Text style={styles.roleSubtitle}>Deliver & earn money</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoSection: {
    alignItems: "center",
    flex: 0.8,
    justifyContent: "center",
  },
  logoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appName: {
    fontSize: typography.fontSize["4xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  roleSection: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  roleButton: {
    backgroundColor: colors.textWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  roleSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
});
