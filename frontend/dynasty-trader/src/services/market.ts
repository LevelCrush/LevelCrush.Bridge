import { api } from '@/lib/api';
import { 
  MarketRegion, 
  MarketListing, 
  MarketStats, 
  MarketEvent,
  MarketPrice,
  CreateMarketListingRequest,
  PurchaseRequest 
} from '@/types';

export const marketService = {
  // Get all regions
  async getRegions(): Promise<MarketRegion[]> {
    const response = await api.get<{ regions: MarketRegion[] }>('/market/regions');
    return response.regions;
  },

  // Get listings for a region
  async getRegionListings(regionId: string, itemType?: string, minPrice?: number, maxPrice?: number): Promise<MarketListing[]> {
    const params = new URLSearchParams();
    if (itemType) params.append('item_type', itemType);
    if (minPrice !== undefined) params.append('min_price', minPrice.toString());
    if (maxPrice !== undefined) params.append('max_price', maxPrice.toString());
    
    const response = await api.get<{ listings: MarketListing[] }>(
      `/market/regions/${regionId}/listings${params.toString() ? `?${params}` : ''}`
    );
    return response.listings;
  },

  // Get market stats for a region
  async getMarketStats(regionId: string): Promise<MarketStats> {
    const response = await api.get<{ stats: MarketStats }>(`/market/regions/${regionId}/stats`);
    return response.stats;
  },

  // Get trade routes from a region
  async getTradeRoutes(regionId: string): Promise<any[]> {
    const response = await api.get<{ routes: any[] }>(`/market/regions/${regionId}/routes`);
    return response.routes;
  },

  // Get price history for an item in a region
  async getPriceHistory(regionId: string, itemId: string, days: number = 7): Promise<MarketPrice[]> {
    const response = await api.get<{ history: MarketPrice[] }>(
      `/market/regions/${regionId}/items/${itemId}/history?days=${days}`
    );
    return response.history;
  },

  // Get recent market events
  async getMarketEvents(regionId?: string, limit: number = 10): Promise<MarketEvent[]> {
    const params = new URLSearchParams();
    if (regionId) params.append('region_id', regionId);
    params.append('limit', limit.toString());
    
    const response = await api.get<{ events: MarketEvent[] }>(
      `/market/events?${params}`
    );
    return response.events;
  },

  // Create a new listing
  async createListing(request: CreateMarketListingRequest): Promise<MarketListing> {
    const response = await api.post<{ listing: MarketListing }>('/market/listings', request);
    return response.listing;
  },

  // Purchase a listing
  async purchaseListing(request: PurchaseRequest): Promise<void> {
    await api.post('/market/purchase', request);
  },
};