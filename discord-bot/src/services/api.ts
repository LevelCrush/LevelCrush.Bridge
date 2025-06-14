import axios, { AxiosInstance } from 'axios';
import { config } from '../config/config.js';
import type { 
  Dynasty, 
  Character, 
  MarketRegion, 
  MarketListing, 
  MarketEvent,
  DeathEvent 
} from '../types/index.js';

class DynastyTraderAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.api.apiKey && { 'X-API-Key': config.api.apiKey }),
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Auth methods
  async getUserByDiscordId(discordId: string) {
    const response = await this.client.get(`/api/v2/users/discord/${discordId}`);
    return response.data;
  }

  async linkDiscordAccount(userId: string, discordId: string, accessToken: string) {
    const response = await this.client.post('/api/v2/users/link-discord', {
      user_id: userId,
      discord_id: discordId,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  // Dynasty methods
  async getDynasty(dynastyId: string) {
    const response = await this.client.get<Dynasty>(`/api/v2/dynasties/${dynastyId}`);
    return response.data;
  }

  async getDynastyByUserId(userId: string) {
    const response = await this.client.get<Dynasty>(`/api/v2/dynasties/user/${userId}`);
    return response.data;
  }

  async getLeaderboard(type: 'wealth' | 'reputation' | 'generation' = 'wealth', limit = 10) {
    const response = await this.client.get(`/api/v2/dynasties/leaderboard`, {
      params: { type, limit },
    });
    return response.data;
  }

  // Character methods
  async getCharacters(dynastyId: string) {
    const response = await this.client.get<Character[]>(`/api/v2/characters`, {
      params: { dynasty_id: dynastyId },
    });
    return response.data;
  }

  async getCharacter(characterId: string) {
    const response = await this.client.get<Character>(`/api/v2/characters/${characterId}`);
    return response.data;
  }

  async getCharacterInventory(characterId: string) {
    const response = await this.client.get(`/api/v2/characters/${characterId}/inventory`);
    return response.data;
  }

  async travelCharacter(characterId: string, destinationId: string, accessToken: string) {
    const response = await this.client.post(
      `/api/v2/characters/${characterId}/travel`,
      { destination_id: destinationId },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  // Market methods
  async getRegions() {
    const response = await this.client.get<MarketRegion[]>('/api/v2/market/regions');
    return response.data;
  }

  async getMarketListings(regionId: string, itemCategory?: string) {
    const response = await this.client.get<MarketListing[]>(
      `/api/v2/market/regions/${regionId}/listings`,
      {
        params: { category: itemCategory },
      }
    );
    return response.data;
  }

  async getMarketStats(regionId: string) {
    const response = await this.client.get(`/api/v2/market/regions/${regionId}/stats`);
    return response.data;
  }

  async getMarketEvents(regionId?: string) {
    const response = await this.client.get<MarketEvent[]>('/api/v2/market/events', {
      params: { region_id: regionId },
    });
    return response.data;
  }

  async createListing(
    characterId: string,
    regionId: string,
    itemId: string,
    quantity: number,
    price: string,
    accessToken: string
  ) {
    const response = await this.client.post(
      '/api/v2/market/listings',
      {
        character_id: characterId,
        region_id: regionId,
        item_id: itemId,
        quantity,
        price,
        expires_in_days: 7,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  async purchaseListing(listingId: string, quantity: number, accessToken: string) {
    const response = await this.client.post(
      '/api/v2/market/purchase',
      {
        listing_id: listingId,
        quantity,
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  async cancelListing(listingId: string, accessToken: string) {
    const response = await this.client.delete(`/api/v2/market/listings/${listingId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return response.data;
  }

  // Death events
  async getRecentDeaths(limit = 10) {
    const response = await this.client.get<DeathEvent[]>('/api/v2/deaths/recent', {
      params: { limit },
    });
    return response.data;
  }

  // WebSocket subscription info
  getWebSocketUrl() {
    const baseUrl = config.api.baseUrl.replace(/^http/, 'ws');
    return `${baseUrl}/ws/market`;
  }
}

export const dynastyTraderAPI = new DynastyTraderAPI();