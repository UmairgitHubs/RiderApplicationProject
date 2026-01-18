# COD Express Admin Dashboard

Web-based admin dashboard for managing COD Express merchant and rider applications.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Backend API running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3001](http://localhost:3001) in your browser

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   └── contexts/         # React contexts
├── public/               # Static assets
└── package.json
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Real-time:** Socket.io Client

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Authentication

Admin users can log in with credentials:
- Email: admin@codexpress.com
- Password: (set in backend)

## 📚 Features

- ✅ User Management (Merchants & Riders)
- ✅ Shipment Management
- ✅ Hub Management
- ✅ Analytics & Reports
- ✅ Real-time Monitoring
- ✅ System Settings

---

Built with ❤️ for COD Express



