# Backend Structure Index

This document provides a comprehensive overview of the backend structure, data models, and API endpoints for the RiderApp.

## Project Structure (`src/`)

### 1. **Core Configuration (`config/`)**
- `database.ts`: Database connection and configuration.
- `env.ts`: Environment variable validation and loading.

### 2. **Controllers (`controllers/`)**
Request handlers responsible for processing incoming requests and returning responses.
- **Admin**:
  - `admin.agent.controller.ts`: Agent management.
  - `admin.cms.controller.ts`: Content management.
  - `admin.controller.ts`: General admin operations.
  - `admin.hub.controller.ts`: Hub management.
  - `admin.merchant.controller.ts`: Merchant management.
  - `admin.payment.controller.ts`: Payment oversight.
  - `admin.rider.controller.ts`: Rider management.
  - `admin.route.controller.ts`: Route management.
  - `admin.shipment.controller.ts`: Shipment oversight.
  - `admin.support.controller.ts`: Support ticket management.
  - `admin.wallet.controller.ts`: Wallet/Transaction management.
- **Features**:
  - `analytics.controller.ts`: Dashboard analytics.
  - `auth.controller.ts`: Authentication (Login, Register, OTP).
  - `chat.controller.ts`: Shipment and support chat.
  - `notification.controller.ts`: Notifications handling.
  - `profile.controller.ts`: User profile management.
  - `rider.controller.ts`: Rider-specific operations.
  - `settings.controller.ts`: System settings.
  - `shipment.controller.ts`: Merchant shipment operations.
  - `support.controller.ts`: Support operations.
  - `voice.controller.ts`: Voice integration handling.
  - `wallet.controller.ts`: User wallet operations.

### 3. **Routes (`routes/`)**
API route definitions mapping URLs to controllers.
- `index.ts`: Main router entry point.
- **Admin Routes**:
  - `admin.routes.ts`
  - `admin.agent.routes.ts`
  - `admin.cms.routes.ts`
  - `admin.hub.routes.ts`
  - `admin.merchant.routes.ts`
  - `admin.payment.routes.ts`
  - `admin.rider.routes.ts`
  - `admin.route.routes.ts`
  - `admin.settings.routes.ts`
  - `admin.shipment.routes.ts`
  - `admin.support.routes.ts`
  - `admin.wallet.routes.ts`
- **Feature Routes**:
  - `analytics.routes.ts`
  - `auth.routes.ts`
  - `chat.routes.ts`
  - `notification.routes.ts`
  - `profile.routes.ts`
  - `rider.routes.ts`
  - `shipment.routes.ts`
  - `support.routes.ts`
  - `voice.routes.ts`
  - `wallet.routes.ts`
  - `cms.routes.ts`
  - `settings.routes.ts`

### 4. **Services (`services/`)**
Business logic and external service integrations.
- `activity.service.ts`: User activity logging.
- `email.service.ts`: Email sending (e.g., SMTP, SendGrid).
- `notification.service.ts`: In-app or push notifications.
- `settings.service.ts`: Management of application settings.
- `sms.service.ts`: SMS sending (e.g., Twilio).

### 5. **Middleware (`middleware/`)**
- `admin.middleware.ts`: Checks for admin role.
- `async.middleware.ts`: Wrapper for async error handling.
- `auth.middleware.ts`: JWT verification and user extraction.
- `error.middleware.ts`: Global error handler.
- `maintenance.middleware.ts`: Checks if system is in maintenance mode.
- `validation.middleware.ts`: Request data validation.

### 6. **Jobs & Background Tasks (`jobs/`)**
- `weeklyReport.job.ts`: Scheduled tasks for generating reports.

### 7. **WebSockets (`socket/`)**
- `socket.handler.ts`: Real-time event handling.

### 8. **Entry Points**
- `app.ts`: Express app configuration.
- `server.ts`: Server startup script.

## Database Models (Prisma)
Defined in `prisma/schema.prisma`.

- **User**: Core identity (Relations to Merchant, Rider, Agent).
- **Agent**: Sales/Referral agents.
- **Merchant**: Extended profile for merchants.
- **Rider**: Extended profile for riders (Linked to Hub).
- **Hub**: Operational centers.
- **Shipment**: Delivery orders/parcels.
- **Package**: Individual items within a shipment.
- **WalletTransaction**: Financial transaction records.
- **Payment**: Payment attempts and status.
- **Address**: User addresses.
- **Notification**: System notifications.
- **ChatMessage**: In-app messaging.
- **ActivityLog**: User audit trail.
- **Session**: User session management.
- **VerificationCode**: OTPs for auth/verification.
- **SystemSetting**: Global application configuration.

