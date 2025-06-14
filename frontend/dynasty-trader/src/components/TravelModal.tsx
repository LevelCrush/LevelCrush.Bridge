import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketService } from '@/services/market';
import { characterService } from '@/services/character';
import { Character, MarketRegion } from '@/types';
import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface TravelModalProps {
  character: Character;
  isOpen: boolean;
  onClose: () => void;
  onTravelSuccess?: (updatedCharacter: Character) => void;
}

export default function TravelModal({ character, isOpen, onClose, onTravelSuccess }: TravelModalProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch regions
  const { data: regions = [], isLoading: regionsLoading } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
    enabled: isOpen,
  });

  // Travel mutation
  const travelMutation = useMutation({
    mutationFn: () => characterService.travelToRegion(character.id, selectedRegionId),
    onSuccess: (updatedCharacter) => {
      toast.success(`${character.name} traveled to ${regions.find(r => r.id === selectedRegionId)?.name}!`);
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', character.id] });
      queryClient.invalidateQueries({ queryKey: ['character', character.id, 'stats'] });
      
      // Update the character data in the cache immediately
      queryClient.setQueryData(['characters'], (oldData: Character[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(char => 
          char.id === character.id ? { ...char, location_id: selectedRegionId } : char
        );
      });
      
      // Call the success callback if provided
      if (onTravelSuccess) {
        onTravelSuccess({ ...character, location_id: selectedRegionId });
      }
      
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to travel');
    },
  });

  const handleTravel = () => {
    if (!selectedRegionId) {
      toast.error('Please select a destination');
      return;
    }
    travelMutation.mutate();
  };

  if (!isOpen) return null;

  const currentRegion = regions.find(r => r.id === character.location_id);
  const availableRegions = regions.filter(r => r.id !== character.location_id);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <MapPinIcon className="h-6 w-6 mr-2 text-dynasty-400" />
            Travel to New Region
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Character Info */}
          <div className="bg-slate-700 rounded-lg p-4">
            <p className="text-sm text-slate-400">Traveling Character</p>
            <p className="font-medium text-white">{character.name}</p>
            {currentRegion && (
              <p className="text-sm text-slate-400 mt-1">
                Currently in: <span className="text-white">{currentRegion.name}</span>
              </p>
            )}
          </div>

          {/* Region Selection */}
          <div>
            <label className="label">Select Destination</label>
            {regionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dynasty-500"></div>
              </div>
            ) : (
              <select
                value={selectedRegionId}
                onChange={(e) => setSelectedRegionId(e.target.value)}
                className="input w-full"
                disabled={travelMutation.isPending}
              >
                <option value="">Choose a region...</option>
                {availableRegions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name} (Safety: {region.safety_level}%, Tax: {(parseFloat(region.tax_rate) * 100).toFixed(1)}%)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Region Details */}
          {selectedRegionId && (
            <div className="bg-slate-700 rounded-lg p-4">
              {(() => {
                const selectedRegion = regions.find(r => r.id === selectedRegionId);
                if (!selectedRegion) return null;
                
                return (
                  <>
                    <h4 className="font-medium text-white mb-2">{selectedRegion.name}</h4>
                    <p className="text-sm text-slate-400">{selectedRegion.description}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <div>
                        <span className="text-slate-400">Safety Level:</span>
                        <span className={`ml-1 font-medium ${
                          selectedRegion.safety_level >= 80 ? 'text-green-400' :
                          selectedRegion.safety_level >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {selectedRegion.safety_level}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Prosperity:</span>
                        <span className={`ml-1 font-medium ${
                          selectedRegion.prosperity_level >= 80 ? 'text-green-400' :
                          selectedRegion.prosperity_level >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {selectedRegion.prosperity_level}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tax Rate:</span>
                        <span className="ml-1 font-medium text-white">
                          {(parseFloat(selectedRegion.tax_rate) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={travelMutation.isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleTravel}
            className="btn-primary"
            disabled={!selectedRegionId || travelMutation.isPending}
          >
            {travelMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Traveling...
              </>
            ) : (
              <>
                <MapPinIcon className="h-5 w-5 mr-2" />
                Travel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}