import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Activity,
  AlertTriangle,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Filter,
} from 'lucide-react';
import { marketService } from '@/services/market';
import { marketAnalyticsService } from '@/services/marketAnalytics';
import { EnhancedPriceChart, TimeFrame, ChartType } from './EnhancedPriceChart';
import LoadingSkeleton from './LoadingSkeleton';
import { cn } from '@/lib/utils';

interface MarketOverviewData {
  total_market_cap: string | number;
  total_volume_24h: string | number;
  active_listings: number;
  price_change_percent: string | number;
  top_gainers: Array<{
    item_name: string;
    price_change: string | number;
    price_change_percent: string | number;
    current_price: string | number;
    volume_24h: string | number;
  }>;
  top_losers: Array<{
    item_name: string;
    price_change: string | number;
    price_change_percent: string | number;
    current_price: string | number;
    volume_24h: string | number;
  }>;
  volatile_items: Array<{
    item_name: string;
    volatility: string | number;
    current_price: string | number;
    volume_24h: string | number;
  }>;
  arbitrage_opportunities: Array<{
    item_name: string;
    buy_region_name: string;
    sell_region_name: string;
    buy_price: string | number;
    sell_price: string | number;
    profit_margin: string | number;
    profit_after_taxes: string | number;
  }>;
}

interface RegionalData {
  region_id: string;
  region_name: string;
  total_volume_24h: string | number;
  avg_price_change: string | number;
  active_listings: number;
  market_health: 'strong' | 'moderate' | 'weak';
  dominant_categories: string[];
}

export default function MarketAnalyticsDashboard() {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('area');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showIndicators, setShowIndicators] = useState(false);
  const [selectedIndicators, setSelectedIndicators] = useState(['sma_7', 'sma_14']);

  // Fetch market overview data
  const { data: marketOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['market-overview'],
    queryFn: async (): Promise<MarketOverviewData> => {
      const response = await marketAnalyticsService.getMarketOverview();
      return response;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch regional data
  const { data: regions } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Fetch regional analytics
  const { data: regionalData, isLoading: regionalLoading } = useQuery({
    queryKey: ['market-regional-analytics'],
    queryFn: async (): Promise<RegionalData[]> => {
      const response = await marketAnalyticsService.getRegionalAnalytics();
      return response;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Calculate market sentiment
  const marketSentiment = useMemo(() => {
    if (!marketOverview) return 'neutral';
    
    const priceChange = parseFloat(marketOverview.price_change_percent);
    if (priceChange > 2) return 'bullish';
    if (priceChange < -2) return 'bearish';
    return 'neutral';
  }, [marketOverview]);

  // Format currency
  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0';
    if (numAmount >= 1000000) return `${(numAmount / 1000000).toFixed(1)}M`;
    if (numAmount >= 1000) return `${(numAmount / 1000).toFixed(1)}K`;
    return numAmount.toFixed(0);
  };

  // Format percentage
  const formatPercent = (percent: number | string) => {
    const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
    if (isNaN(numPercent)) return '0.00%';
    const sign = numPercent >= 0 ? '+' : '';
    return `${sign}${numPercent.toFixed(2)}%`;
  };

  // Market overview stats
  const overviewStats = useMemo(() => {
    if (!marketOverview) return [];

    return [
      {
        label: 'Market Cap',
        value: formatCurrency(marketOverview.total_market_cap),
        icon: DollarSign,
        change: marketOverview.price_change_percent,
        color: 'blue',
      },
      {
        label: '24h Volume',
        value: formatCurrency(marketOverview.total_volume_24h),
        icon: BarChart3,
        change: null,
        color: 'green',
      },
      {
        label: 'Active Listings',
        value: marketOverview.active_listings.toLocaleString(),
        icon: Activity,
        change: null,
        color: 'purple',
      },
      {
        label: 'Market Sentiment',
        value: marketSentiment.charAt(0).toUpperCase() + marketSentiment.slice(1),
        icon: marketSentiment === 'bullish' ? TrendingUp : marketSentiment === 'bearish' ? TrendingDown : Target,
        change: marketOverview.price_change_percent,
        color: marketSentiment === 'bullish' ? 'green' : marketSentiment === 'bearish' ? 'red' : 'gray',
      },
    ];
  }, [marketOverview, marketSentiment]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Market Analytics</h1>
          <p className="text-slate-400 mt-1">Advanced market intelligence and trading insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
          >
            <option value="all">All Regions</option>
            {regions?.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>

          {/* Refresh Indicator */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live Data
          </div>
        </div>
      </div>

      {/* Market Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewLoading ? (
          Array(4).fill(0).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))
        ) : (
          overviewStats.map((stat, index) => (
            <div key={index} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.change !== null && (
                    <div className={cn(
                      "flex items-center gap-1 mt-2 text-sm",
                      parseFloat(stat.change) >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {parseFloat(stat.change) >= 0 ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {formatPercent(stat.change)}
                    </div>
                  )}
                </div>
                <div className={cn(
                  "p-3 rounded-lg",
                  stat.color === 'blue' && "bg-blue-500/20 text-blue-400",
                  stat.color === 'green' && "bg-green-500/20 text-green-400",
                  stat.color === 'purple' && "bg-purple-500/20 text-purple-400",
                  stat.color === 'red' && "bg-red-500/20 text-red-400",
                  stat.color === 'gray' && "bg-slate-500/20 text-slate-400"
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Chart */}
      <div className="lg:col-span-2">
        <EnhancedPriceChart
          data={[]} // Would be populated with actual price data
          timeFrame={selectedTimeFrame}
          chartType={selectedChartType}
          onTimeFrameChange={setSelectedTimeFrame}
          onChartTypeChange={setSelectedChartType}
          showVolume={true}
          showIndicators={showIndicators}
          selectedIndicators={selectedIndicators}
          onIndicatorToggle={(indicator) => {
            setSelectedIndicators(prev => 
              prev.includes(indicator)
                ? prev.filter(i => i !== indicator)
                : [...prev, indicator]
            );
          }}
          height={450}
        />
      </div>

      {/* Market Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers/Losers */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Top Movers
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Gainers */}
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Top Gainers</h4>
              <div className="space-y-2">
                {marketOverview?.top_gainers.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.item_name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.volume_24h)} vol</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">{parseFloat(item.current_price).toFixed(2)}</p>
                      <p className="text-xs text-green-400">+{parseFloat(item.price_change_percent).toFixed(1)}%</p>
                    </div>
                  </div>
                )) || <LoadingSkeleton className="h-16" />}
              </div>
            </div>

            {/* Losers */}
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">Top Losers</h4>
              <div className="space-y-2">
                {marketOverview?.top_losers.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{item.item_name}</p>
                      <p className="text-xs text-slate-400">{formatCurrency(item.volume_24h)} vol</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">{parseFloat(item.current_price).toFixed(2)}</p>
                      <p className="text-xs text-red-400">{parseFloat(item.price_change_percent).toFixed(1)}%</p>
                    </div>
                  </div>
                )) || <LoadingSkeleton className="h-16" />}
              </div>
            </div>
          </div>
        </div>

        {/* Arbitrage Opportunities */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Arbitrage Opportunities
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {marketOverview?.arbitrage_opportunities.slice(0, 4).map((opportunity, index) => (
                <div key={index} className="bg-slate-750 rounded-lg p-3 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">{opportunity.item_name}</p>
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                      {parseFloat(opportunity.profit_margin).toFixed(1)}% profit
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Buy in {opportunity.buy_region_name}:</span>
                      <span className="text-white">{parseFloat(opportunity.buy_price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sell in {opportunity.sell_region_name}:</span>
                      <span className="text-white">{parseFloat(opportunity.sell_price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-600 pt-1">
                      <span>Profit after taxes:</span>
                      <span className="text-green-400 font-medium">+{parseFloat(opportunity.profit_after_taxes).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )) || <LoadingSkeleton className="h-32" />}
            </div>
          </div>
        </div>

        {/* Volatile Items */}
        <div className="bg-slate-800 rounded-lg border border-slate-700">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              High Volatility
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {marketOverview?.volatile_items.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.item_name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(item.volume_24h)} vol</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-white">{parseFloat(item.current_price).toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-400 rounded-full" />
                      <span className="text-xs text-orange-400">{parseFloat(item.volatility).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )) || <LoadingSkeleton className="h-20" />}
            </div>
          </div>
        </div>
      </div>

      {/* Regional Market Health */}
      <div className="bg-slate-800 rounded-lg border border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            Regional Market Health
          </h3>
        </div>
        <div className="p-4">
          {regionalLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <LoadingSkeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {regionalData?.map((region) => (
                <div key={region.region_id} className="bg-slate-750 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">{region.region_name}</h4>
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      region.market_health === 'strong' && "bg-green-400",
                      region.market_health === 'moderate' && "bg-yellow-400",
                      region.market_health === 'weak' && "bg-red-400"
                    )} />
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Volume:</span>
                      <span className="text-white">{formatCurrency(region.total_volume_24h)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Change:</span>
                      <span className={cn(
                        parseFloat(region.avg_price_change) >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {formatPercent(region.avg_price_change)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Listings:</span>
                      <span className="text-white">{region.active_listings}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-slate-500">Dominant:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {region.dominant_categories.slice(0, 2).map((category) => (
                        <span key={category} className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}