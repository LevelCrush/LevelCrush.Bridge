import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { marketService } from '@/services/market';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import { MarketRegion, ItemCategory, ItemRarity } from '@/types';
import toast from 'react-hot-toast';
import { FormField, Input } from '@/components/FormField';
import { validatePrice, validateQuantity } from '@/utils/validation';

interface SellItemModalProps {
  item: {
    item_id: string;
    item_name?: string;
    item_description?: string;
    category?: string;
    rarity?: string;
    quantity: number;
    acquired_price: string;
  };
  characterId: string;
  onClose: () => void;
}

export default function SellItemModal({ item, characterId, onClose }: SellItemModalProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [errors, setErrors] = useState<{
    region?: string;
    price?: string;
    quantity?: string;
  }>({});
  const [touched, setTouched] = useState<{
    region?: boolean;
    price?: boolean;
    quantity?: boolean;
  }>({});
  const queryClient = useQueryClient();

  const itemInfo = item.item_name ? {
    name: item.item_name,
    description: item.item_description || 'A valuable trade good',
    category: (item.category as ItemCategory) || ItemCategory.RawMaterial,
    rarity: (item.rarity as ItemRarity) || ItemRarity.Common
  } : getItemInfo(item.item_id);
  const acquiredPrice = parseFloat(item.acquired_price);

  // Fetch regions
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Create listing mutation
  const createListingMutation = useMutation({
    mutationFn: marketService.createListing,
    onSuccess: () => {
      toast.success('Item listed successfully!');
      queryClient.invalidateQueries({ queryKey: ['character', characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['market', 'listings'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create listing');
    },
  });

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!selectedRegionId) {
      newErrors.region = 'Please select a region';
    }
    
    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      newErrors.price = priceValidation.error;
    }
    
    const quantityValidation = validateQuantity(quantity, item.quantity);
    if (!quantityValidation.isValid) {
      newErrors.quantity = quantityValidation.error;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePriceChange = (value: string) => {
    // Allow only numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    setPrice(value);
    
    // Clear error when user starts typing
    if (touched.price && errors.price) {
      setErrors(prev => ({ ...prev, price: undefined }));
    }
  };

  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    
    // Clear error when user changes value
    if (touched.quantity && errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: undefined }));
    }
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegionId(value);
    
    // Clear error when user selects region
    if (touched.region && errors.region) {
      setErrors(prev => ({ ...prev, region: undefined }));
    }
  };

  const handleBlur = (field: 'price' | 'quantity' | 'region') => {
    setTouched({ ...touched, [field]: true });
    
    if (field === 'price') {
      const validation = validatePrice(price);
      setErrors(prev => ({ ...prev, price: validation.error }));
    } else if (field === 'quantity') {
      const validation = validateQuantity(quantity, item.quantity);
      setErrors(prev => ({ ...prev, quantity: validation.error }));
    } else if (field === 'region' && !selectedRegionId) {
      setErrors(prev => ({ ...prev, region: 'Please select a region' }));
    }
  };

  const handleSubmit = () => {
    // Mark all fields as touched
    setTouched({ region: true, price: true, quantity: true });
    
    if (!validateForm()) {
      return;
    }

    createListingMutation.mutate({
      character_id: characterId,
      region_id: selectedRegionId,
      item_id: item.item_id,
      price: price,
      quantity: quantity,
      expires_in_hours: 48, // Default 48 hours
    });
  };

  // Calculate profit/loss percentage
  const calculateProfitLoss = () => {
    if (!price) return null;
    const sellPrice = parseFloat(price);
    const diff = sellPrice - acquiredPrice;
    const percentage = (diff / acquiredPrice) * 100;
    return { diff, percentage };
  };

  const profitLoss = calculateProfitLoss();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Sell Item</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Item Info */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{getCategoryIcon(itemInfo.category)}</span>
              <div className="flex-1">
                <h3 className={`font-medium ${getRarityColor(itemInfo.rarity)}`}>
                  {itemInfo.name}
                </h3>
                <p className="text-sm text-slate-400">{itemInfo.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <span className="text-slate-400">Available:</span>
                <span className="ml-2 text-white">{item.quantity}</span>
              </div>
              <div>
                <span className="text-slate-400">Acquired at:</span>
                <span className="ml-2 text-white">{acquiredPrice.toFixed(2)} gold</span>
              </div>
            </div>
          </div>

          {/* Region Selection */}
          <FormField
            label="Select Market Region"
            error={touched.region ? errors.region : undefined}
            required
          >
            {regionsLoading ? (
              <div className="animate-pulse bg-slate-700 h-10 rounded"></div>
            ) : (
              <select
                value={selectedRegionId}
                onChange={(e) => handleRegionChange(e.target.value)}
                onBlur={() => handleBlur('region')}
                className={`input ${touched.region && errors.region ? 'border-red-500' : ''}`}
              >
                <option value="">Choose a region...</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} (Tax: {parseFloat(region.tax_rate)}%)
                  </option>
                ))}
              </select>
            )}
          </FormField>

          {/* Price Input */}
          <FormField
            label="Price per unit (gold)"
            error={touched.price ? errors.price : undefined}
            required
          >
            <Input
              type="text"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={() => handleBlur('price')}
              placeholder="Enter price..."
              error={touched.price && !!errors.price}
            />
            {profitLoss && !errors.price && (
              <div className="mt-1 text-sm">
                {profitLoss.diff >= 0 ? (
                  <span className="text-green-400">
                    +{profitLoss.diff.toFixed(2)} gold ({profitLoss.percentage.toFixed(1)}% profit)
                  </span>
                ) : (
                  <span className="text-red-400">
                    {profitLoss.diff.toFixed(2)} gold ({profitLoss.percentage.toFixed(1)}% loss)
                  </span>
                )}
              </div>
            )}
          </FormField>

          {/* Quantity Input */}
          <FormField
            label="Quantity"
            error={touched.quantity ? errors.quantity : undefined}
            required
          >
            <Input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))}
              onBlur={() => handleBlur('quantity')}
              error={touched.quantity && !!errors.quantity}
            />
            <p className="text-xs text-gray-400 mt-1">Max available: {item.quantity}</p>
          </FormField>

          {/* Summary */}
          {price && quantity > 0 && selectedRegionId && (
            <div className="bg-slate-700 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Listing Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Revenue:</span>
                  <span className="text-white">{(parseFloat(price) * quantity).toFixed(2)} gold</span>
                </div>
                {selectedRegionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Market Tax:</span>
                    <span className="text-red-400">
                      -{(parseFloat(price) * quantity * parseFloat(regions.find(r => r.id === selectedRegionId)?.tax_rate || '0') / 100).toFixed(2)} gold
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-600 pt-1 mt-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-white">Net Profit:</span>
                    <span className="text-dynasty-400 font-bold">
                      {(parseFloat(price) * quantity * (1 - parseFloat(regions.find(r => r.id === selectedRegionId)?.tax_rate || '0') / 100)).toFixed(2)} gold
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={createListingMutation.isPending || Object.keys(errors).length > 0}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}