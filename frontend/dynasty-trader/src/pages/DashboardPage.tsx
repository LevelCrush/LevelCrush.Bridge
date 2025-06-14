import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dynastyService } from '@/services/dynasty';
import { characterService } from '@/services/character';
import { marketService } from '@/services/market';
import { Dynasty, Character } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, UserGroupIcon, UserIcon, CurrencyDollarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { CharacterCardSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton';
import { FormField, Input, Textarea } from '@/components/FormField';
import { validateName, validateMotto } from '@/utils/validation';
import { useCharacterDeathListener } from '@/hooks/useCharacterDeathListener';

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Listen for character death events to refresh data
  useCharacterDeathListener();
  
  const [showDynastyModal, setShowDynastyModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [dynastyForm, setDynastyForm] = useState({ name: '', motto: '' });
  const [characterForm, setCharacterForm] = useState({ name: '' });
  const [dynastyErrors, setDynastyErrors] = useState<{ name?: string; motto?: string }>({});
  const [characterErrors, setCharacterErrors] = useState<{ name?: string }>({});
  const [dynastyTouched, setDynastyTouched] = useState<{ name?: boolean; motto?: boolean }>({});
  const [characterTouched, setCharacterTouched] = useState<{ name?: boolean }>({});

  // Fetch user's dynasty
  const { data: dynasty, isLoading: dynastyLoading } = useQuery({
    queryKey: ['dynasty', 'me'],
    queryFn: dynastyService.getMyDynasty,
  });

  // Fetch dynasty characters
  const { data: characters = [], isLoading: charactersLoading } = useQuery({
    queryKey: ['characters'],
    queryFn: characterService.getDynastyCharacters,
    enabled: !!dynasty,
  });

  // Fetch regions for location display
  const { data: regions = [] } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Create dynasty mutation
  const createDynastyMutation = useMutation({
    mutationFn: dynastyService.createDynasty,
    onSuccess: (newDynasty) => {
      queryClient.setQueryData(['dynasty', 'me'], newDynasty);
      setShowDynastyModal(false);
      setDynastyForm({ name: '', motto: '' });
      toast.success(`Dynasty "${newDynasty.name}" created!`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create dynasty');
    },
  });

  // Create character mutation
  const createCharacterMutation = useMutation({
    mutationFn: characterService.createCharacter,
    onSuccess: (newCharacter) => {
      queryClient.setQueryData(['characters'], [...characters, newCharacter]);
      setShowCharacterModal(false);
      setCharacterForm({ name: '' });
      setCharacterErrors({});
      setCharacterTouched({});
      toast.success(`Character "${newCharacter.name}" created!`);
      navigate('/character');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create character');
    },
  });

  const validateDynastyForm = () => {
    const errors: typeof dynastyErrors = {};
    
    const nameValidation = validateName(dynastyForm.name, 'Dynasty name');
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }
    
    const mottoValidation = validateMotto(dynastyForm.motto);
    if (!mottoValidation.isValid) {
      errors.motto = mottoValidation.error;
    }
    
    setDynastyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCharacterForm = () => {
    const errors: typeof characterErrors = {};
    
    const nameValidation = validateName(characterForm.name, 'Character name');
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }
    
    setCharacterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDynastyFieldChange = (field: 'name' | 'motto', value: string) => {
    setDynastyForm({ ...dynastyForm, [field]: value });
    
    // Clear error when user starts typing
    if (dynastyTouched[field] && dynastyErrors[field]) {
      setDynastyErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCharacterFieldChange = (value: string) => {
    setCharacterForm({ name: value });
    
    // Clear error when user starts typing
    if (characterTouched.name && characterErrors.name) {
      setCharacterErrors({ name: undefined });
    }
  };

  const handleDynastyBlur = (field: 'name' | 'motto') => {
    setDynastyTouched({ ...dynastyTouched, [field]: true });
    
    if (field === 'name') {
      const validation = validateName(dynastyForm.name, 'Dynasty name');
      setDynastyErrors(prev => ({ ...prev, name: validation.error }));
    } else if (field === 'motto') {
      const validation = validateMotto(dynastyForm.motto);
      setDynastyErrors(prev => ({ ...prev, motto: validation.error }));
    }
  };

  const handleCreateDynasty = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setDynastyTouched({ name: true, motto: true });
    
    if (!validateDynastyForm()) {
      return;
    }
    
    createDynastyMutation.mutate(dynastyForm);
  };

  const handleCreateCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dynasty) return;
    
    // Mark field as touched
    setCharacterTouched({ name: true });
    
    if (!validateCharacterForm()) {
      return;
    }
    
    createCharacterMutation.mutate({
      dynasty_id: dynasty.id,
      name: characterForm.name,
    });
  };

  const livingCharacters = characters.filter(c => c.is_alive);
  const deadCharacters = characters.filter(c => !c.is_alive);

  if (dynastyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dynasty-500"></div>
      </div>
    );
  }

  // No dynasty yet - show creation UI
  if (!dynasty) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-white">No dynasty yet</h3>
            <p className="mt-1 text-sm text-slate-400">Get started by creating your trading dynasty.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowDynastyModal(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Create Dynasty
              </button>
            </div>
          </div>
        </div>

        {/* Dynasty Creation Modal */}
        {showDynastyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-white mb-4">Create Your Dynasty</h3>
              <form onSubmit={handleCreateDynasty}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="dynasty-name" className="label">
                      Dynasty Name
                    </label>
                    <input
                      id="dynasty-name"
                      type="text"
                      required
                      className="input"
                      value={dynastyForm.name}
                      onChange={(e) => setDynastyForm({ ...dynastyForm, name: e.target.value })}
                      placeholder="House Goldwater"
                    />
                  </div>
                  <div>
                    <label htmlFor="dynasty-motto" className="label">
                      Motto (optional)
                    </label>
                    <input
                      id="dynasty-motto"
                      type="text"
                      className="input"
                      value={dynastyForm.motto}
                      onChange={(e) => setDynastyForm({ ...dynastyForm, motto: e.target.value })}
                      placeholder="Gold flows like water"
                    />
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={createDynastyMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createDynastyMutation.isPending ? 'Creating...' : 'Create Dynasty'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDynastyModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Has dynasty - show dashboard
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">{dynasty.name}</h1>
          {dynasty.motto && (
            <p className="mt-1 text-base sm:text-lg text-slate-400 italic">"{dynasty.motto}"</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-6 text-xs sm:text-sm text-slate-300">
            <span>Generation {dynasty.generation}</span>
            <span className="hidden sm:inline">•</span>
            <span>Founded {new Date(dynasty.founded_at).toLocaleDateString()}</span>
            <span className="hidden sm:inline">•</span>
            <span>Reputation: {dynasty.reputation}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6 lg:mb-8">
          <div className="card">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 text-dynasty-400 flex-shrink-0" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm text-slate-400">Living</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{livingCharacters.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 sm:h-10 sm:w-10 text-green-400 flex-shrink-0" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm text-slate-400">Wealth</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{parseFloat(dynasty.total_wealth).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400 flex-shrink-0" />
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm text-slate-400">Total</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{dynasty.total_characters}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-xl">💀</span>
              </div>
              <div className="ml-2 sm:ml-4">
                <p className="text-xs sm:text-sm text-slate-400">Deceased</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{deadCharacters.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Characters Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium text-white">Active Characters</h2>
            <button
              onClick={() => setShowCharacterModal(true)}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Character
            </button>
          </div>

          {charactersLoading ? (
            <div className="space-y-3">
              <CharacterCardSkeleton />
              <CharacterCardSkeleton />
            </div>
          ) : livingCharacters.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-slate-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No characters yet</h3>
              <p className="mt-1 text-sm text-slate-400">Create your first character to start trading.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {livingCharacters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors"
                  onClick={() => navigate('/character')}
                >
                  <div>
                    <h4 className="font-medium text-white">{character.name}</h4>
                    <p className="text-sm text-slate-400">
                      Gen {character.generation} • Health: {character.health}
                    </p>
                    {character.location_id && (
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <MapPinIcon className="h-3 w-3 mr-1" />
                        {regions.find(r => r.id === character.location_id)?.name || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">Wealth</p>
                    <p className="font-medium text-white">{character.wealth ? parseFloat(character.wealth).toLocaleString() : '0'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Character Creation Modal */}
        {showCharacterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-white mb-4">Create New Character</h3>
              <form onSubmit={handleCreateCharacter}>
                <div>
                  <label htmlFor="character-name" className="label">
                    Character Name
                  </label>
                  <input
                    id="character-name"
                    type="text"
                    required
                    className="input"
                    value={characterForm.name}
                    onChange={(e) => setCharacterForm({ name: e.target.value })}
                    placeholder="Marcus Goldwater"
                  />
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Your character will start in the capital region with basic supplies and a small amount of gold.
                </p>
                <div className="mt-6 flex space-x-3">
                  <button
                    type="submit"
                    disabled={createCharacterMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createCharacterMutation.isPending ? 'Creating...' : 'Create Character'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCharacterModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}