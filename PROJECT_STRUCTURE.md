# Project Structure and Codebase Index

This document provides a comprehensive overview of the **RiderApp** monorepo structure.

## 📂 Root Directory (`d:\Zimli-Work\RiderApp`)

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
- **Admin**: `admin.agent.controller.ts`, `admin.cms.controller.ts`, `admin.hub.controller.ts`, `admin.merchant.controller.ts`, `admin.payment.controller.ts`, `admin.rider.controller.ts`, `admin.route.controller.ts`, `admin.shipment.controller.ts`, `admin.support.controller.ts`, `admin.wallet.controller.ts`.
- **Core**: `auth.controller.ts`, `shipment.controller.ts`, `rider.controller.ts`, `merchant.controller.ts`.
- **Features**: `chat.controller.ts`, `notification.controller.ts`, `analytics.controller.ts`, `profile.controller.ts`, `wallet.controller.ts`.

### **`src/routes/`**
API Endpoint definitions, matching controllers.
- `index.ts`: Main router entry point.
- Admin routes: `admin.*.routes.ts`.
- shared routes: `auth.routes.ts`, `chat.routes.ts`, `shipment.routes.ts`.

### **`src/`** root files
- `app.ts`: Express app setup.
- `server.ts`: Server entry point.
- `socket/`: Socket.io connection handling.

---

## 📱 2. Mobile Application (`RiderApp/`)

**Path**: `d:\Zimli-Work\RiderApp\RiderApp`

### **`src/screens/`**
- **`auth/`**: Authentication screens (Login, Register, OTP).
- **`merchant/`**: Merchant-specific dashboards and tools.
- **`rider/`**: Rider-specific dashboards, Map views, Order requests.
- **`common/`**: `ChatScreen`, `ProfileScreen`, `SupportScreen`, etc.

### **`src/navigation/`**
- `AppNavigator.tsx`: Handles navigation logic between Auth, Merchant, and Rider stacks.

### **`src/components/`**
Reusable UI components.

---

## 🖥️ 3. Admin Dashboard (`RiderApp/admin-dashboard/`)

**Path**: `d:\Zimli-Work\RiderApp\RiderApp\admin-dashboard`

### **`src/app/(dashboard)/`** (Protected Routes)
The main admin interface structure:
- `dashboard/`: Main overview.
- `agents/`: Manage support agents.
- `merchants/`: Manage merchants.
- `riders/`: Manage riders.
- `shipments/`: Shipment tracking and management.
- `hubs/`: Hub management.
- `routes/`: Route management.
- `wallets/`: Financial management.
- `payments/`: Payment history.
- `cms/`: Content management.
- `support/`: Support tickets and chat.
- `reports/`: Analytics and reports.
- `settings/`: System settings.

### **`src/lib/`**
- `api/`: Frontend API clients.

---

*Last Updated: 2026-01-24*
