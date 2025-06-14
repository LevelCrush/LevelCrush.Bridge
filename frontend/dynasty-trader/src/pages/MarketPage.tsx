import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketService } from '@/services/market';
import { characterService } from '@/services/character';
import { MarketRegion, MarketListing, MarketEvent, ItemCategory, ItemRarity } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { MarketListingSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton';
import MarketItemModal from '@/components/MarketItemModal';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';
import ItemDetailsModal from '@/components/ItemDetailsModal';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import { 
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function MarketPage() {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [priceFilter, setPriceFilter] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [purchasingListing, setPurchasingListing] = useState<MarketListing | null>(null);
  const [viewingItemDetails, setViewingItemDetails] = useState<MarketListing | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { isConnected, socket, subscribe, unsubscribe } = useWebSocket();

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
  const activeCharacter = selectedCharacterId 
    ? characters.find(c => c.id === selectedCharacterId) 
    : livingCharacters[0];

  // Set default selected character
  useEffect(() => {
    if (!selectedCharacterId && livingCharacters.length > 0) {
      setSelectedCharacterId(livingCharacters[0].id);
    }
  }, [livingCharacters, selectedCharacterId]);

  // Set default selected region
  useEffect(() => {
    if (!selectedRegion && regions.length > 0) {
      setSelectedRegion(regions[0]);
    }
  }, [regions, selectedRegion]);

  // Subscribe to market updates for selected region
  useEffect(() => {
    if (!selectedRegion || !socket) return;

    const channel = `market:${selectedRegion.id}`;
    subscribe(channel);

    // Listen for market updates
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.channel === channel) {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['market', 'listings', selectedRegion.id] });
          queryClient.invalidateQueries({ queryKey: ['market', 'stats', selectedRegion.id] });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      unsubscribe(channel);
      socket.removeEventListener('message', handleMessage);
    };
  }, [selectedRegion, socket, subscribe, unsubscribe, queryClient]);

  const handlePurchase = (listing: MarketListing) => {
    setPurchasingListing(listing);
  };

  const handleConfirmPurchase = async (_characterId: string, quantity: number) => {
    if (!purchasingListing) return;

    try {
      await marketService.purchaseListing({
        listing_id: purchasingListing.id,
        quantity,
      });
      toast.success('Purchase successful!');
      setPurchasingListing(null);
      setSelectedListing(null);
      
      // Refresh listings and character data
      queryClient.invalidateQueries({ queryKey: ['market', 'listings', selectedRegion?.id] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Purchase failed');
    }
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString();
  };

  const getRarityBadgeClasses = (rarity: string) => {
    const baseClasses = 'text-xs px-2 py-0.5 rounded font-medium';
    switch (rarity) {
      case 'common':
        return `${baseClasses} bg-gray-900 text-gray-300`;
      case 'uncommon':
        return `${baseClasses} bg-green-900 text-green-300`;
      case 'rare':
        return `${baseClasses} bg-blue-900 text-blue-300`;
      case 'epic':
        return `${baseClasses} bg-purple-900 text-purple-300`;
      case 'legendary':
        return `${baseClasses} bg-yellow-900 text-yellow-300`;
      default:
        return `${baseClasses} bg-gray-900 text-gray-300`;
    }
  };

  const getCategoryColor = (category: ItemCategory | string) => {
    const colors: Record<string, string> = {
      [ItemCategory.Food]: 'text-green-400',
      [ItemCategory.RawMaterial]: 'text-blue-400',
      [ItemCategory.Equipment]: 'text-red-400',
      [ItemCategory.Textile]: 'text-yellow-400',
      [ItemCategory.Luxury]: 'text-pink-400',
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Regional Markets</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-300">Trade goods across different regions and build your wealth.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              {/* Character Selector */}
              {livingCharacters.length > 0 && (
                <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                  <select
                    value={selectedCharacterId || ''}
                    onChange={(e) => setSelectedCharacterId(e.target.value)}
                    className="input py-1 px-3 text-sm min-w-[150px]"
                  >
                    {livingCharacters.map((character) => (
                      <option key={character.id} value={character.id}>
                        {character.name} ({parseFloat(character.inheritance_received || '0').toLocaleString()} gold)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-slate-400">
                  {isConnected ? 'Live Updates' : 'Connecting...'}
                </span>
              </div>
            </div>
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Region Selection */}
          <div className="lg:col-span-1">
            <div className="card lg:sticky lg:top-4">
              <h2 className="text-lg font-medium text-white mb-4">Select Region</h2>
              <select
                value={selectedRegion?.id || ''}
                onChange={(e) => {
                  const region = regions.find(r => r.id === e.target.value);
                  setSelectedRegion(region || null);
                }}
                className="input w-full"
              >
                <option value="">Choose a region...</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.is_capital ? '🏛️ ' : ''}{region.name} (Safety: {region.safety_level}%, Prosperity: {region.prosperity_level}%)
                  </option>
                ))}
              </select>
              
              {selectedRegion && (
                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <p className="font-medium text-white flex items-center">
                    {selectedRegion.is_capital && <BuildingStorefrontIcon className="h-4 w-4 mr-1 text-dynasty-400" />}
                    {selectedRegion.name}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">{selectedRegion.description}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>
                      <span className="text-slate-400">Safety:</span>
                      <span className="ml-1 text-white">{selectedRegion.safety_level}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Prosperity:</span>
                      <span className="ml-1 text-white">{selectedRegion.prosperity_level}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tax Rate:</span>
                      <span className="ml-1 text-white">{(parseFloat(selectedRegion.tax_rate) * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
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
                            {category}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mb-4 lg:mb-6">
                  {marketStats ? (
                    <>
                      <div className="card">
                        <p className="text-xs sm:text-sm text-slate-400">Total Listings</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{marketStats.total_listings}</p>
                      </div>
                      <div className="card">
                        <p className="text-xs sm:text-sm text-slate-400">24h Volume</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(marketStats.total_volume_24h)}</p>
                      </div>
                      <div className="card">
                        <p className="text-xs sm:text-sm text-slate-400">Trading As</p>
                        {activeCharacter ? (
                          <div>
                            <p className="text-base sm:text-lg font-medium text-white">{activeCharacter.name}</p>
                            <p className="text-xs text-dynasty-400">{parseFloat(activeCharacter.inheritance_received || '0').toLocaleString()} gold</p>
                            {activeCharacter.location_id && (
                              <p className="text-xs text-slate-500 flex items-center mt-1">
                                <MapPinIcon className="h-3 w-3 mr-1" />
                                {regions.find(r => r.id === activeCharacter.location_id)?.name || 'Unknown'}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-base sm:text-lg font-medium text-slate-500">No character selected</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                      <StatCardSkeleton />
                    </>
                  )}
                </div>

                {/* Listings */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-white">Market Listings</h2>
                    <span className="text-sm text-slate-400">{listings.length} items</span>
                  </div>

                  {listingsLoading ? (
                    <div className="space-y-3">
                      <MarketListingSkeleton />
                      <MarketListingSkeleton />
                      <MarketListingSkeleton />
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8">
                      <TruckIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">No listings found</h3>
                      <p className="mt-1 text-sm text-slate-400">Try adjusting your filters or check another region</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {listings.map((listing) => {
                        const itemInfo = listing.item_name ? {
                          name: listing.item_name,
                          description: listing.item_description || 'A valuable trade good',
                          category: (listing.item_category as ItemCategory) || ItemCategory.RawMaterial,
                          rarity: (listing.item_rarity as ItemRarity) || ItemRarity.Common
                        } : getItemInfo(listing.item_id);
                        return (
                          <div
                            key={listing.id}
                            className={`bg-slate-700 rounded-lg p-4 transition-all cursor-pointer border ${
                              itemInfo.rarity === 'legendary' ? 'border-yellow-900/50 hover:border-yellow-800 hover:shadow-lg hover:shadow-yellow-900/20' :
                              itemInfo.rarity === 'epic' ? 'border-purple-900/50 hover:border-purple-800 hover:shadow-lg hover:shadow-purple-900/20' :
                              itemInfo.rarity === 'rare' ? 'border-blue-900/50 hover:border-blue-800 hover:shadow-lg hover:shadow-blue-900/20' :
                              itemInfo.rarity === 'uncommon' ? 'border-green-900/50 hover:border-green-800 hover:shadow-lg hover:shadow-green-900/20' :
                              'border-slate-600 hover:border-slate-500'
                            } hover:bg-slate-600`}
                            onClick={() => setViewingItemDetails(listing)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <span className="text-lg mr-2">{getCategoryIcon(itemInfo.category)}</span>
                                  <h4 className={`font-medium ${getRarityColor(itemInfo.rarity)}`}>
                                    {itemInfo.name}
                                  </h4>
                                  <span className={`ml-2 ${getRarityBadgeClasses(itemInfo.rarity)}`}>
                                    {itemInfo.rarity.charAt(0).toUpperCase() + itemInfo.rarity.slice(1)}
                                  </span>
                                  {listing.is_ghost_listing && (
                                    <span className="ml-2 text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded">
                                      Ghost
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center space-x-4 text-sm text-slate-400">
                                  <span className={getCategoryColor(itemInfo.category as ItemCategory)}>
                                    {itemInfo.category.charAt(0).toUpperCase() + itemInfo.category.slice(1)}
                                  </span>
                                  <span>•</span>
                                  <span>Qty: {listing.quantity}</span>
                                  <span>•</span>
                                  <span>Listed: {new Date(listing.listed_at).toLocaleDateString()}</span>
                                  {listing.seller_character_name && (
                                    <>
                                      <span>•</span>
                                      <span>Seller: {listing.seller_character_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-lg font-bold text-white">{formatPrice(listing.price)} gold</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(listing);
                                  }}
                                  disabled={!listing.is_active || characters.filter(c => c.is_alive).length === 0}
                                  className="mt-2 btn-primary text-sm"
                                >
                                  Purchase
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Market Item Modal */}
      {selectedListing && selectedRegion && (
        <MarketItemModal
          listing={selectedListing}
          regionId={selectedRegion.id}
          onClose={() => setSelectedListing(null)}
          onPurchase={handlePurchase}
        />
      )}
      
      {/* Purchase Confirmation Modal */}
      <PurchaseConfirmationModal
        listing={purchasingListing}
        characters={characters}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setPurchasingListing(null)}
      />
      
      {/* Item Details Modal */}
      {viewingItemDetails && (
        <ItemDetailsModal
          item={viewingItemDetails}
          isOpen={!!viewingItemDetails}
          onClose={() => setViewingItemDetails(null)}
        />
      )}
    </div>
  );
}