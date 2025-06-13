import { api } from '@/lib/api';
import { Dynasty, CreateDynastyRequest, DynastyStats, DynastyLineage } from '@/types';

export const dynastyService = {
  async getMyDynasty(): Promise<Dynasty | null> {
    try {
      const response = await api.get<{ dynasty: Dynasty }>('/dynasties/me');
      return response.dynasty;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // User has no dynasty yet
      }
      throw error;
    }
  },

  async createDynasty(request: CreateDynastyRequest): Promise<Dynasty> {
    const response = await api.post<{ dynasty: Dynasty }>('/dynasties', request);
    return response.dynasty;
  },

  async getDynasty(id: string): Promise<Dynasty> {
    const response = await api.get<{ dynasty: Dynasty }>(`/dynasties/${id}`);
    return response.dynasty;
  },

  async getDynastyStats(): Promise<DynastyStats> {
    const response = await api.get<{ stats: DynastyStats }>('/dynasties/me/stats');
    return response.stats;
  },

  async getLeaderboard(metric: string, limit?: number): Promise<Dynasty[]> {
    const params = new URLSearchParams({ metric });
    if (limit) params.append('limit', limit.toString());
    
    const response = await api.get<{ dynasties: Dynasty[] }>(`/dynasties/leaderboard?${params}`);
    return response.dynasties;
  },

  async modifyReputation(amount: number, reason: string): Promise<void> {
    await api.put('/dynasties/me/reputation', { amount, reason });
  },
};