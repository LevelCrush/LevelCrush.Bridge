import { api } from '@/lib/api';

interface DeathEvent {
  id: string;
  character_name: string;
  character_age: number;
  dynasty_name: string;
  death_cause: string;
  character_wealth: string;
  net_inheritance: string;
  market_events_created: number;
  ghost_listings_created: number;
  died_at: string;
}

export const deathService = {
  async getRecentDeaths(): Promise<{ recent_deaths: DeathEvent[]; count: number }> {
    return api.get('/deaths/recent');
  },

  async getDynastyDeathStats(dynastyId: string) {
    return api.get(`/deaths/dynasty/${dynastyId}/stats`);
  },
};