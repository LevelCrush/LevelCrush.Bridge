import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketService } from '@/services/market';
import { characterService } from '@/services/character';
import { MarketRegion, MarketListing, MarketEvent, ItemCategory } from '@/types';
import { 
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MarketPage() {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch regions
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Fetch user's characters
  const { data: characters = [] } = useQuery({
    queryKey: ['characters'],
    queryFn: characterService.getDynastyCharacters,
  });

  // Fetch listings for selected region
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['market', 'listings', selectedRegion?.id, selectedCategory, priceFilter],
    queryFn: () => {
      if (!selectedRegion) return [];
      return marketService.getRegionListings(
        selectedRegion.id,
        selectedCategory || undefined,
        priceFilter.min ? parseFloat(priceFilter.min) : undefined,
        priceFilter.max ? parseFloat(priceFilter.max) : undefined
      );
    },
    enabled: !!selectedRegion,
  });

  // Fetch market stats for selected region
  const { data: marketStats } = useQuery({
    queryKey: ['market', 'stats', selectedRegion?.id],
    queryFn: () => marketService.getMarketStats(selectedRegion!.id),
    enabled: !!selectedRegion,
  });

  // Fetch market events
  const { data: marketEvents = [] } = useQuery({
    queryKey: ['market', 'events', selectedRegion?.id],
    queryFn: () => marketService.getMarketEvents(selectedRegion?.id),
  });

  const livingCharacters = characters.filter(c => c.is_alive);
  const activeCharacter = livingCharacters[0]; // TODO: Allow character selection

  const handlePurchase = async (listing: MarketListing) => {
    if (!activeCharacter) {
      toast.error('No active character to make purchases');
      return;
    }

    try {
      await marketService.purchaseListing({
        listing_id: listing.id,
        quantity: 1, // TODO: Add quantity selector
      });
      toast.success('Purchase successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    }
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString();
  };

  const getCategoryColor = (category: ItemCategory) => {
    const colors = {
      [ItemCategory.Food]: 'text-green-400',
      [ItemCategory.Material]: 'text-blue-400',
      [ItemCategory.Weapon]: 'text-red-400',
      [ItemCategory.Armor]: 'text-purple-400',
      [ItemCategory.Tool]: 'text-yellow-400',
      [ItemCategory.Luxury]: 'text-pink-400',
      [ItemCategory.Artifact]: 'text-dynasty-400',
    };
    return colors[category] || 'text-slate-400';
  };

  if (regionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dynasty-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-white">Regional Markets</h1>
          <p className="mt-2 text-slate-300">Trade goods across different regions and build your wealth.</p>
        </div>

        {/* Market Events Alert */}
        {marketEvents.length > 0 && (
          <div className="mb-6 space-y-2">
            {marketEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-yellow-400">{event.title}</h4>
                    <p className="text-sm text-slate-300 mt-1">{event.description}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {event.price_modifier > 1 ? (
                      <span className="text-red-400">+{((event.price_modifier - 1) * 100).toFixed(0)}%</span>
                    ) : (
                      <span className="text-green-400">{((1 - event.price_modifier) * 100).toFixed(0)}%</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Region Selection */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-medium text-white mb-4">Select Region</h2>
              <div className="space-y-2">
                {regions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRegion?.id === region.id
                        ? 'bg-dynasty-600 border border-dynasty-500'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white flex items-center">
                          {region.is_capital && <BuildingStorefrontIcon className="h-4 w-4 mr-1 text-dynasty-400" />}
                          {region.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          Safety: {region.safety_level}% • Prosperity: {region.prosperity_level}%
                        </p>
                      </div>
                      <MapPinIcon className="h-5 w-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            {selectedRegion && (
              <div className="card mt-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-between w-full text-white"
                >
                  <span className="font-medium">Filters</span>
                  <FunnelIcon className="h-5 w-5" />
                </button>
                
                {showFilters && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="label">Category</label>
                      <select
                        className="input"
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value as ItemCategory || null)}
                      >
                        <option value="">All Categories</option>
                        {Object.values(ItemCategory).map((category) => (
                          <option key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="label">Price Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min"
                          className="input"
                          value={priceFilter.min}
                          onChange={(e) => setPriceFilter({ ...priceFilter, min: e.target.value })}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          className="input"
                          value={priceFilter.max}
                          onChange={(e) => setPriceFilter({ ...priceFilter, max: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Market Listings */}
          <div className="lg:col-span-3">
            {!selectedRegion ? (
              <div className="card text-center py-12">
                <MapPinIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-lg font-medium text-white">Select a Region</h3>
                <p className="mt-1 text-sm text-slate-400">Choose a region to view market listings</p>
              </div>
            ) : (
              <>
                {/* Market Stats */}
                {marketStats && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="card">
                      <p className="text-sm text-slate-400">Total Listings</p>
                      <p className="text-2xl font-bold text-white">{marketStats.total_listings}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-slate-400">24h Volume</p>
                      <p className="text-2xl font-bold text-white">{formatPrice(marketStats.total_volume_24h)}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-slate-400">Avg Transaction</p>
                      <p className="text-2xl font-bold text-white">{formatPrice(marketStats.average_transaction_value)}</p>
                    </div>
                    <div className="card">
                      <p className="text-sm text-slate-400">Active Character</p>
                      <p className="text-lg font-medium text-white">{activeCharacter?.name || 'None'}</p>
                    </div>
                  </div>
                )}

                {/* Listings */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-white">Market Listings</h2>
                    <span className="text-sm text-slate-400">{listings.length} items</span>
                  </div>

                  {listingsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dynasty-500"></div>
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8">
                      <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">No listings found</h3>
                      <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or check another region</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.map((listing) => (
                        <div
                          key={listing.id}
                          className="bg-slate-700 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h4 className="font-medium text-white">{listing.item_id}</h4>
                                {listing.is_ghost_listing && (
                                  <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                                    Ghost
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-sm text-slate-400">
                                <span>Qty: {listing.quantity}</span>
                                <span>•</span>
                                <span>Listed: {new Date(listing.listed_at).toLocaleDateString()}</span>
                                {listing.seller_character_id && (
                                  <>
                                    <span>•</span>
                                    <span>Seller: {listing.seller_character_id.slice(0, 8)}...</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-white">{formatPrice(listing.price)} gold</p>
                              <button
                                onClick={() => handlePurchase(listing)}
                                disabled={!activeCharacter || !listing.is_active}
                                className="mt-2 btn-primary text-sm"
                              >
                                Purchase
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}