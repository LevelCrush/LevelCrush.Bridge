import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketService } from '@/services/market';
import { characterService } from '@/services/character';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import { ItemCategory, ItemRarity, PriceHistoryPoint } from '@/types';
import Modal from './Modal';
import LoadingSkeleton from './LoadingSkeleton';
import toast from 'react-hot-toast';
import { 
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  CalculatorIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface SellItemModalProps {
  item: any;
  characterId: string;
  onClose: () => void;
}

export default function SellItemModal({ item, characterId, onClose }: SellItemModalProps) {
  const queryClient = useQueryClient();
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [duration, setDuration] = useState(7); // days

  const itemInfo = item.item_name ? {
    name: item.item_name,
    description: item.item_description || 'A valuable trade good',
    category: (item.category as ItemCategory) || ItemCategory.RawMaterial,
    rarity: (item.rarity as ItemRarity) || ItemRarity.Common
  } : getItemInfo(item.item_id);

  // Fetch regions
  const { data: regions } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Fetch character to get current location
  const { data: character } = useQuery({
    queryKey: ['character', characterId],
    queryFn: () => characterService.getCharacter(characterId),
  });

  // Fetch market stats for price recommendation
  const { data: marketStats } = useQuery({
    queryKey: ['market', 'stats', selectedRegionId, item.item_id],
    queryFn: () => marketService.getMarketStats(selectedRegionId),
    enabled: !!selectedRegionId,
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: (listingData: any) => marketService.createListing(listingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character', characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['market'] });
      toast.success('Item listed successfully!');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create listing');
    },
  });

  // Get price history for the item in selected region
  const { data: priceHistory } = useQuery({
    queryKey: ['market', 'price-history', selectedRegionId, item.item_id],
    queryFn: () => marketService.getPriceHistory(selectedRegionId, item.item_id),
    enabled: !!selectedRegionId && !!item.item_id,
  });

  // Calculate suggested price based on market data
  const suggestedPrice = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return parseFloat(item.acquired_price) * 1.2; // 20% markup by default
    }
    
    const recentPrices = priceHistory.slice(0, 10);
    const avgPrice = recentPrices.reduce((sum, p) => sum + parseFloat(p.avg_price || '0'), 0) / recentPrices.length;
    return Math.round(avgPrice * 100) / 100;
  }, [priceHistory, item.acquired_price]);

  // Calculate fees and profits
  const calculateFees = () => {
    const price = parseFloat(pricePerUnit) || 0;
    const totalPrice = price * quantity;
    const region = regions?.find(r => r.id === selectedRegionId);
    const taxRate = parseFloat(region?.tax_rate || '0.1');
    const taxAmount = totalPrice * taxRate;
    const profit = totalPrice - taxAmount - (parseFloat(item.acquired_price) * quantity);
    
    return {
      totalPrice,
      taxAmount,
      profit,
      taxRate: taxRate * 100,
    };
  };

  const fees = calculateFees();

  const handleCreateListing = () => {
    if (!selectedRegionId) {
      toast.error('Please select a region');
      return;
    }

    if (!pricePerUnit || parseFloat(pricePerUnit) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (quantity <= 0 || quantity > item.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    createListingMutation.mutate({
      character_id: characterId,
      region_id: selectedRegionId,
      item_id: item.item_id,
      quantity,
      price: parseFloat(pricePerUnit),
      expires_in_days: duration,
    });
  };

  // Set initial region to character's location
  useEffect(() => {
    if (character?.location_id && !selectedRegionId) {
      setSelectedRegionId(character.location_id);
    }
  }, [character?.location_id, selectedRegionId]);

  // Set suggested price when it's calculated
  useEffect(() => {
    if (suggestedPrice && !pricePerUnit) {
      setPricePerUnit(suggestedPrice.toString());
    }
  }, [suggestedPrice, pricePerUnit]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Sell Item on Market"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Item Info */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-2xl mr-3">{getCategoryIcon(itemInfo.category)}</span>
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${getRarityColor(itemInfo.rarity)}`}>
                {itemInfo.name}
              </h3>
              <p className="text-sm text-slate-400 mt-1">{itemInfo.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-slate-400">
                  Available: <span className="text-white font-medium">{item.quantity}</span>
                </span>
                <span className="text-slate-400">
                  Acquired at: <span className="text-white font-medium">{parseFloat(item.acquired_price).toFixed(2)} gold/unit</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Details */}
        <div className="space-y-4">
          {/* Region Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              <MapPinIcon className="inline h-4 w-4 mr-1" />
              Market Region
            </label>
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
            >
              <option value="">Select a region</option>
              {regions?.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name} (Tax: {(parseFloat(region.tax_rate) * 100).toFixed(0)}%)
                  {character?.location_id === region.id && ' - Current Location'}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={item.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, item.quantity))}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Price per Unit (Gold)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder={suggestedPrice ? `Suggested: ${suggestedPrice}` : 'Enter price'}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Listing Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
            </select>
          </div>
        </div>

        {/* Market Analysis */}
        {selectedRegionId && priceHistory && priceHistory.length > 0 && (
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Market Analysis
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Current Market Price</span>
                <p className="text-white font-medium">
                  {priceHistory[0] ? parseFloat(priceHistory[0].avg_price).toFixed(2) : '0.00'} gold
                </p>
              </div>
              <div>
                <span className="text-slate-400">24h Change</span>
                <p className={cn(
                  "font-medium",
                  "text-slate-400"
                )}>
                  N/A
                </p>
              </div>
              <div>
                <span className="text-slate-400">Active Listings</span>
                <p className="text-white font-medium">
                  {marketStats?.total_listings || 0}
                </p>
              </div>
              <div>
                <span className="text-slate-400">24h Volume</span>
                <p className="text-white font-medium">
                  {parseFloat(marketStats?.total_volume_24h || '0').toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fee Calculation */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center">
            <CalculatorIcon className="h-4 w-4 mr-2" />
            Fee Calculation
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Price</span>
              <span className="text-white font-medium">{fees.totalPrice.toFixed(2)} gold</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Market Tax ({fees.taxRate.toFixed(0)}%)</span>
              <span className="text-red-400">-{fees.taxAmount.toFixed(2)} gold</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cost Basis</span>
              <span className="text-slate-400">-{(parseFloat(item.acquired_price) * quantity).toFixed(2)} gold</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-700">
              <span className="text-white font-medium">Expected Profit</span>
              <span className={cn(
                "font-bold",
                fees.profit >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {fees.profit >= 0 ? '+' : ''}{fees.profit.toFixed(2)} gold
              </span>
            </div>
          </div>
        </div>

        {/* Warning for losses */}
        {fees.profit < 0 && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-red-400 font-medium">Warning: Expected Loss</p>
              <p className="text-red-300 mt-1">
                This listing will result in a loss of {Math.abs(fees.profit).toFixed(2)} gold.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateListing}
            disabled={createListingMutation.isPending || !selectedRegionId || !pricePerUnit}
            className="btn-primary flex items-center gap-2"
          >
            <BuildingStorefrontIcon className="h-5 w-5" />
            {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </div>
    </Modal>
  );
}