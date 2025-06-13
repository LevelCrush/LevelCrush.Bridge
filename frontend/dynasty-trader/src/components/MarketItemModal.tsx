import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { marketService } from '@/services/market';
import { MarketListing } from '@/types';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import PriceChart, { VolumeChart } from './PriceChart';
import LoadingSkeleton from './LoadingSkeleton';

interface MarketItemModalProps {
  listing: MarketListing | null;
  regionId: string;
  onClose: () => void;
  onPurchase: (listing: MarketListing) => void;
}

export default function MarketItemModal({ 
  listing, 
  regionId, 
  onClose, 
  onPurchase 
}: MarketItemModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Mock price history data for now - in a real app this would come from the API
  const mockPriceData = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setHours(date.getHours() - (23 - i));
    const basePrice = listing ? parseFloat(listing.price) : 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±10% variation
    return {
      time: date.toISOString(),
      price: basePrice * (1 + variation),
      volume: Math.floor(Math.random() * 1000) + 100,
    };
  });

  const { data: priceHistory = mockPriceData, isLoading: priceLoading } = useQuery({
    queryKey: ['market', 'price-history', regionId, listing?.item_id],
    queryFn: async () => {
      // In a real app, this would fetch from the API
      // return marketService.getPriceHistory(regionId, listing!.item_id, 24);
      return mockPriceData;
    },
    enabled: !!listing,
  });

  const calculatePriceChange = () => {
    if (!priceHistory || priceHistory.length < 2) return 0;
    const oldPrice = priceHistory[0].price;
    const currentPrice = priceHistory[priceHistory.length - 1].price;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  };

  if (!listing) return null;

  const totalPrice = parseFloat(listing.price) * quantity;
  const itemInfo = listing.item_name ? {
    name: listing.item_name,
    description: listing.item_description || 'A valuable trade good',
    category: listing.item_category || 'material',
    rarity: listing.item_rarity || 'common'
  } : getItemInfo(listing.item_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-slate-800 rounded-t-lg sm:rounded-lg max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getCategoryIcon(itemInfo.category)}</span>
            <h2 className={`text-xl sm:text-2xl font-bold ${getRarityColor(itemInfo.rarity)}`}>
              {itemInfo.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Item Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="card">
              <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4">Item Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Description</p>
                  <p className="text-sm sm:text-base text-white">{itemInfo.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Category</p>
                    <p className={`text-sm sm:text-base font-medium ${getRarityColor(itemInfo.rarity)}`}>
                      {itemInfo.category.charAt(0).toUpperCase() + itemInfo.category.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-slate-400">Rarity</p>
                    <p className={`text-sm sm:text-base font-medium ${getRarityColor(itemInfo.rarity)}`}>
                      {itemInfo.rarity.charAt(0).toUpperCase() + itemInfo.rarity.slice(1)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">Listed Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-white">
                    {parseFloat(listing.price).toLocaleString()} gold
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Available Quantity</p>
                    <p className="font-medium text-white">{listing.quantity}</p>
                  </div>
                  {listing.seller_character_id && (
                    <div>
                      <p className="text-sm text-slate-400">Seller</p>
                      <p className="font-medium text-white">
                        {listing.seller_character_id.slice(0, 8)}...
                      </p>
                    </div>
                  )}
                </div>
                {listing.is_ghost_listing && (
                  <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <p className="text-sm text-purple-300">
                      👻 This is a ghost listing from a deceased merchant
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-medium text-white mb-4">Purchase</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="quantity" className="label">
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={listing.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantity, parseInt(e.target.value) || 1)))}
                    className="input"
                  />
                </div>
                <div className="p-4 bg-slate-700 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Price per unit</span>
                    <span className="text-white">{parseFloat(listing.price).toLocaleString()} gold</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">Quantity</span>
                    <span className="text-white">×{quantity}</span>
                  </div>
                  <div className="border-t border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-white">Total</span>
                      <span className="text-xl font-bold text-dynasty-400">
                        {totalPrice.toLocaleString()} gold
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onPurchase(listing)}
                  disabled={!listing.is_active}
                  className="w-full btn-primary"
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>

          {/* Price Charts */}
          <div className="space-y-6">
            <PriceChart
              data={priceHistory}
              isLoading={priceLoading}
              itemName={itemInfo.name}
              currentPrice={listing.price}
              priceChange24h={calculatePriceChange()}
            />
            <VolumeChart
              data={priceHistory}
              isLoading={priceLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}