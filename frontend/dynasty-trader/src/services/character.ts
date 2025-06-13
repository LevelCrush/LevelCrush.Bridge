import { api } from '@/lib/api';
import { Character, CreateCharacterRequest, CharacterStats, CharacterInventory } from '@/types';

export const characterService = {
  async createCharacter(request: CreateCharacterRequest): Promise<Character> {
    // Temporary: Return a mock character since the endpoint has issues
    console.warn('Character creation endpoint temporarily disabled, returning mock character');
    return {
      id: crypto.randomUUID(),
      dynasty_id: request.dynasty_id,
      name: request.name,
      birth_date: new Date().toISOString(),
      age: 18,
      health: 75,
      max_health: 100,
      stamina: 75,
      max_stamina: 100,
      charisma: 60,
      intelligence: 60,
      luck: 50,
      location_id: null,
      is_alive: true,
      generation: 1,
      parent_character_id: null,
      inheritance_received: '0',
      wealth: '100',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Character;
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
};