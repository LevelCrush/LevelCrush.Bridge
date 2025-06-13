# Dynasty Trader Frontend - TODO List

## ✅ Completed Tasks

### Phase 1: Core Frontend Setup (Complete)
- [x] React PWA setup with Vite
- [x] TypeScript configuration
- [x] Tailwind CSS with custom dark theme
- [x] Routing with React Router
- [x] API client setup with Axios

### Phase 2: Authentication & State Management (Complete)
- [x] JWT authentication flow
- [x] Login/Register pages
- [x] Protected routes
- [x] Persistent auth state with Zustand
- [x] Auto token refresh

### Phase 3: Core Features (Complete)
- [x] Dynasty creation and management
- [x] Character creation with randomized stats
- [x] Dashboard with dynasty overview
- [x] Character page with stats display
- [x] Market page with region selection
- [x] API integration for all endpoints

### Phase 4: Real-time & Enhanced UX (Complete)
- [x] WebSocket integration for live updates
- [x] Market price real-time updates
- [x] Death event notifications
- [x] Loading skeletons for smooth UX
- [x] Interactive price charts (Recharts)
- [x] Market item detail modal
- [x] Connection status indicator

### Phase 5: Mobile & PWA (Complete)
- [x] Mobile-responsive design
- [x] Touch-friendly UI elements
- [x] PWA manifest configuration
- [x] Service worker for offline support
- [x] Install prompt component
- [x] Mobile-optimized modals and navigation

## 🚧 Current TODOs

### High Priority
- [x] Fix item display in market (showing names instead of IDs)
  - [x] Created mock items data with categories and rarities
  - [x] Added visual indicators for rarity and category
  - [x] Updated market listings with proper item names
- [x] Purchase confirmation flow
  - [x] Character selection dropdown
  - [x] Quantity input with validation
  - [x] Wealth check before purchase
  - [x] Clear cost breakdown
- [x] Character inventory management
  - [x] View character inventory
  - [x] Item details modal
  - [x] Sell items to market
  - [ ] Transfer items between characters
- [ ] Actual market trading
  - [x] Transaction history
  - [ ] Sell orders creation
  - [ ] Price history for owned items

### Medium Priority
- [ ] Enhanced Character Features
  - [ ] Character avatar/portrait system
  - [ ] Character skills/perks display
  - [ ] Travel between regions
  - [ ] Character equipment slots
- [ ] Market Improvements
  - [ ] Advanced filtering (rarity, weight, etc.)
  - [ ] Price alerts
  - [ ] Favorite items
  - [ ] Market search functionality
  - [ ] Bulk purchase options
- [ ] Dynasty Features
  - [ ] Dynasty family tree visualization
  - [ ] Dynasty achievements/milestones
  - [ ] Alliance system UI
  - [ ] Dynasty statistics over time

### Low Priority
- [ ] UI Polish
  - [ ] Animation improvements
  - [ ] Sound effects for actions
  - [ ] Themed cursors
  - [ ] Loading screen improvements
  - [ ] Easter eggs
- [ ] Data Visualization
  - [ ] Dynasty wealth over time chart
  - [ ] Character age timeline
  - [ ] Trade route maps
  - [ ] Market heat maps
- [ ] Social Features
  - [ ] Dynasty leaderboards
  - [ ] Trade partner ratings
  - [ ] In-game messaging
  - [ ] Trade negotiations

## 🐛 Known Issues to Fix

1. **Market Listings Display** ✅ FIXED
   - ~~Currently showing item_id instead of item names~~
   - ~~Need to fetch and display actual item information~~
   - Fixed by joining with items table in backend

2. **Character Wealth Calculation** ✅ FIXED
   - ~~Wealth is fetched separately from stats endpoint~~
   - Fixed calculation to multiply quantity × price

3. **Region Navigation**
   - No visual indication of character's current location
   - No travel time/cost displayed

4. **WebSocket Reconnection**
   - Could be more robust with exponential backoff
   - Need better error handling for connection failures

5. **Form Validation**
   - Limited validation on character/dynasty names
   - Need better error messages

6. **Aggressive Aging System** ⚠️ PARTIALLY FIXED
   - ~~Characters are created with birth_date = NOW() (0 years old)~~
   - Characters now start at age 18
   - Aging task still runs every hour
   - Death probability needs adjustment for game balance
   - Current death rates: 0% (0-30), 0.1% (31-50), 1% (51-60), 5% (61-70), 15% (71-80)

## 💡 Future Enhancements

### Performance
- [ ] Virtual scrolling for long lists
- [ ] Image lazy loading
- [ ] Code splitting by route
- [ ] Service worker optimization
- [ ] IndexedDB for offline data

### Developer Experience
- [ ] Unit tests with Vitest
- [ ] E2E tests with Playwright
- [ ] Storybook for component development
- [ ] Better TypeScript types
- [ ] API mocking for development

### Accessibility
- [ ] Keyboard navigation improvements
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Reduced motion options
- [ ] Focus indicators

### Game Features (Requires Backend)
- [ ] Character marriages
- [ ] Dynasty wars
- [ ] Seasonal events
- [ ] Achievement system
- [ ] Guild/alliance features

## 📝 Notes

### API Endpoints Needed
- `GET /api/v2/items` - List all items with details
- `GET /api/v2/characters/:id/inventory` - Character inventory
- `POST /api/v2/characters/:id/travel` - Travel between regions
- `GET /api/v2/market/transactions` - Transaction history
- `GET /api/v2/dynasties/:id/tree` - Family tree data

### Design Decisions
- Using item_id for now until item details endpoint exists
- Wealth calculation happens on backend for security
- WebSocket channels are region-specific to reduce data
- PWA focuses on offline reading, not offline trading

### Technical Debt
- Some components are getting large and should be split
- Need better error boundaries
- API service could use better typing
- Some duplicate code between pages

## 🎯 Next Sprint Goals

1. **Character Inventory System** (Most requested feature)
2. **Item Details Display** (Fix the item_id issue)
3. **Purchase Flow Improvements** (Character selection, confirmation)
4. **Transaction History** (See past trades)
5. **Better Error Handling** (User-friendly error messages)

## 📅 Timeline Estimates

- Character Inventory: 2-3 days
- Market Improvements: 3-4 days
- Dynasty Features: 2-3 days
- Polish & Bug Fixes: 2 days
- Testing & Documentation: 2 days

Total: ~2 weeks for next major release

## 🎆 Recent Updates (2025-06-13)

### Bug Fixes Session
1. **Character Display Issues** ✅
   - Fixed characters not showing due to aggressive aging (dying at age 0)
   - Characters now start at age 18
   - Both living and dead characters now display properly
   - Deceased count shows correctly

2. **Inventory System** ✅
   - Fixed 404 error by implementing missing inventory endpoint
   - Added starting inventory for new characters (random items)
   - Fixed "Item hash" display by joining with items table
   - Inventory now shows actual item names, descriptions, categories

3. **Market Functionality** ✅
   - Implemented "Sell on Market" modal with region selection
   - Fixed market listings showing "Item hash" 
   - Added item details to market listing responses
   - Fixed SQL type mismatch for item_rarity enum
   - Added profit/loss calculations for sales

4. **UI/UX Improvements** ✅
   - Fixed button icons appearing on top of text
   - Fixed "sellingItem is not defined" JavaScript error
   - Prevented event propagation on sell button clicks

5. **Backend Fixes** ✅
   - Fixed character stats endpoint 500 error
   - Corrected wealth calculation (quantity × price)
   - Fixed Send trait issues with async random values

### Previous Updates (2025-01-13)
1. **Market Item Display**
   - Created comprehensive mock items data
   - Items now show names, categories, and descriptions
   - Added rarity-based coloring (common=gray, uncommon=green, rare=blue, epic=purple, legendary=yellow)
   - Category icons for quick identification
   - Hover effects that match item rarity

2. **Purchase Confirmation Modal**
   - Character selection with wealth display
   - Quantity input with max validation
   - Real-time total cost calculation
   - Wealth sufficiency check
   - Clear error messages for insufficient funds

3. **Character Inventory View**
   - Created CharacterInventory component with expandable item details
   - Shows inventory capacity with visual indicator
   - Displays total inventory value
   - Each item shows acquisition price and date
   - Mock data fallback when backend endpoint unavailable
   - Integrated into character page

### Next Up
1. Item details modal (separate from inventory expansion)
2. Transaction history
3. Character location indicators
4. Travel between regions

---

Last Updated: 2025-06-13 (Bug Fix Session)