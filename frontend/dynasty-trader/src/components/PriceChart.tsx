import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import LoadingSkeleton from './LoadingSkeleton';

interface PriceData {
  time: string;
  price: number;
  volume: number;
}

interface PriceChartProps {
  data: PriceData[];
  isLoading?: boolean;
  itemName?: string;
  currentPrice?: string;
  priceChange24h?: number;
}

export default function PriceChart({ 
  data, 
  isLoading = false, 
  itemName = 'Item',
  currentPrice,
  priceChange24h = 0
}: PriceChartProps) {
  if (isLoading) {
    return (
      <div className="card">
        <div className="mb-4">
          <LoadingSkeleton width="150px" height="1.5rem" className="mb-2" />
          <LoadingSkeleton width="100px" />
        </div>
        <LoadingSkeleton variant="rectangular" height="200px" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <p className="text-center text-slate-400 py-8">No price data available</p>
      </div>
    );
  }

  const isPositive = priceChange24h >= 0;
  const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'price') return `${value.toLocaleString()} gold`;
    if (name === 'volume') return `${value.toLocaleString()} units`;
    return value;
  };

  const formatAxisTick = (tickItem: string) => {
    const date = new Date(tickItem);
    return format(date, 'HH:mm');
  };

  const formatTooltipLabel = (label: string) => {
    const date = new Date(label);
    return format(date, 'MMM dd, HH:mm');
  };

  return (
    <div className="card">
      <div className="mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-medium text-white">{itemName} Price History</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
          {currentPrice && (
            <span className="text-lg sm:text-2xl font-bold text-white">
              {parseFloat(currentPrice).toLocaleString()} gold
            </span>
          )}
          <div className={`flex items-center ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">
              {Math.abs(priceChange24h).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className="h-48 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sortedData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatAxisTick}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '0.5rem'
              }}
              labelFormatter={formatTooltipLabel}
              formatter={formatTooltipValue}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#8b5cf6" 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function VolumeChart({ data, isLoading = false }: { data: PriceData[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="card">
        <LoadingSkeleton width="150px" height="1.5rem" className="mb-3 sm:mb-4" />
        <LoadingSkeleton variant="rectangular" height="120px" className="sm:hidden" />
        <LoadingSkeleton variant="rectangular" height="150px" className="hidden sm:block" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <p className="text-center text-slate-400 py-8">No volume data available</p>
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-white mb-4">Trading Volume</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sortedData}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatAxisTick}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '0.5rem'
              }}
              labelFormatter={formatTooltipLabel}
              formatter={(value: number) => `${value.toLocaleString()} units`}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorVolume)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}