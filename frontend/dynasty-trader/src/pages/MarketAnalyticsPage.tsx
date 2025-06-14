import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketService } from '@/services/market';
import { marketAnalyticsService } from '@/services/marketAnalytics';
import MarketAnalyticsDashboard from '@/components/MarketAnalyticsDashboard';
import { EnhancedPriceChart, TimeFrame, ChartType } from '@/components/EnhancedPriceChart';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Eye,
  Filter,
  Download,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ItemSelection {
  itemId: string;
  itemName: string;
  regionId: string;
  regionName: string;
}

export default function MarketAnalyticsPage() {
  const [selectedItem, setSelectedItem] = useState<ItemSelection | null>(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1D');
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('area');
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  const [selectedIndicators, setSelectedIndicators] = useState(['sma_7', 'sma_14']);

  // Fetch regions for item selection
  const { data: regions } = useQuery({
    queryKey: ['market', 'regions'],
    queryFn: marketService.getRegions,
  });

  // Fetch market overview for quick item selection
  const { data: marketOverview } = useQuery({
    queryKey: ['market-overview'],
    queryFn: marketAnalyticsService.getMarketOverview,
    refetchInterval: 30000,
  });

  // Fetch price data for selected item
  const { data: priceData, isLoading: priceLoading } = useQuery({
    queryKey: ['price-history', selectedItem?.regionId, selectedItem?.itemId, selectedTimeFrame],
    queryFn: async () => {
      if (!selectedItem) return [];
      const response = await marketService.getPriceHistory(
        selectedItem.regionId,
        selectedItem.itemId,
        { timeframe: selectedTimeFrame }
      );
      return response;
    },
    enabled: !!selectedItem,
    refetchInterval: 60000,
  });

  // Fetch technical indicators for selected item
  const { data: indicators } = useQuery({
    queryKey: ['technical-indicators', selectedItem?.regionId, selectedItem?.itemId, selectedTimeFrame],
    queryFn: async () => {
      if (!selectedItem) return [];
      return marketAnalyticsService.getTechnicalIndicators(
        selectedItem.regionId,
        selectedItem.itemId,
        { timeframe: selectedTimeFrame, indicators: true }
      );
    },
    enabled: !!selectedItem && selectedIndicators.length > 0,
    refetchInterval: 300000, // 5 minutes
  });

  const handleItemSelect = (item: ItemSelection) => {
    setSelectedItem(item);
  };

  const handleIndicatorToggle = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  const quickSelectItems = [
    ...(marketOverview?.top_gainers?.slice(0, 3) || []),
    ...(marketOverview?.top_losers?.slice(0, 3) || []),
    ...(marketOverview?.volatile_items?.slice(0, 2) || []),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Market Analytics</h1>
            <p className="text-slate-400 mt-1">
              Advanced market intelligence and trading insights for Dynasty Trader
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setShowAdvancedView(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
                  !showAdvancedView
                    ? "bg-dynasty-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={() => setShowAdvancedView(true)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors",
                  showAdvancedView
                    ? "bg-dynasty-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-700"
                )}
              >
                <TrendingUp className="w-4 h-4" />
                Advanced
              </button>
            </div>

            {/* Export Button */}
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview Mode */}
        {!showAdvancedView && <MarketAnalyticsDashboard />}

        {/* Advanced Mode */}
        {showAdvancedView && (
          <div className="space-y-6">
            {/* Item Selection */}
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-dynasty-400" />
                  Item & Region Selection
                </h3>
                {selectedItem && (
                  <div className="text-sm text-slate-400">
                    Analyzing: <span className="text-white font-medium">{selectedItem.itemName}</span> in{' '}
                    <span className="text-white font-medium">{selectedItem.regionName}</span>
                  </div>
                )}
              </div>

              {/* Quick Select */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Quick Select (Trending Items)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {quickSelectItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemSelect({
                        itemId: item.item_id,
                        itemName: item.item_name,
                        regionId: regions?.[0]?.id || '', // Default to first region
                        regionName: regions?.[0]?.name || '',
                      })}
                      className="flex items-center justify-between p-3 bg-slate-750 rounded-lg border border-slate-600 hover:border-dynasty-500 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{item.item_name}</p>
                        <p className="text-xs text-slate-400">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-white">{item.current_price ? parseFloat(item.current_price).toFixed(2) : '0.00'}</p>
                        <p className={cn(
                          "text-xs",
                          parseFloat(item.price_change_percent) >= 0 ? "text-green-400" : "text-red-400"
                        )}>
                          {parseFloat(item.price_change_percent) >= 0 ? '+' : ''}{item.price_change_percent ? parseFloat(item.price_change_percent).toFixed(1) : '0.0'}%
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Region Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Region</label>
                  <select
                    value={selectedItem?.regionId || ''}
                    onChange={(e) => {
                      const region = regions?.find(r => r.id === e.target.value);
                      if (region && selectedItem) {
                        setSelectedItem({
                          ...selectedItem,
                          regionId: region.id,
                          regionName: region.name,
                        });
                      }
                    }}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                  >
                    <option value="">Select Region</option>
                    {regions?.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Item</label>
                  <input
                    type="text"
                    placeholder="Search items..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Chart */}
            {selectedItem && (
              <div className="space-y-4">
                {priceLoading ? (
                  <LoadingSkeleton className="h-96" />
                ) : (
                  <EnhancedPriceChart
                    data={priceData || []}
                    indicators={indicators || []}
                    timeFrame={selectedTimeFrame}
                    chartType={selectedChartType}
                    onTimeFrameChange={setSelectedTimeFrame}
                    onChartTypeChange={setSelectedChartType}
                    showVolume={true}
                    showIndicators={selectedIndicators.length > 0}
                    selectedIndicators={selectedIndicators}
                    onIndicatorToggle={handleIndicatorToggle}
                    height={500}
                    isLoading={priceLoading}
                  />
                )}

                {/* Chart Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Price Summary */}
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Price Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current:</span>
                        <span className="text-white font-mono">
                          {priceData?.[priceData.length - 1]?.close?.toFixed(2) || '--'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">24h High:</span>
                        <span className="text-green-400 font-mono">
                          {Math.max(...(priceData?.map(p => p.high) || [0])).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">24h Low:</span>
                        <span className="text-red-400 font-mono">
                          {Math.min(...(priceData?.map(p => p.low) || [0])).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">24h Volume:</span>
                        <span className="text-blue-400 font-mono">
                          {(priceData?.reduce((sum, p) => sum + p.volume, 0) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Analysis */}
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-dynasty-400" />
                      Technical Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                      {indicators?.length > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-400">RSI:</span>
                            <span className={cn(
                              "font-mono",
                              indicators[indicators.length - 1]?.rsi > 70 ? "text-red-400" :
                              indicators[indicators.length - 1]?.rsi < 30 ? "text-green-400" : "text-yellow-400"
                            )}>
                              {indicators[indicators.length - 1]?.rsi?.toFixed(1) || '--'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SMA 7:</span>
                            <span className="text-blue-400 font-mono">
                              {indicators[indicators.length - 1]?.sma_7?.toFixed(2) || '--'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">SMA 14:</span>
                            <span className="text-purple-400 font-mono">
                              {indicators[indicators.length - 1]?.sma_14?.toFixed(2) || '--'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Market Sentiment */}
                  <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-orange-400" />
                      Market Sentiment
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Trend:</span>
                        <span className="text-green-400">Bullish</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Volatility:</span>
                        <span className="text-yellow-400">Moderate</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Liquidity:</span>
                        <span className="text-blue-400">High</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder when no item selected */}
            {!selectedItem && (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
                <Eye className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Select an Item to Analyze</h3>
                <p className="text-slate-400">
                  Choose an item and region from the selection panel above to view detailed analytics
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}