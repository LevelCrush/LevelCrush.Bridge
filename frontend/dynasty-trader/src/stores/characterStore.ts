import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CharacterStore {
  selectedCharacterId: string | null;
  setSelectedCharacterId: (characterId: string | null) => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      selectedCharacterId: null,
      setSelectedCharacterId: (characterId) => set({ selectedCharacterId: characterId }),
    }),
    {
      name: 'character-store',
    }
  )
);