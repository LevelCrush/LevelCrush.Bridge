import { api } from '@/lib/api';
import { Character, CreateCharacterRequest, CharacterStats, CharacterInventory } from '@/types';

export const characterService = {
  async createCharacter(request: CreateCharacterRequest): Promise<Character> {
    const response = await api.post<{ character: Character }>('/characters', request);
    return response.character;
  },

  async getCharacter(id: string): Promise<Character> {
    const response = await api.get<{ character: Character }>(`/characters/${id}`);
    return response.character;
  },

  async getDynastyCharacters(): Promise<Character[]> {
    const response = await api.get<{ characters: Character[] }>('/characters');
    return response.characters;
  },

  async getCharacterStats(id: string): Promise<CharacterStats> {
    const response = await api.get<{ stats: CharacterStats }>(`/characters/${id}/stats`);
    return response.stats;
  },

  async processCharacterDeath(id: string, deathCause: string): Promise<void> {
    await api.post(`/characters/${id}/death`, { death_cause: deathCause });
  },

  async getCharacterInventory(id: string): Promise<CharacterInventory> {
    const response = await api.get<{ inventory: CharacterInventory }>(`/characters/${id}/inventory`);
    return response.inventory;
  },
};