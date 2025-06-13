import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { MarketListing, Character, ItemCategory, ItemRarity } from '@/types';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';

interface PurchaseConfirmationModalProps {
  listing: MarketListing | null;
  characters: Character[];
  onConfirm: (characterId: string, quantity: number) => void;
  onCancel: () => void;
}

export default function PurchaseConfirmationModal({
  listing,
  characters,
  onConfirm,
  onCancel
}: PurchaseConfirmationModalProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(
    characters.find(c => c.is_alive)?.id || ''
  );
  const [quantity, setQuantity] = useState(1);

  if (!listing) return null;

  const itemInfo = listing.item_name ? {
    name: listing.item_name,
    description: listing.item_description || 'A valuable trade good',
    category: (listing.item_category as ItemCategory) || ItemCategory.Material,
    rarity: (listing.item_rarity as ItemRarity) || ItemRarity.Common
  } : getItemInfo(listing.item_id);
  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);
  const livingCharacters = characters.filter(c => c.is_alive);
  
  const unitPrice = parseFloat(listing.price);
  const totalPrice = unitPrice * quantity;
  const characterWealth = selectedCharacter?.inheritance_received ? parseFloat(selectedCharacter.inheritance_received) : 0;
  const canAfford = characterWealth >= totalPrice;

  const handleConfirm = () => {
    if (canAfford && selectedCharacterId) {
      onConfirm(selectedCharacterId, quantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-md w-full">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Item Info */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">{getCategoryIcon(itemInfo.category)}</span>
              <div>
                <h3 className={`font-medium ${getRarityColor(itemInfo.rarity)}`}>
                  {itemInfo.name}
                </h3>
                <p className="text-sm text-slate-400">{itemInfo.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <span className="text-slate-400">Unit Price:</span>
                <span className="ml-2 text-white">{unitPrice.toLocaleString()} gold</span>
              </div>
              <div>
                <span className="text-slate-400">Available:</span>
                <span className="ml-2 text-white">{listing.quantity}</span>
              </div>
            </div>
          </div>

          {/* Character Selection */}
          <div className="mb-4">
            <label className="label">Select Character</label>
            {livingCharacters.length === 0 ? (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 text-sm text-red-300">
                No living characters available to make purchases
              </div>
            ) : (
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="input"
              >
                {livingCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name} - {parseFloat(character.inheritance_received || '0').toLocaleString()} gold
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quantity Selection */}
          <div className="mb-4">
            <label className="label">Quantity</label>
            <input
              type="number"
              min="1"
              max={listing.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(listing.quantity, parseInt(e.target.value) || 1)))}
              className="input"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-slate-700 rounded-lg p-4 mb-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Price per unit</span>
                <span className="text-white">{unitPrice.toLocaleString()} gold</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity</span>
                <span className="text-white">×{quantity}</span>
              </div>
              <div className="border-t border-slate-600 pt-2">
                <div className="flex justify-between">
                  <span className="font-medium text-white">Total Cost</span>
                  <span className="text-xl font-bold text-dynasty-400">
                    {totalPrice.toLocaleString()} gold
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Wealth Check */}
          {selectedCharacter && (
            <div className={`rounded-lg p-3 mb-4 ${canAfford ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}>
              <div className="flex items-center">
                {!canAfford && <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />}
                <div className="text-sm">
                  <p className={canAfford ? 'text-green-300' : 'text-red-300'}>
                    {selectedCharacter.name}'s wealth: {characterWealth.toLocaleString()} gold
                  </p>
                  {!canAfford && (
                    <p className="text-red-300 mt-1">
                      Insufficient funds (need {(totalPrice - characterWealth).toLocaleString()} more gold)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleConfirm}
              disabled={!canAfford || !selectedCharacterId || livingCharacters.length === 0}
              className="btn-primary flex-1"
            >
              Confirm Purchase
            </button>
            <button
              onClick={onCancel}
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