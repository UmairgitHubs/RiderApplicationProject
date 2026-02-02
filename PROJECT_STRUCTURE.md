# Project Structure and Codebase Index

This document provides a comprehensive overview of the **RiderApp** monorepo structure.

## 📂 Root Directory (`d:\Zimli-Work\RiderApp`)

For detailed indexing of specific sub-projects, please refer to:
- **[Backend Structure Index](backend/BACKEND_INDEX.md)**: Detailed API, Controller, and Service documentation.
- **[Mobile App Structure Index](RiderApp/MOBILE_INDEX.md)**: Navigation, Screens, and Hooks for the React Native app.
- **[Admin Dashboard Structure Index](RiderApp/admin-dashboard/FRONTEND_INDEX.md)**: Next.js pages, components, and integrations.

| Directory | Type | Description |
| :--- | :--- | :--- |
| **`backend/`** | **Node.js API** | Express/Prisma API server. |
| **`RiderApp/`** | **Mobile App** | React Native (Expo) app for Riders and Merchants. |
| **`RiderApp/admin-dashboard/`** | **Web App** | Next.js Admin Dashboard (nested within mobile dir). |

---

## 🏗️ 1. Backend (`backend/`)

**Path**: `d:\Zimli-Work\RiderApp\backend`

### **`src/controllers/`**
Contains logic for handling API requests.
- **Admin**: 
  - `admin.controller.ts` (General Admin)
  - `admin.agent.controller.ts`, `admin.cms.controller.ts`, `admin.hub.controller.ts`, `admin.merchant.controller.ts`
  - `admin.payment.controller.ts`, `admin.rider.controller.ts`, `admin.route.controller.ts`, `admin.shipment.controller.ts`
  - `admin.support.controller.ts`, `admin.wallet.controller.ts`
- **Core**: 
  - `auth.controller.ts`, `shipment.controller.ts`, `rider.controller.ts`, `merchant.controller.ts`, `profile.controller.ts`
- **Features**: 
  - `chat.controller.ts`, `notification.controller.ts`, `analytics.controller.ts`, `voice.controller.ts`, `wallet.controller.ts`
  - `settings.controller.ts`, `support.controller.ts`

### **`src/routes/`**
API Endpoint definitions, matching controllers.
- `index.ts`: Main router entry point.
- **Admin routes**: `admin.agent.routes.ts`, `admin.cms.routes.ts`, `admin.hub.routes.ts`, `admin.merchant.routes.ts`, `admin.routes.ts`, `admin.shipment.routes.ts`...
- **Shared routes**: `auth.routes.ts`, `chat.routes.ts`, `shipment.routes.ts`, `wallet.routes.ts`, `profile.routes.ts`...

### **`src/services/`**
Business logic and external integrations.
- `notification.service.ts`: Handles Push, Email, SMS.
- `email.service.ts`, `sms.service.ts`, `twilio.service.ts`: Communication providers.
- `route.service.ts`: Route optimization logic.
- `firebase.service.ts`: Firebase integration.
- `activity.service.ts`, `settings.service.ts`.

### **`src/jobs/`**
Scheduled tasks.
- `weeklyReport.job.ts`: Generates weekly analytics.

### **`src/middleware/`**
Request processing middleware.
- `auth.middleware.ts`, `admin.middleware.ts`: Authentication/Authorization.
- `validation.middleware.ts`, `error.middleware.ts`, `async.middleware.ts`.

### **`src/`** root files
- `app.ts`: Express app setup.
- `server.ts`: Server entry point.
- `socket/`: Socket.io connection handling.

### **`prisma/`**
- `schema.prisma`: Database schema definition.

---

## 📱 2. Mobile Application (`RiderApp/`)

**Path**: `d:\Zimli-Work\RiderApp\RiderApp`

### **`src/screens/`**
- **`auth/`**: Authentication screens (Login, Register, OTP).
- **`merchant/`**: Merchant specific screens.
- **`rider/`**: Rider specific screens.
- **`common/`**: Shared screens like `ChatScreen`, `ProfileScreen`, `SupportScreen`.

### **`src/navigation/`**
- `AppNavigator.tsx`: Handles navigation logic between stacks.

### **`src/components/`**
Reusable UI components.
- `SafeView.tsx`, `SafeScrollView.tsx`

### **`src/hooks/`**
Custom React hooks for business logic.
- `useNotifications.ts`, `useNotificationSettings.ts`
- `useRiderDashboard.ts`, `useMerchantDashboard.ts`
- `useShipments.ts`, `useRoutePlanning.ts`
- `useVehicle.ts`, `useWorkingAreas.ts`

### **`src/contexts/`**
React Contexts for global state.
- `LanguageContext.tsx`: Localization state.
- `ThemeContext.tsx`: Theme management.

### **`src/i18n/`**
Internationalization configuration.
- `config.ts`, `locales/` (en, ur).

---

## 🖥️ 3. Admin Dashboard (`RiderApp/admin-dashboard/`)

**Path**: `d:\Zimli-Work\RiderApp\RiderApp\admin-dashboard`

### **`src/app/`** (Next.js App Router)

#### **Authentication & Public**
- `login/`, `forgot-password/`, `reset-password/`
- `verify-2fa/`, `verify-otp/`

#### **`(dashboard)` Protected Routes**
- `dashboard/`: Analytics overview.
- `agents/`: Support agents.
- `cms/`: Content management.
- `hubs/`: Hub management (List & Details).
- `merchants/`: Merchant management.
  - `[id]/orders/`: Merchant specific orders.
- `riders/`: Rider management.
- `shipments/`: Shipment tracking.
- `routes/`: Route planning and management.
- `wallets/`: Wallet management.
- `payments/`: Payment management.
- `support/`: Support tickets.
- `reports/`: Analytics reports.
- `settings/`: Platform settings.
- `profile/`: User profile.

### **`src/components/`**
Component library organized by feature.
- `ui/`: Shared UI primitives (buttons, inputs, cards).
- `layout/`: Sidebar, Header, Layout wrappers.
- **Feature Components**:
  - `agents/`, `cms/`, `dashboard/`, `hubs/`
  - `merchants/`, `payments/`, `profile/`, `reports/`
  - `riders/`, `routes/`, `shipments/`, `support/`, `wallets/`

### **`src/lib/`**
- `api/`: Frontend API clients connecting to backend endpoints.

---

*Last Updated: 2026-02-02*
