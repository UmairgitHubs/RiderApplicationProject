# Mobile Application Structure Index

This document provides a comprehensive overview of the mobile application structure (React Native/Expo) for the RiderApp.

## Project Structure (`src/`)

### 1. **Navigation (`navigation/`)**
- `AppNavigator.tsx`: Main navigation mesh combining Auth, Merchant, and Rider stacks.

### 2. **Screens (`screens/`)**
Organized by functional domain or role.

#### **Authentication (`auth/`)**
- `LoginScreen.tsx`
- `SignUpScreen.tsx`
- `VerifyOTPScreen.tsx`
- `ForgotPasswordScreen.tsx`
- `ResetPasswordScreen.tsx`
- `OnboardingScreen.tsx`
- `RoleSelectionScreen.tsx`
- `SplashScreen.tsx`

#### **Merchant Flow (`merchant/`)**
- `MerchantHome.tsx`: Dashboard for merchants.
- `CreateShipmentScreen.tsx`, `IndividualShipmentScreen.tsx`, `FranchiseShipmentScreen.tsx`.
- `ShipmentsListScreen.tsx`, `ShipmentTrackingScreen.tsx`, `ShipmentDetailsScreen.tsx`.
- `FranchiseTrackingScreen.tsx`, `FranchiseOrderDetailsScreen.tsx`.
- `WalletScreen.tsx`, `PaymentMethodsScreen.tsx`.
- `ManageAddressesScreen.tsx`, `AddAddressScreen.tsx`, `EditAddressScreen.tsx`.
- `ProfileScreen.tsx`, `EditProfileScreen.tsx`.
- `NotificationsScreen.tsx`, `PrivacyPolicyScreen.tsx`, `PrivacySecurityScreen.tsx`.
- `DeliveredOrdersScreen.tsx`, `HelpCenterScreen.tsx`, `TermsConditionsScreen.tsx`.
- `ShipmentSuccessScreen.tsx`, `ShipmentDetailsPopup.tsx`.

#### **Rider Flow (`rider/`)**
- `RiderDashboard.tsx`: Main dashboard for riders.
- `AvailableOrdersScreen.tsx`, `RiderOrderDetailsScreen.tsx`.
- `RiderOrderHistoryScreen.tsx`, `DeliveredOrdersScreen.tsx` (chk usage).
- `RiderEarningsScreen.tsx`, `PerformanceStatsScreen.tsx`.
- `RiderProfileScreen.tsx`, `RiderEditProfileScreen.tsx`.
- `RiderNotificationsScreen.tsx`.
- `RoutePlanningScreen.tsx`, `RouteScreen.tsx`.
- `RiderHome.tsx` (Entry).

#### **Common Screens (`common/`)**
- `AboutScreen.tsx`, `FAQScreen.tsx`.
- `ChatScreen.tsx`, `ChatSupportScreen.tsx`.
- `NotificationSettingsScreen.tsx`, `NotificationsWrapper.tsx`.
- `LanguageSettingsScreen.tsx`, `DarkModeScreen.tsx`.
- `MapSelectionScreen.tsx`.
- `ComingSoonScreen.tsx`, `FormScreen.tsx`, `SelectionScreen.tsx`.
- `EditProfileWrapper.tsx`.

### 3. **Components (`components/`)**
- High-level reusable UI components and specialized UI blocks.

### 4. **State & Data (`contexts/`, `hooks/`)**
- `AuthContext.tsx`: Manages authentication state and session tokens.
- `useAuth.ts`, `useSocket.ts`: Core hooks for logic.

### 5. **Theme & Styling (`theme/`)**
- `colors.ts`, `spacing.ts`, `typography.ts`, `index.ts`: Central design system.

### 6. **Localization (`i18n/`, `locales/`)**
- Multi-language support configuration and translation files.

### 7. **Services & Utilities (`services/`, `utils/`)**
- `api.ts`: Centralized API calls using Axios.
- `socket.ts`: Socket.io client configuration.
- `storage.ts`: AsyncStorage wrappers.
- `date-utils.ts`, `validation.ts`: Helper functions.

## Tech Stack
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Context / Hooks
- **Styling**: StyleSheet (Vanilla) + Design System
- **Icons**: Lucide React Native / Vector Icons
- **HTTP Client**: Axios
- **Real-time**: Socket.io-client
