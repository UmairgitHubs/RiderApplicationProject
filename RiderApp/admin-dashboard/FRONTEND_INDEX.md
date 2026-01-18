# Frontend Structure Index

This document provides a comprehensive overview of the frontend structure, components, and pages for the RiderApp Admin Dashboard.

## Project Structure (`src/`)

### 1. **Application Routes (`app/`)**
Built using Next.js App Router (v14+).

- **`(dashboard)`**: Main authenticated layout routes.
  - `agents/`: Agent management pages.
  - `cms/`: Content Management System pages.
  - `dashboard/`: Main analytics dashboard.
  - `hubs/`: Hub management pages.
  - `merchants/`: Merchant and order management.
  - `payments/`: Payment processing and history.
  - `profile/`: User profile settings and activity.
  - `reports/`: System reports and analytics.
  - `riders/`: Rider management.
  - `routes/`: Route planning and map views.
  - `settings/`: Global system settings.
  - `shipments/`: Shipment tracking and management.
  - `support/`: Customer support tickets.
  - `wallets/`: Financial wallet management.
- **Auth Routes**:
  - `login/`: Sign in page.
  - `forgot-password/`: Password recovery.
  - `verify-otp/`: 2FA/OTP verification.
  - `reset-password/`: Set new password.
  - `verify-2fa/`: Secondary verification.

### 2. **Components (`components/`)**
Modularized by feature domain.

#### **Feature Modules**
- **`agents/`**:
  - `AgentTable.tsx`: Main list view.
  - `AgentStats.tsx`, `AgentStatsCard.tsx`: Metrics display.
  - `AddAgentModal.tsx`, `AgentDetailsModal.tsx`: Management modals.
  - `AgentMobileCard.tsx`: Mobile view adaptation.
- **`cms/`**:
  - `CMSTable.tsx`: List of CMS content.
  - `CMSTabs.tsx`: Tab navigation for CMS sections.
  - `CMSModal.tsx`, `CMSViewModal.tsx`: Create/Edit/View modals.
  - `CMSMobileCard.tsx`, `CMSStatsCard.tsx`: Mobile and stats views.
- **`hubs/`**:
  - `HubCard.tsx`: Grid view item.
  - `AddHubModal.tsx`, `EditHubModal.tsx`, `DeleteHubModal.tsx`.
  - `HubStats.tsx`.
- **`merchants/`**:
  - `AddMerchantModal.tsx`, `EditMerchantModal.tsx`.
  - `MerchantDetailsModal.tsx`: Comprehensive merchant view.
  - `ExportMerchantsModal.tsx`, `GenerateMerchantReportModal.tsx`.
- **`payments/`**:
  - Payment processing and history components.
- **`profile/`**:
  - `ProfileHeader.tsx`.
  - `PersonalInfoForm.tsx`.
  - `ProfileSecurity.tsx` (Password/2FA).
  - `ProfilePreferences.tsx` (Notifications/Theme).
  - `ProfileActivityLog.tsx`.
- **`reports/`**:
  - Reporting charts and data visualizations.
- **`riders/`**:
  - Rider lists, stats, and management modals.
- **`routes/`**:
  - Maps and route optimization visualizers.
- **`settings/`**:
  - System configuration forms.
- **`shipments/`**:
  - `ShipmentTable.tsx`.
  - Shipment details and tracking components.
- **`support/`**:
  - `SupportTable.tsx`: Ticket list view.
  - `CreateTicketModal.tsx`, `TicketDetailsModal.tsx`: Management modals.
  - `SupportStatsCard.tsx`, `SupportMobileCard.tsx`.
- **`wallets/`**:
  - Wallet balance and transaction history.

#### **Core & UI**
- **`layout/`**:
  - `Sidebar.tsx`: Main navigation.
  - `Header.tsx`: Top bar and user menu.
- **`ui/`**: Reusable base components (buttons, inputs, cards).
- **`common/`**:
  - `ConfirmationModal.tsx`: Generic action confirmation.

### 3. **State & Logic (`hooks/`)**
Custom React hooks.
- `useAnalytics.ts`: Dashboard data.
- `useHubs.ts`, `useMerchants.ts`, `useRiders.ts`: Domain data fetching.
- `useProfile.ts`: User profile and activity logs.
- `useSettings.ts`: App configuration.
- `useShipments.ts`: Tracking and shipment data.
- `use-debounce.ts`: Input performance optimization.

### 4. **API Integration (`lib/`)**
- `api/`: Domain-specific API definitions.
  - `analytics.ts`, `auth.ts`
  - `hubs.ts`, `merchants.ts`, `riders.ts`
  - `payments.ts`, `wallet.ts`
  - `profile.ts`, `settings.ts`
  - `shipments.ts`, `users.ts`
- `client.ts`: Central Axios configuration with interceptors.
- `auth.ts`: Authentication helpers (Cookies/Local Storage).
- `utils.ts`: General utility functions.

### 5. **Type Definitions (`types/`)**
TypeScript interfaces and types.
- `agent.ts`, `merchant.ts`, `rider.ts`: user types.
- `hub.ts`, `shipment.ts`, `route.ts`: core entity types.
- `payment.ts`, `wallet.ts`: financial types.
- `profile.ts`: User profile and activity log structures.
- `cms.ts`, `report.ts`, `support.ts`.

## Tech Stack
- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **State/Data**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Forms**: React Hook Form (likely)
- **Validation**: Zod (likely)

