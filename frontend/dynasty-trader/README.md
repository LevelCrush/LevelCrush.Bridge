# Dynasty Trader Frontend

A React-based Progressive Web App (PWA) for Dynasty Trader - a roguelike economy game where death drives markets and players build multi-generational trading empires.

## Features

### Core Functionality
- **Authentication**: JWT-based login/register with automatic token refresh
- **Dynasty Management**: Create and manage your trading empire across generations
- **Character System**: 
  - Create characters with randomized stats (health, stamina, charisma, intelligence, luck)
  - Characters start with 500-1000 gold in Capital City
  - Age and eventually die, passing wealth to heirs
  - Travel between 8 unique regions
- **Market Trading**:
  - Browse regional markets with different tax rates and prosperity levels
  - Buy and sell items with real-time price updates
  - Filter by category (Food, Equipment, Raw Material, Luxury, Textile)
  - View transaction history with profit/loss tracking
- **Inventory Management**: View items, sell to market, track values
- **Death & Inheritance System**:
  - Real-time death notifications with market impact
  - Detailed inheritance flow for your characters
  - Death tax calculations and heir distribution
  - Recent deaths tracking across all dynasties
- **Real-time Updates**: WebSocket integration for live market data and death notifications

### UI/UX Features
- **Modern Design**: Dark theme with Tailwind CSS
- **Responsive**: Mobile-first design that works on all devices
- **Progressive Web App**: Installable with offline support
- **Loading States**: Skeleton screens for smooth data loading
- **Animations**: Smooth transitions and micro-interactions
- **Data Visualization**: Interactive price charts using Recharts
- **Form Validation**: Real-time validation with field-level errors
- **Password Strength**: Visual indicator with security suggestions

## Tech Stack

- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **TanStack Query** for server state management
- **Zustand** for client state with persistence
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Hook Form** for form handling
- **Lucide Icons** for consistent iconography
- **Workbox** for PWA/service worker

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Dynasty Trader backend running on http://localhost:3113

### Installation

```bash
# Clone the repository if you haven't already
git clone https://github.com/yourusername/dynasty-trader.git
cd dynasty-trader/frontend/dynasty-trader

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env to set your backend URL (default: http://localhost:3113)

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Building for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview

# Build output will be in the dist/ directory
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ItemDetailsModal.tsx
│   ├── LoadingSkeleton.tsx
│   ├── MarketItemModal.tsx
│   ├── PriceChart.tsx
│   ├── SellItemModal.tsx
│   ├── TransactionHistory.tsx
│   └── TravelModal.tsx
├── contexts/          # React contexts
│   └── WebSocketContext.tsx
├── hooks/            # Custom React hooks
│   └── useWebSocket.ts
├── pages/            # Page components
│   ├── CharacterPage.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── MarketPage.tsx
│   └── Register.tsx
├── services/         # API service layer
│   ├── api.ts        # Base API client
│   ├── auth.ts       # Auth endpoints
│   ├── character.ts  # Character endpoints
│   ├── dynasty.ts    # Dynasty endpoints
│   └── market.ts     # Market endpoints
├── stores/           # Zustand stores
│   ├── authStore.ts  # Auth state
│   └── characterStore.ts # Character selection
├── types/            # TypeScript type definitions
│   ├── auth.ts
│   ├── character.ts
│   ├── dynasty.ts
│   └── market.ts
├── utils/            # Utility functions
│   └── cn.ts         # className helper
├── App.tsx           # Main app component
├── Router.tsx        # Route definitions
└── main.tsx          # App entry point
```

## Key Components

### Authentication Flow
- Login/Register pages with form validation
- JWT tokens stored in localStorage
- Automatic token refresh on app startup
- Protected routes redirect to login when unauthorized

### Character Management
- Character creation with dynasty selection
- Character stats display with health/stamina bars
- Inventory management with sell functionality
- Transaction history with expandable details
- Travel between regions with visual feedback

### Market System
- Region selection dropdown
- Category and price filters
- Real-time price updates via WebSocket
- Purchase flow with confirmation modal
- "Trading As" display showing selected character

### State Management
- **Zustand** for auth state (persisted to localStorage)
- **Zustand** for selected character (persisted)
- **TanStack Query** for server data with caching
- **WebSocket Context** for real-time updates

## Environment Variables

```bash
# Backend API URL (required)
VITE_API_URL=http://localhost:3113

# Additional environment variables can be added here
```

## PWA Features

The app is configured as a Progressive Web App with:
- Web app manifest for installation
- Service worker for offline support
- Cache-first strategy for assets
- Network-first strategy for API calls
- Background sync capabilities
- App icons in multiple sizes

## Development Tips

### Running with HTTPS (for PWA testing)
```bash
npm run dev -- --https
```

### Debugging WebSocket connections
Check the browser console for WebSocket status. The app will show connection status and automatically reconnect on disconnection.

### Type Safety
All API responses are fully typed. When adding new endpoints:
1. Add types to the appropriate file in `src/types/`
2. Add service method to the appropriate file in `src/services/`
3. Use with TanStack Query hooks in components

### Adding New Features
1. Create types in `src/types/`
2. Add API service methods in `src/services/`
3. Create UI components in `src/components/`
4. Add pages to `src/pages/` and update Router
5. Use TanStack Query for data fetching
6. Use Zustand for client state if needed

## Testing

```bash
# Run unit tests (when implemented)
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure type safety with `npm run type-check`
4. Run linting with `npm run lint`
5. Build successfully with `npm run build`
6. Submit a pull request

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running on the correct port
- Check CORS settings if connecting from different origin
- Look for connection errors in browser console

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Ensure all TypeScript errors are resolved

### PWA Not Installing
- Must be served over HTTPS in production
- Check manifest.json is accessible
- Verify service worker is registered

### UI Not Updating
- Character location updates immediately after travel (no refresh needed)
- Market data updates via WebSocket in real-time
- If data seems stale, check network tab for failed requests

## License

This project is licensed under the MIT License.