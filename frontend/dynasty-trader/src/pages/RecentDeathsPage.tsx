import { useQuery } from '@tanstack/react-query';
import { Skull, TrendingDown, Package, Coins, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { formatCurrency, formatRelativeTime } from '@/utils/formatting';

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

export default function RecentDeathsPage() {
  const { data: deathsData, isLoading } = useQuery({
    queryKey: ['recent-deaths'],
    queryFn: async () => {
      const response = await api.get<{
        recent_deaths: DeathEvent[];
        count: number;
      }>('/deaths/recent');
      return response;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <LoadingSkeleton className="h-8 w-64" />
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <LoadingSkeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const deaths = deathsData?.recent_deaths || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Skull className="w-8 h-8 text-red-400" />
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Recent Deaths</h1>
            <p className="text-slate-400">Track the fallen and their market impact</p>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Deaths (7 days)</p>
                <p className="text-2xl font-bold text-white">{deaths.length}</p>
              </div>
              <Skull className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Wealth Lost</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    deaths.reduce((sum, d) => sum + parseFloat(d.character_wealth), 0)
                  )}
                </p>
              </div>
              <Coins className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Ghost Listings</p>
                <p className="text-2xl font-bold text-white">
                  {deaths.reduce((sum, d) => sum + d.ghost_listings_created, 0)}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Deaths List */}
        <div className="space-y-4">
          {deaths.length === 0 ? (
            <div className="bg-slate-800/50 rounded-lg p-8 text-center">
              <Skull className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No recent deaths in the past 7 days</p>
              <p className="text-sm text-slate-500 mt-2">The dynasties prosper... for now</p>
            </div>
          ) : (
            deaths.map((death) => (
              <div
                key={death.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-red-900/50 transition-all"
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {death.character_name}
                        <span className="text-slate-400 font-normal ml-2">
                          Age {death.character_age}
                        </span>
                      </h3>
                      <p className="text-sm text-slate-400">
                        of {death.dynasty_name}
                      </p>
                      <p className="text-sm text-red-400 mt-1">
                        {death.death_cause}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Calendar className="w-4 h-4" />
                        {formatRelativeTime(death.died_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Wealth at Death</p>
                      <p className="font-semibold text-white">
                        {formatCurrency(parseFloat(death.character_wealth))}
                      </p>
                    </div>

                    {death.market_events_created > 0 && (
                      <div className="flex items-center gap-1 text-sm text-red-400">
                        <TrendingDown className="w-4 h-4" />
                        {death.market_events_created} market shocks
                      </div>
                    )}

                    {death.ghost_listings_created > 0 && (
                      <div className="flex items-center gap-1 text-sm text-purple-400">
                        <Package className="w-4 h-4" />
                        {death.ghost_listings_created} ghost listings
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}