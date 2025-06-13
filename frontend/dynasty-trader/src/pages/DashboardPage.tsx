import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dynastyService } from '@/services/dynasty';
import { characterService } from '@/services/character';
import { Dynasty, Character } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, UserGroupIcon, UserIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { CharacterCardSkeleton, StatCardSkeleton } from '@/components/LoadingSkeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDynastyModal, setShowDynastyModal] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [dynastyForm, setDynastyForm] = useState({ name: '', motto: '' });
  const [characterForm, setCharacterForm] = useState({ name: '' });

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
      toast.success(`Character "${newCharacter.name}" created!`);
      navigate('/character');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create character');
    },
  });

  const handleCreateDynasty = (e: React.FormEvent) => {
    e.preventDefault();
    createDynastyMutation.mutate(dynastyForm);
  };

  const handleCreateCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (dynasty) {
      createCharacterMutation.mutate({
        dynasty_id: dynasty.id,
        name: characterForm.name,
      });
    }
  };

  const livingCharacters = characters.filter(c => !c.died_at);
  const deadCharacters = characters.filter(c => c.died_at);

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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-lg font-medium text-white">No dynasty yet</h3>
            <p className="mt-1 text-sm text-slate-400">Get started by creating your trading dynasty.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowDynastyModal(true)}
                className="btn-primary"
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white">{dynasty.name}</h1>
          {dynasty.motto && (
            <p className="mt-1 text-lg text-slate-400 italic">"{dynasty.motto}"</p>
          )}
          <div className="mt-4 flex items-center space-x-6 text-sm text-slate-300">
            <span>Generation {dynasty.generation}</span>
            <span>•</span>
            <span>Founded {new Date(dynasty.founded_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Reputation: {dynasty.reputation}</span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <UserIcon className="h-10 w-10 text-dynasty-400" />
              <div className="ml-4">
                <p className="text-sm text-slate-400">Living Characters</p>
                <p className="text-2xl font-bold text-white">{livingCharacters.length}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-10 w-10 text-green-400" />
              <div className="ml-4">
                <p className="text-sm text-slate-400">Dynasty Wealth</p>
                <p className="text-2xl font-bold text-white">{parseFloat(dynasty.total_wealth).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <UserGroupIcon className="h-10 w-10 text-blue-400" />
              <div className="ml-4">
                <p className="text-sm text-slate-400">Total Characters</p>
                <p className="text-2xl font-bold text-white">{dynasty.total_characters}</p>
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                <span className="text-xl">💀</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-slate-400">Deceased</p>
                <p className="text-2xl font-bold text-white">{deadCharacters.length}</p>
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
              className="btn-primary"
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