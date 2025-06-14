import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { characterService } from '@/services/character';
import { marketService } from '@/services/market';
import { Character, CharacterStats } from '@/types';
import CharacterInventory from '@/components/CharacterInventory';
import TransactionHistory from '@/components/TransactionHistory';
import TravelModal from '@/components/TravelModal';
import { useCharacterStore } from '@/stores/characterStore';
import { 
  UserIcon, 
  HeartIcon, 
  SparklesIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CharacterPage() {
  const navigate = useNavigate();
  const setSelectedCharacterId = useCharacterStore((state) => state.setSelectedCharacterId);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showTravelModal, setShowTravelModal] = useState(false);

  // Fetch all dynasty characters
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: characterService.getDynastyCharacters,
  });

  // Fetch stats for selected character
  const { data: characterStats, isLoading: statsLoading } = useQuery({
    queryKey: ['character', selectedCharacter?.id, 'stats'],
    queryFn: () => characterService.getCharacterStats(selectedCharacter!.id),
    enabled: !!selectedCharacter,
  });

  // Fetch regions
  const { data: regions = [] } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Set initial selected character
  useEffect(() => {
    if (characters.length > 0 && !selectedCharacter) {
      const aliveCharacters = characters.filter(c => c.is_alive);
      if (aliveCharacters.length > 0) {
        setSelectedCharacter(aliveCharacters[0]);
      }
    }
  }, [characters, selectedCharacter]);

  const livingCharacters = characters.filter(c => c.is_alive);
  const deadCharacters = characters.filter(c => !c.is_alive);

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const now = new Date();
    const years = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365));
    return years;
  };

  const getHealthColor = (health: number) => {
    if (health >= 80) return 'text-green-400';
    if (health >= 50) return 'text-yellow-400';
    if (health >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStatBar = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    return (
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className="bg-dynasty-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };

  if (charactersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dynasty-500"></div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-white">No characters yet</h3>
            <p className="mt-1 text-sm text-slate-400">Create your first character to begin your trading empire.</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Characters</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-slate-300">Manage your dynasty's characters and their trading ventures.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Character List */}
          <div className="lg:col-span-1">
            <div className="card">
              <h2 className="text-lg font-medium text-white mb-4">Dynasty Members</h2>
              
              {livingCharacters.length > 0 && (
                <div className="space-y-2 mb-4">
                  <h3 className="text-sm font-medium text-slate-400">Living ({livingCharacters.length})</h3>
                  {livingCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setSelectedCharacter(character)}
                      className={`w-full text-left p-2 sm:p-3 rounded-lg transition-colors ${
                        selectedCharacter?.id === character.id
                          ? 'bg-dynasty-600 border border-dynasty-500'
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{character.name}</p>
                          <p className="text-sm text-slate-400">
                            Age {calculateAge(character.birth_date)} • Gen {character.generation}
                          </p>
                          {character.location_id && (
                            <p className="text-xs text-slate-500 flex items-center mt-1">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              {regions.find(r => r.id === character.location_id)?.name || 'Unknown'}
                            </p>
                          )}
                        </div>
                        <HeartIcon className={`h-5 w-5 ${getHealthColor(character.health)}`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {deadCharacters.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-slate-400">Deceased ({deadCharacters.length})</h3>
                  {deadCharacters.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => setSelectedCharacter(character)}
                      className={`w-full text-left p-3 rounded-lg transition-colors opacity-60 ${
                        selectedCharacter?.id === character.id
                          ? 'bg-slate-700 border border-slate-600'
                          : 'bg-slate-800 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-300">{character.name}</p>
                          <p className="text-sm text-slate-500">
                            Died at {calculateAge(character.birth_date)} • {character.death_cause || 'Unknown'}
                          </p>
                        </div>
                        <span className="text-xl">💀</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Character Details */}
          {selectedCharacter && (
            <div className="lg:col-span-2 space-y-6">
              {/* Character Overview */}
              <div className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedCharacter.name}</h2>
                    <p className="text-slate-400">
                      Generation {selectedCharacter.generation} • Age {calculateAge(selectedCharacter.birth_date)}
                      {!selectedCharacter.is_alive && ' • Deceased'}
                    </p>
                  </div>
                  {selectedCharacter.is_alive && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowTravelModal(true)}
                        className="btn-secondary flex items-center"
                      >
                        <MapPinIcon className="-ml-1 mr-2 h-5 w-5" />
                        Travel
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCharacterId(selectedCharacter.id);
                          navigate('/market');
                        }}
                        className="btn-primary flex items-center"
                      >
                        <CurrencyDollarIcon className="-ml-1 mr-2 h-5 w-5" />
                        Trade
                      </button>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400 flex items-center">
                        <HeartIcon className="h-4 w-4 mr-1" />
                        Health
                      </span>
                      <span className={`text-sm font-medium ${getHealthColor(selectedCharacter.health)}`}>
                        {selectedCharacter.health}/{selectedCharacter.max_health || 100}
                      </span>
                    </div>
                    {getStatBar(selectedCharacter.health, selectedCharacter.max_health || 100)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400 flex items-center">
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        Stamina
                      </span>
                      <span className="text-sm font-medium text-white">
                        {selectedCharacter.stamina}/{selectedCharacter.max_stamina || 100}
                      </span>
                    </div>
                    {getStatBar(selectedCharacter.stamina, selectedCharacter.max_stamina || 100)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400 flex items-center">
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                        Charisma
                      </span>
                      <span className="text-sm font-medium text-white">{selectedCharacter.charisma}</span>
                    </div>
                    {getStatBar(selectedCharacter.charisma)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400 flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        Intelligence
                      </span>
                      <span className="text-sm font-medium text-white">{selectedCharacter.intelligence}</span>
                    </div>
                    {getStatBar(selectedCharacter.intelligence)}
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400 flex items-center">
                        <span className="text-lg mr-1">🍀</span>
                        Luck
                      </span>
                      <span className="text-sm font-medium text-white">{selectedCharacter.luck}</span>
                    </div>
                    {getStatBar(selectedCharacter.luck)}
                  </div>
                </div>
              </div>

              {/* Character Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-medium text-white mb-3">Wealth & Trade</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Current Wealth</span>
                      <span className="font-medium text-white">
                        {parseFloat(characterStats?.wealth || selectedCharacter.wealth || '0').toLocaleString()} gold
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Trading Bonus</span>
                      <span className="font-medium text-green-400">
                        +{((characterStats?.trading_bonus || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    {selectedCharacter.inheritance_received && parseFloat(selectedCharacter.inheritance_received) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Inheritance</span>
                        <span className="font-medium text-dynasty-400">
                          {parseFloat(selectedCharacter.inheritance_received).toLocaleString()} gold
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-medium text-white mb-3">Location & Time</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Location
                      </span>
                      <span className="font-medium text-white">
                        {selectedCharacter.location_id 
                          ? regions.find(r => r.id === selectedCharacter.location_id)?.name || 'Unknown'
                          : 'Capital City'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Born
                      </span>
                      <span className="font-medium text-white">
                        {new Date(selectedCharacter.birth_date).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedCharacter.death_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Died</span>
                        <span className="font-medium text-white">
                          {new Date(selectedCharacter.death_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Character Inventory */}
              <CharacterInventory character={selectedCharacter} />

              {/* Transaction History */}
              <TransactionHistory character={selectedCharacter} />

              {/* Actions */}
              {selectedCharacter.is_alive && (
                <div className="card">
                  <h3 className="text-lg font-medium text-white mb-3">Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setSelectedCharacterId(selectedCharacter.id);
                        navigate('/market');
                      }}
                      className="btn-secondary text-sm"
                    >
                      Visit Market
                    </button>
                    <button
                      onClick={() => setShowTravelModal(true)}
                      className="btn-secondary text-sm"
                    >
                      Travel
                    </button>
                    <button
                      onClick={() => {
                        const inventorySection = document.querySelector('[data-inventory-section]');
                        inventorySection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      className="btn-secondary text-sm"
                    >
                      View Inventory
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Travel Modal */}
      {selectedCharacter && (
        <TravelModal
          character={selectedCharacter}
          isOpen={showTravelModal}
          onClose={() => setShowTravelModal(false)}
          onTravelSuccess={(updatedCharacter) => {
            // Update the selected character with new location
            setSelectedCharacter(updatedCharacter);
          }}
        />
      )}
    </div>
  );
}