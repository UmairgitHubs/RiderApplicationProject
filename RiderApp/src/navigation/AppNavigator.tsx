import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authApi } from "../services/api";
import { colors } from "../theme";

// Import auth screens
import SplashScreen from "../screens/auth/SplashScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import RoleSelectionScreen from "../screens/auth/RoleSelectionScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import VerifyOTPScreen from "../screens/auth/VerifyOTPScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

// Import app screens
import MerchantHome from "../screens/merchant/MerchantHome";
import NotificationsWrapper from "../screens/common/NotificationsWrapper";
import ShipmentDetailsScreen from "../screens/merchant/ShipmentDetailsScreen";
import CreateShipmentScreen from "../screens/merchant/CreateShipmentScreen";
import ShipmentSuccessScreen from "../screens/merchant/ShipmentSuccessScreen";
import ProfileScreen from "../screens/merchant/ProfileScreen";
import WalletScreen from "../screens/merchant/WalletScreen";
import ShipmentsListScreen from "../screens/merchant/ShipmentsListScreen";
import DeliveredOrdersScreen from "../screens/merchant/DeliveredOrdersScreen";
import EditProfileWrapper from "../screens/common/EditProfileWrapper";
import HelpCenterScreen from "../screens/merchant/HelpCenterScreen";
import TermsConditionsScreen from "../screens/merchant/TermsConditionsScreen";
import PrivacyPolicyScreen from "../screens/merchant/PrivacyPolicyScreen";
import PrivacySecurityScreen from "../screens/merchant/PrivacySecurityScreen";
import ManageAddressesScreen from "../screens/merchant/ManageAddressesScreen";
import AddAddressScreen from "../screens/merchant/AddAddressScreen";
import EditAddressScreen from "../screens/merchant/EditAddressScreen";
import PaymentMethodsScreen from "../screens/merchant/PaymentMethodsScreen";
import RiderDashboard from "../screens/rider/RiderDashboard";
import AvailableOrdersScreen from "../screens/rider/AvailableOrdersScreen";
import RiderOrderDetailsScreen from "../screens/rider/RiderOrderDetailsScreen";
import RiderEarningsScreen from "../screens/rider/RiderEarningsScreen";
import RiderOrderHistoryScreen from "../screens/rider/RiderOrderHistoryScreen";
import RiderProfileScreen from "../screens/rider/RiderProfileScreen";
import PerformanceStatsScreen from "../screens/rider/PerformanceStatsScreen";
import RouteScreen from "../screens/rider/RouteScreen";
import RoutePlanningScreen from "../screens/rider/RoutePlanningScreen";
import AboutScreen from "../screens/common/AboutScreen";
import NotificationSettingsScreen from '../screens/common/NotificationSettingsScreen';
import ComingSoonScreen from "../screens/common/ComingSoonScreen";
import LanguageSettingsScreen from "../screens/common/LanguageSettingsScreen";
import ChatSupportScreen from "../screens/common/ChatSupportScreen";
import MapSelectionScreen from "../screens/common/MapSelectionScreen";
import DarkModeScreen from "../screens/common/DarkModeScreen";
import SelectionScreen from "../screens/common/SelectionScreen";
import FormScreen from "../screens/common/FormScreen";
import ChatScreen from "../screens/common/ChatScreen";
import ShipmentTrackingScreen from "../screens/merchant/ShipmentTrackingScreen";

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: { userType?: "merchant" | "rider" } | undefined;
  SignUp: { role?: "merchant" | "rider" } | undefined;
  ForgotPassword: undefined;
  VerifyOTP: { email: string } | undefined;
  ResetPassword: { email: string; code: string } | undefined;
  MerchantApp: undefined;
  Notifications: undefined;
  ShipmentDetails:
    | { trackingId?: string; shipmentId?: string; id?: string }
    | undefined;
  ShipmentTracking: { shipmentId: string } | undefined;
  CreateShipment: { shipmentType?: "franchise" | "individual" } | undefined;
  ShipmentSuccess:
    | { trackingNumber: string; shipmentType: "franchise" | "individual" }
    | undefined;
  ShipmentsList: { initialFilter?: string } | undefined;
  DeliveredOrders: undefined;
  EditProfile: undefined;
  HelpCenter: undefined;
  Terms: undefined;
  Privacy: undefined;
  PrivacySecurity: undefined;
  ManageAddresses: undefined;
  AddAddress: undefined;
  EditAddress: { address: any } | undefined;
  PaymentMethods: undefined;
  AvailableOrders: undefined;
  RiderOrderDetails: { orderId: string } | undefined;
  RiderOrderHistory: undefined;
  PerformanceStats: undefined;
  About: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  ChatSupport: undefined;
  MapSelection:
    | {
        title?: string;
        onLocationSelect?: (location: any) => void;
        initialLocation?: any;
      }
    | undefined;
  DarkMode: undefined;
  Selection: {
    title: string;
    subtitle?: string;
    options: any[];
    type: "single" | "multiple";
    selectedValues?: any[];
    onSelect: (values: any[]) => void;
    buttonText?: string;
  };
  Form: {
    title: string;
    subtitle?: string;
    fields: any[];
    onSubmit: (data: Record<string, any>) => void;
    buttonText?: string;
  };
  ComingSoon: { featureName?: string; description?: string } | undefined;
  Chat: { recipientName: string; recipientRole: string; shipmentId?: string } | undefined;
  RiderApp: undefined;
  RoutePlanning: { routeType?: "urgent" | "nextDay" } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<"merchant" | "rider" | null>(null);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authApi.isAuthenticated();
      if (authenticated) {
        const user = await authApi.getStoredUser();
        setUserRole(user?.role?.toLowerCase() || null);
      }
      setIsAuthenticated(authenticated);

      // Check if user has seen onboarding (you can store this in AsyncStorage)
      // For now, defaulting to false
      setHasSeenOnboarding(false);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Determine initial route
  let initialRoute: keyof RootStackParamList = "Splash";
  if (isAuthenticated && userRole) {
    initialRoute = userRole === "merchant" ? "MerchantApp" : "RiderApp";
  } else if (hasSeenOnboarding) {
    initialRoute = "RoleSelection";
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        <Stack.Screen name="MerchantApp" component={MerchantNavigator} />
        <Stack.Screen name="Notifications" component={NotificationsWrapper} />
        <Stack.Screen
          name="ShipmentDetails"
          component={ShipmentDetailsScreen}
        />
        <Stack.Screen name="CreateShipment" component={CreateShipmentScreen} />
        <Stack.Screen
          name="ShipmentSuccess"
          component={ShipmentSuccessScreen}
        />
        <Stack.Screen name="ShipmentsList" component={ShipmentsListScreen} />
        <Stack.Screen
          name="DeliveredOrders"
          component={DeliveredOrdersScreen}
        />
        <Stack.Screen name="EditProfile" component={EditProfileWrapper} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="Terms" component={TermsConditionsScreen} />
        <Stack.Screen name="Privacy" component={PrivacyPolicyScreen} />
        <Stack.Screen
          name="PrivacySecurity"
          component={PrivacySecurityScreen}
        />
        <Stack.Screen
          name="ManageAddresses"
          component={ManageAddressesScreen}
        />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="EditAddress" component={EditAddressScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen
          name="AvailableOrders"
          component={AvailableOrdersScreen}
        />
        <Stack.Screen
          name="RiderOrderDetails"
          component={RiderOrderDetailsScreen}
        />
        <Stack.Screen
          name="RiderOrderHistory"
          component={RiderOrderHistoryScreen}
        />
        <Stack.Screen
          name="PerformanceStats"
          component={PerformanceStatsScreen}
        />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen
          name="NotificationSettings"
          component={NotificationSettingsScreen}
        />
        <Stack.Screen
          name="LanguageSettings"
          component={LanguageSettingsScreen}
        />
        <Stack.Screen name="ChatSupport" component={ChatSupportScreen} />
        <Stack.Screen name="MapSelection" component={MapSelectionScreen} />
        <Stack.Screen name="DarkMode" component={DarkModeScreen} />
        <Stack.Screen name="Selection" component={SelectionScreen} />
        <Stack.Screen name="Form" component={FormScreen} />
        <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
        <Stack.Screen name="RiderApp" component={RiderNavigator} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ShipmentTracking" component={ShipmentTrackingScreen} />
        <Stack.Screen name="RoutePlanning" component={RoutePlanningScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Merchant Navigation
const MerchantTab = createBottomTabNavigator();

function MerchantNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <MerchantTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Shipments") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Wallet") {
            iconName = focused ? "wallet" : "wallet-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-outline";
          }

          // @ts-ignore
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      })}
    >
      <MerchantTab.Screen name="Home" component={MerchantHome} />
      <MerchantTab.Screen name="Shipments" component={ShipmentsListScreen} />
      <MerchantTab.Screen name="Wallet" component={WalletScreen} />
      <MerchantTab.Screen name="Profile" component={ProfileScreen} />
    </MerchantTab.Navigator>
  );
}

// Rider Navigation
const RiderTab = createBottomTabNavigator();

function RiderNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <RiderTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#FF6B00",
        tabBarInactiveTintColor: "#757575",
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Deliveries") {
            iconName = focused ? "cube" : "cube-outline";
          } else if (route.name === "Route") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "Earnings") {
            iconName = focused ? "cash" : "cash-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          } else {
            iconName = "help-outline";
          }

          // @ts-ignore
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 4,
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
        },
      })}
    >
      <RiderTab.Screen name="Home" component={RiderDashboard} />
      <RiderTab.Screen name="Deliveries" component={AvailableOrdersScreen} />
      <RiderTab.Screen name="Route" component={RouteScreen} />
      <RiderTab.Screen name="Earnings" component={RiderEarningsScreen} />
      <RiderTab.Screen name="Account" component={RiderProfileScreen} />
    </RiderTab.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
  },
});
