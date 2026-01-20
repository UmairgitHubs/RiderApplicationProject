import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../../theme";
import { authApi } from "../../services/api";

export default function LoginScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get userType from route params (merchant or rider)
  const userType = route.params?.userType;

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return false;
    }
    if (!password) {
      Alert.alert("Validation Error", "Please enter your password.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login(
        email.trim().toLowerCase(),
        password
      );

      if (response.success) {
        if (response.data?.requiresTwoFactor) {
          // Navigate to OTP screen for 2FA
          navigation.navigate('VerifyOTP', { 
            email: email.trim().toLowerCase(),
            isLogin: true 
          });
          return;
        }

        if (response.data?.token) {
          // Navigate based on user role
          const userRole = response.data.user?.role?.toLowerCase();
          
          if (userRole === "merchant") {
            navigation.replace("MerchantApp");
          } else if (userRole === "rider") {
            navigation.replace("RiderApp");
          } else {
            Alert.alert("Error", `Unknown user role: ${userRole}. Please contact support.`);
          }
        }
      } else {
        Alert.alert(
          "Login Failed",
            response.error?.message ||
            "Invalid email or password. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to login. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 10, 20) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Orange Rounded Header */}
        <View style={styles.orangeHeader}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
            </TouchableOpacity>
          )}

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>{t("common.welcome")}</Text>
            <Text style={styles.subtitleText}>
              {userType === "rider"
                ? "Login as Rider"
                : userType === "merchant"
                ? "Login as Merchant"
                : t("auth.loginSubtitle")}
            </Text>
          </View>
        </View>

        {/* White Form Section */}
        <View style={styles.formSection}>
          {/* Email Input */}
          <Text style={styles.label}>{t("common.email")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>{t("common.password")}</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotPasswordText}>
              {t("common.forgotPassword")}
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              loading && styles.signInButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textWhite} />
            ) : (
              <Text style={styles.signInButtonText}>{t("common.login")}</Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>{t("auth.dontHaveAccount")} </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("SignUp", { role: userType || "merchant" })
              }
            >
              <Text style={styles.signUpLink}>{t("common.signup")}</Text>
            </TouchableOpacity>
          </View>

          {/* Terms & Conditions */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Terms")}>
              <Text style={styles.termsLink}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Privacy")}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  orangeHeader: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 30, // Reduced from 40
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    minHeight: 160, // Reduced from 200
  },
  backButton: {
    marginBottom: spacing.lg, // Increased back to lg for more space
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: spacing.md, // Increased back to md
    marginTop: spacing.sm, // Added top margin to move logo down
  },
  logo: {
    width: 80, // Reduced from 100
    height: 80, // Reduced from 100
    borderRadius: borderRadius.lg,
  },
  headerTextContainer: {
    marginTop: spacing.xs, // Reduced from sm
    alignItems: "center",
  },
  welcomeText: {
    fontSize: typography.fontSize["3xl"],
    fontWeight: typography.fontWeight.bold,
    color: colors.textWhite,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    fontSize: typography.fontSize.base,
    color: colors.textWhite,
    opacity: 0.9,
  },
  formSection: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, // Reduced from xl
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs, // Reduced from sm
    marginTop: spacing.sm, // Reduced from md
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundInput,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs, // Reduced from sm
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    marginTop: spacing.xs, // Reduced from sm
    marginBottom: spacing.sm, // Reduced from md
  },
  forgotPasswordText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg, // Increased from sm for more space above button
    marginBottom: spacing.md,
  },
  signInButtonText: {
    color: colors.textWhite,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm, // Reduced from lg
  },
  signUpText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  signUpLink: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  termsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    color: colors.text,
    textAlign: "center",
  },
  termsLink: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
