# Mobile Application Structure Index

This document provides a comprehensive overview of the mobile application structure (React Native/Expo) for the RiderApp.

## Project Structure (`src/`)

### 1. **Navigation (`navigation/`)**
- `AppNavigator.tsx`: Root navigator that orchestrates the entire application flow.
- `AuthStack.tsx`: Navigation flow for unauthenticated users (Login, Register, OTP).
- `MerchantStack.tsx`: Navigation for users with the 'Merchant' role.
- `RiderStack.tsx`: Navigation for users with the 'Rider' role.

### 2. **Screens (`screens/`)**
Organized by functional domain or role.

#### **Authentication (`auth/`)**
- `LoginScreen.tsx`
- `RegisterScreen.tsx`
- `OTPScreen.tsx`
- `ForgotPasswordScreen.tsx`
- `ResetPasswordScreen.tsx`

#### **Merchant Flow (`merchant/`)**
- `MerchantHome.tsx`: Dashboard for merchants.
- `CreateShipmentScreen.tsx`: Multi-step form for creating new shipments.
- `ShipmentsListScreen.tsx`: List of active and past shipments.
- `ShipmentTrackingScreen.tsx`: Detailed tracking and map view for a shipment.
- `WalletScreen.tsx`: Balance and transaction history for merchants.
- `ManageAddressesScreen.tsx`: Merchant pickups and delivery addresses.
- `IndividualShipmentScreen.tsx`, `FranchiseShipmentScreen.tsx`: Specialized shipment creation.

#### **Rider Flow (`rider/`)**
- `RiderHome.tsx`: Main screen for riders to see available orders.
- `OrderDetailsScreen.tsx`: Info about a specific delivery.
- `DeliveryProgressScreen.tsx`: Active delivery tracking and status updates.
- `RiderEarningsScreen.tsx`: Financial dashboard for riders.

#### **Common Screens (`common/`)**
- `ProfileScreen.tsx`: User profile overview.
- `EditProfileScreen.tsx`: Form to update user details.
- `SettingsScreen.tsx`: App-wide settings (Theme, Language, Notifications).
- `ChatScreen.tsx`: Direct messaging for shipment coordination.
- `ChatSupportScreen.tsx`: Customer support chat.
- `NotificationSettingsScreen.tsx`: Push notification preferences.
- `AboutScreen.tsx`, `PrivacyPolicyScreen.tsx`, `TermsConditionsScreen.tsx`.

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
