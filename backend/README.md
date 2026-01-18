# COD Express Backend API

Backend API for COD Express delivery management system.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your database URL and other configurations.

3. **Set up database:**
   ```bash
   # Generate Prisma Client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/       # Business logic
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   └── schema.prisma    # Database schema
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `POST /api/v1/auth/reset-password` - Reset password

### Health Check
- `GET /health` - Server health status

## 🔌 WebSocket Events

### Client → Server
- `rider:location-update` - Update rider location
- `shipment:status-update` - Update shipment status

### Server → Client
- `shipment:location-update` - Real-time location updates
- `shipment:status-update` - Status change notifications

## 🗄️ Database

This project uses Prisma ORM with PostgreSQL.

### Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🧪 Testing

```bash
# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "role": "merchant"
  }'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Documentation

- See `BACKEND_IMPLEMENTATION_GUIDE.md` for detailed implementation guide
- See `API_ENDPOINTS_REFERENCE.md` for complete API reference

## 🛠️ Development

```bash
# Development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📦 Next Steps

1. ✅ Authentication system (DONE)
2. ⏳ Shipment management APIs
3. ⏳ Rider APIs
4. ⏳ Wallet & Payment integration
5. ⏳ Real-time tracking
6. ⏳ Push notifications
7. ⏳ Email/SMS notifications

## 👥 Contributors

Developed by Zimli Tech (www.zimlitech.com)


