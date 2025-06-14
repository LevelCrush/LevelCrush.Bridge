import { useState, useMemo, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Candlestick,
  Eye,
  Settings,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  avg_price: number;
}

export interface TechnicalIndicator {
  timestamp: string;
  sma_7?: number;
  sma_14?: number;
  sma_30?: number;
  ema_7?: number;
  ema_14?: number;
  bollinger_upper?: number;
  bollinger_lower?: number;
  bollinger_middle?: number;
  rsi?: number;
  macd?: number;
  macd_signal?: number;
}

export type TimeFrame = '1H' | '4H' | '1D' | '1W' | '1M';
export type ChartType = 'area' | 'candlestick' | 'line';

interface EnhancedPriceChartProps {
  data: PricePoint[];
  indicators?: TechnicalIndicator[];
  timeFrame: TimeFrame;
  chartType: ChartType;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  onChartTypeChange: (chartType: ChartType) => void;
  isLoading?: boolean;
  height?: number;
  showVolume?: boolean;
  showIndicators?: boolean;
  selectedIndicators?: string[];
  onIndicatorToggle?: (indicator: string) => void;
  className?: string;
}

const timeFrameOptions: { value: TimeFrame; label: string; interval: string }[] = [
  { value: '1H', label: '1H', interval: 'hourly' },
  { value: '4H', label: '4H', interval: '4-hourly' },
  { value: '1D', label: '1D', interval: 'daily' },
  { value: '1W', label: '1W', interval: 'weekly' },
  { value: '1M', label: '1M', interval: 'monthly' },
];

const chartTypeOptions: { value: ChartType; label: string; icon: React.ReactNode }[] = [
  { value: 'area', label: 'Area', icon: <Activity className="w-4 h-4" /> },
  { value: 'candlestick', label: 'Candlestick', icon: <BarChart3 className="w-4 h-4" /> },
  { value: 'line', label: 'Line', icon: <TrendingUp className="w-4 h-4" /> },
];

const indicatorOptions = [
  { key: 'sma_7', label: 'SMA 7', color: '#3b82f6' },
  { key: 'sma_14', label: 'SMA 14', color: '#8b5cf6' },
  { key: 'sma_30', label: 'SMA 30', color: '#f59e0b' },
  { key: 'ema_7', label: 'EMA 7', color: '#10b981' },
  { key: 'ema_14', label: 'EMA 14', color: '#ef4444' },
  { key: 'bollinger', label: 'Bollinger Bands', color: '#6b7280' },
  { key: 'rsi', label: 'RSI', color: '#f97316' },
  { key: 'macd', label: 'MACD', color: '#ec4899' },
];

export function EnhancedPriceChart({
  data,
  indicators = [],
  timeFrame,
  chartType,
  onTimeFrameChange,
  onChartTypeChange,
  isLoading = false,
  height = 400,
  showVolume = true,
  showIndicators = false,
  selectedIndicators = ['sma_7', 'sma_14'],
  onIndicatorToggle,
  className,
}: EnhancedPriceChartProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Combine price data with indicators
  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map(point => {
      const indicator = indicators.find(ind => ind.timestamp === point.timestamp);
      return {
        ...point,
        ...indicator,
        // Format timestamp for display
        displayTime: format(new Date(point.timestamp), 
          timeFrame === '1H' || timeFrame === '4H' ? 'HH:mm' : 
          timeFrame === '1D' ? 'MMM dd' : 
          'MMM yyyy'
        ),
      };
    });
  }, [data, indicators, timeFrame]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { change: 0, percentage: 0 };
    
    const latest = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    const change = latest.close - previous.close;
    const percentage = (change / previous.close) * 100;
    
    return { change, percentage };
  }, [chartData]);

  // Calculate volume profile
  const volumeProfile = useMemo(() => {
    const totalVolume = chartData.reduce((sum, point) => sum + point.volume, 0);
    const avgVolume = totalVolume / chartData.length;
    
    return chartData.map(point => ({
      ...point,
      volumeRatio: point.volume / avgVolume,
      isHighVolume: point.volume > avgVolume * 1.5,
    }));
  }, [chartData]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm text-slate-400 mb-2">{label}</p>
        
        {/* OHLC Data */}
        <div className="space-y-1 mb-2">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Open:</span>
            <span className="text-white font-mono">{data.open?.toFixed(2) || '--'}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">High:</span>
            <span className="text-green-400 font-mono">{data.high?.toFixed(2) || '--'}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Low:</span>
            <span className="text-red-400 font-mono">{data.low?.toFixed(2) || '--'}</span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Close:</span>
            <span className="text-white font-mono font-semibold">{data.close?.toFixed(2) || '--'}</span>
          </div>
        </div>

        {/* Volume */}
        {showVolume && (
          <div className="flex justify-between gap-4 text-sm mb-2">
            <span className="text-slate-400">Volume:</span>
            <span className="text-blue-400 font-mono">{data.volume?.toLocaleString() || '--'}</span>
          </div>
        )}

        {/* Technical Indicators */}
        {showIndicators && (
          <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
            {selectedIndicators.includes('sma_7') && data.sma_7 && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">SMA 7:</span>
                <span className="text-blue-400 font-mono">{data.sma_7.toFixed(2)}</span>
              </div>
            )}
            {selectedIndicators.includes('sma_14') && data.sma_14 && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">SMA 14:</span>
                <span className="text-purple-400 font-mono">{data.sma_14.toFixed(2)}</span>
              </div>
            )}
            {selectedIndicators.includes('rsi') && data.rsi && (
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">RSI:</span>
                <span className={cn(
                  "font-mono",
                  data.rsi > 70 ? "text-red-400" : data.rsi < 30 ? "text-green-400" : "text-yellow-400"
                )}>
                  {data.rsi.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render candlestick chart
  const renderCandlestickChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="displayTime" 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `${value.toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Candlestick bars */}
        {chartData.map((point, index) => (
          <ReferenceLine
            key={index}
            segment={[
              { x: point.displayTime, y: point.low },
              { x: point.displayTime, y: point.high }
            ]}
            stroke="#6b7280"
            strokeWidth={1}
          />
        ))}
        
        {/* Volume bars (if enabled) */}
        {showVolume && (
          <Bar
            dataKey="volume"
            fill="#374151"
            opacity={0.3}
            yAxisId="volume"
          />
        )}

        {/* Technical Indicators */}
        {showIndicators && selectedIndicators.map(indicator => {
          const config = indicatorOptions.find(opt => opt.key === indicator);
          if (!config) return null;

          if (indicator === 'bollinger') {
            return [
              <Line
                key="bollinger_upper"
                type="monotone"
                dataKey="bollinger_upper"
                stroke={config.color}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />,
              <Line
                key="bollinger_lower"
                type="monotone"
                dataKey="bollinger_lower"
                stroke={config.color}
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />,
              <Line
                key="bollinger_middle"
                type="monotone"
                dataKey="bollinger_middle"
                stroke={config.color}
                strokeWidth={1}
                dot={false}
              />
            ];
          }

          return (
            <Line
              key={indicator}
              type="monotone"
              dataKey={indicator}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
            />
          );
        })}
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Render area chart
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="displayTime" 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
        />
        <YAxis 
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `${value.toFixed(0)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        
        <Area
          type="monotone"
          dataKey="close"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#priceGradient)"
        />

        {/* Technical Indicators */}
        {showIndicators && selectedIndicators.map(indicator => {
          const config = indicatorOptions.find(opt => opt.key === indicator);
          if (!config || indicator === 'bollinger' || indicator === 'rsi' || indicator === 'macd') return null;

          return (
            <Line
              key={indicator}
              type="monotone"
              dataKey={indicator}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div className={cn("bg-slate-800 rounded-lg border border-slate-700", className)}>
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Price Change Indicator */}
            <div className="flex items-center gap-2">
              {priceChange.change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={cn(
                "font-mono text-sm font-semibold",
                priceChange.change >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {priceChange.change >= 0 ? '+' : ''}{priceChange.change.toFixed(2)} 
                ({priceChange.percentage >= 0 ? '+' : ''}{priceChange.percentage.toFixed(2)}%)
              </span>
            </div>

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-4 h-4 border-2 border-slate-600 border-t-dynasty-400 rounded-full animate-spin" />
                Updating...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Selector */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              {chartTypeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onChartTypeChange(option.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                    chartType === option.value
                      ? "bg-dynasty-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-600"
                  )}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Time Frame Selector */}
            <div className="flex bg-slate-700 rounded-lg p-1">
              {timeFrameOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onTimeFrameChange(option.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium transition-colors",
                    timeFrame === option.value
                      ? "bg-dynasty-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-600"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showSettings
                  ? "bg-dynasty-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-slate-750 rounded-lg border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Volume Toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showVolume}
                  onChange={(e) => {/* Handle volume toggle */}}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-300">Show Volume</span>
              </label>

              {/* Indicators Toggle */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showIndicators}
                  onChange={(e) => {/* Handle indicators toggle */}}
                  className="rounded border-slate-600"
                />
                <span className="text-sm text-slate-300">Show Indicators</span>
              </label>
            </div>

            {/* Indicator Selection */}
            {showIndicators && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Technical Indicators</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {indicatorOptions.map(indicator => (
                    <label key={indicator.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIndicators.includes(indicator.key)}
                        onChange={() => onIndicatorToggle?.(indicator.key)}
                        className="rounded border-slate-600"
                      />
                      <span className="text-xs text-slate-300">{indicator.label}</span>
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: indicator.color }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-4">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No price data available</p>
              <p className="text-sm mt-1">Start trading to see price history</p>
            </div>
          </div>
        ) : (
          <>
            {chartType === 'area' && renderAreaChart()}
            {chartType === 'candlestick' && renderCandlestickChart()}
            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height={height}>
                <ComposedChart data={chartData}>
                  {/* Line chart implementation similar to area but with Line component */}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </>
        )}
      </div>
    </div>
  );
}