# Dynasty Trader Frontend Changelog

All notable changes to the Dynasty Trader frontend will be documented in this file.

## [0.2.0] - 2025-06-14

### Added
- **Character Travel System**
  - Travel modal component with region comparison UI
  - Shows current location vs destination statistics
  - Displays tax rates, safety levels, and prosperity
  - Integration with backend travel endpoint
  - Visual feedback during travel process

- **Market Category Filters**
  - Working category dropdown in marketplace
  - Fixed enum values to match backend database
  - Categories: Food, Raw Material, Equipment, Luxury, Textile
  - Filters update market listings in real-time

- **Character State Persistence**
  - Zustand store for selected character across pages
  - Character selection persists in localStorage
  - "Trade" button pre-selects character in marketplace
  - Improved navigation flow between character and market pages

- **Marketplace Enhancements**
  - "Trading As" card showing selected character and gold
  - Auto-select first region on marketplace load
  - Character dropdown with accurate gold values
  - Region dropdown replacing button list

- **Form Validation System**
  - Created validation utility with comprehensive rules
  - Real-time validation with visual feedback
  - Field-level error messages below inputs
  - Password strength indicator with suggestions
  - Reusable FormField, Input, and Textarea components
  - Enhanced validation for all forms in the app
  - Disabled submit buttons when errors exist

### Fixed
- **Frontend Type Definitions**
  - Updated ItemCategory enum to match backend capitalization
  - Fixed category filter not returning results for "Food"
  - Aligned all enums with database values

- **Character Selection**
  - Fixed marketplace not updating when navigating from character page
  - Character dropdown now reflects pre-selected character
  - Gold values display correctly in character selector

- **Registration Clarity**
  - Changed "Dynasty name" to "Username" for account creation
  - Updated page titles and messaging for better flow
  - Clarified account creation vs dynasty creation process

- **Travel Location Updates**
  - Fixed location not updating immediately after travel
  - Added callback to update local state when travel succeeds
  - Character's current location now reflects changes without refresh

## [0.1.0] - 2025-06-13

### Initial Release

#### Core Features
- **Authentication System**
  - Login and registration pages
  - JWT token management with localStorage
  - Automatic token refresh on app startup
  - Protected routes with auth guards
  - Logout with state cleanup

- **Dynasty Management**
  - Dynasty creation with name and motto
  - Dynasty dashboard with statistics
  - Character count (living vs deceased)
  - Dynasty wealth and reputation display

- **Character System**
  - Character creation with randomized stats
  - Character dashboard with stat bars
  - Inventory management with item details
  - Transaction history with profit/loss tracking
  - Character location display with map indicators

- **Market Interface**
  - Regional market browsing (8 unique regions)
  - Market listings with seller information
  - Purchase flow with confirmation modal
  - Market statistics and price trends
  - Item detail modals with rarity display

- **Inventory Management**
  - View character inventory with item details
  - Sell items to market with pricing modal
  - Track item values and quantities
  - Item rarity visualization with stars

- **Transaction System**
  - Complete transaction history per character
  - Expandable transaction details
  - Buy/sell indicators with profit/loss
  - Tax calculations and net amounts

#### Technical Implementation
- **State Management**
  - Zustand for auth state with persistence
  - TanStack Query for server state caching
  - Optimistic updates for better UX

- **Real-time Features**
  - WebSocket context for live updates
  - Market price change notifications
  - Death event toast notifications
  - Auto-reconnection with exponential backoff

- **UI/UX**
  - Dark theme with Tailwind CSS
  - Loading skeletons for smooth data loading
  - Responsive mobile-first design
  - Smooth animations and transitions
  - Error handling with toast notifications

- **Data Visualization**
  - Price history charts with Recharts
  - Trading volume visualization
  - Interactive tooltips
  - Responsive chart sizing

- **Progressive Web App**
  - Web manifest for installation
  - Service worker with Workbox
  - Offline support with cache strategies
  - App icons in multiple sizes

#### Infrastructure
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Lucide React for icons
- React Hook Form for forms
- Recharts for data visualization

### Known Issues
- WebSocket reconnection may need page refresh in some cases
- Service worker updates require manual refresh

## Upcoming Features

### Planned for Next Release
- Trade route visualization on map
- Character relationships and alliances
- Market event detailed views
- Ghost character interactions
- Caravan management system
- Achievement and perk displays
- Regional reputation tracking
- Dynasty upgrade system

### Technical Improvements
- Unit test coverage
- E2E testing with Playwright
- Performance optimizations
- Accessibility improvements
- Internationalization support