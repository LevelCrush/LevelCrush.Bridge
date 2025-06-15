# Dynasty Trader Frontend Changelog

All notable changes to the Dynasty Trader frontend will be documented in this file.

## [0.5.0] - 2025-06-14

### Added
- **Discord Integration**
  - Settings page with Discord account linking
  - Visual connection status with Discord avatar and username
  - Link/unlink functionality with confirmation dialogs
  - OAuth2 integration for secure account connection
  - Real-time sync status after linking/unlinking
  - Automatic user data refresh on connection changes
  - Integration enables trading directly from Discord

### Fixed
- **Authentication & State Management**
  - Fixed infinite loop in useAuth when token refresh fails
  - Improved error handling in auth context with proper type safety
  - Fixed WebSocket connection issues by moving it after auth loading
  - Resolved refresh token flow to properly handle expired tokens
  - Enhanced auth state cleanup on logout

### Technical Improvements
- Added Discord service for OAuth operations
- Created settings store for Discord connection state
- Improved type safety in auth context
- Better error boundary handling for auth failures

## [0.4.0] - 2025-06-14

### Added
- **Character Inventory Management**
  - Real-time search functionality by item name or description
  - Category and rarity filters with visual indicators
  - Sorting options (name, value, quantity, date acquired)
  - Visual capacity tracking with progress bar and percentage
  - Integrated sell interface launching modal directly from inventory
  - Item cards showing rarity colors and category icons

- **Sell Item Modal**
  - Automatically defaults to character's current location
  - Market analysis section with current prices and volume
  - Real-time fee calculation showing tax and profit
  - Visual warnings for expected losses
  - Suggested pricing based on recent market data
  - Listing duration options from 1 to 30 days

- **Enhanced Transaction History**
  - Advanced filtering system with multiple criteria
  - Time range presets (24h, 7d, 30d, all time)
  - Search across items, traders, and regions
  - Financial dashboard with key metrics
  - Expandable rows showing complete transaction details
  - Visual indicators for buy/sell side

- **Character Statistics Component**
  - Multi-tab interface for comprehensive stats viewing
  - Interactive radar chart using Recharts
  - Skills & bonuses breakdown with percentage displays
  - Life progression tracking with visual stages
  - Dynamic calculations based on character attributes
  - Support for both living and deceased characters

- **Marketplace Location Awareness**
  - Marketplace remembers and defaults to character location
  - Visual map pin indicators throughout UI
  - Dropdown shows "(Current Location)" for character's region
  - Automatic region switching when changing characters
  - Consistent location display across all pages

### Technical Improvements
- Created reusable Modal component with proper accessibility
- Implemented memoization for expensive calculations
- Added proper TypeScript types for all new components
- Enhanced Zustand store with location tracking
- Improved data fetching with proper dependencies

## [0.3.0] - 2025-06-14

### Added
- **Death Notifications & Inheritance UI**
  - Real-time death notifications via WebSocket
  - Enhanced death notification cards with market impact info
  - Detailed inheritance modal for user's own character deaths
  - Shows wealth distribution, death tax (10%), and heir allocation
  - Market impact visualization (affected regions, ghost listings)
  - Recent Deaths page tracking fallen characters across dynasties
  - Death event manager differentiating user vs other player deaths
  - Character death listener hook for automatic data refresh
  - Formatting utilities for currency and relative time display

- **UI/UX Improvements**
  - Added framer-motion for smooth modal animations
  - Integrated lucide-react for consistent iconography
  - Death notifications auto-dismiss after 10 seconds
  - Inheritance modal with step-by-step animation
  - Recent deaths statistics with 7-day tracking

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