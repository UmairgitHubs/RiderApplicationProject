# Project Structure and Codebase Index

This document provides a comprehensive overview of the **RiderApp** monorepo structure, linking to specific sub-project indices where available.

## 📂 Root Directory Structure (`d:\Zimli-Work\RiderApp`)

The codebase is divided into two primary logical units:

| Directory | Type | Description |
| :--- | :--- | :--- |
| **`backend/`** | **Node.js API** | The REST API server built with Express and Prisma. |
| **`RiderApp/`** | **Mobile App** | The React Native (Expo) mobile application for Riders and Merchants. |
| **`RiderApp/admin-dashboard/`** | **Web App** | The Next.js Admin Dashboard (nested within the mobile directory). |

---

## 🏗️ 1. Backend (`backend/`)

- **Tech Stack**: Node.js, Express, TypeScript, Prisma, PostgreSQL.
- **Detailed Index**: [BACKEND_INDEX.md](./backend/BACKEND_INDEX.md)

**Key Folders**:
- `src/controllers/`: Request handling logic.
- `src/services/`: Business logic.
- `src/routes/`: API endpoint definitions.
- `prisma/`: Database schema and migrations.

---

## 📱 2. Mobile Application (`RiderApp/`)

- **Tech Stack**: React Native, Expo, TypeScript.
- **Entry Point**: `App.tsx`

**Source Structure (`src/`)**:

### **Navigation (`src/navigation/`)**
- `AppNavigator.tsx`: Main navigation mesh combining Auth, Merchant, and Rider stacks.

### **Screens (`src/screens/`)**
Contains the UI views for the application, organized by user role:
- **`auth/`**: Authentication Screens (Login, Register, OTP).
- **`merchant/`**: Merchant functionality (Shipment creation, Dashboard, Wallet).
- **`rider/`**: Rider functionality (Order acceptance, delivery tracking, Map).
- **`common/`**: Shared screens (Settings, Profile, Support).

### **Components (`src/components/`)**
Reusable UI blocks shared across screens.

### **Contexts (`src/contexts/`)**
React Context providers for global state management (e.g., AuthContext).

---

## 🖥️ 3. Admin Dashboard (`RiderApp/admin-dashboard/`)

- **Tech Stack**: Next.js 14 (App Router), Tailwind CSS.
- **Detailed Index**: [FRONTEND_INDEX.md](./RiderApp/admin-dashboard/FRONTEND_INDEX.md)

**Key Folders**:
- `src/app/`: App Router pages (Dashboard, Merchants, Shipments, etc.).
- `src/components/`: Reusable React components.
- `src/hooks/`: Custom hooks for data fetching (using React Query).
- `src/lib/`: Utilities and API configuration.

---

## 🔄 Shared Resources

- **Prisma Schema**: The source of truth for data models is located in `backend/prisma/schema.prisma`.
- **Assets**: Shared assets (images/fonts) are primarily located in `RiderApp/assets`.

---
*Last Updated: 2026-01-10*
