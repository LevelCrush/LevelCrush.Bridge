import { api } from '@/lib/api';

export interface MarketOverview {
  total_market_cap: number | string;
  total_volume_24h: number | string;
  active_listings: number;
  price_change_percent: number | string;
  top_gainers: TopMover[];
  top_losers: TopMover[];
  volatile_items: VolatileItem[];
  arbitrage_opportunities: ArbitrageOpportunity[];
}

export interface TopMover {
  item_id: string;
  item_name: string;
  category: string;
  current_price: number | string;
  price_change: number | string;
  price_change_percent: number | string;
  volume_24h: number;
}

export interface VolatileItem {
  item_id: string;
  item_name: string;
  category: string;
  current_price: number | string;
  volatility: number | string;
  volume_24h: number;
  price_change_percent?: number | string;
}

export interface ArbitrageOpportunity {
  item_id: string;
  item_name: string;
  buy_region_id: string;
  buy_region_name: string;
  sell_region_id: string;
  sell_region_name: string;
  buy_price: number | string;
  sell_price: number | string;
  profit_margin: number | string;
  profit_after_taxes: number | string;
  buy_region_tax_rate: number | string;
  sell_region_tax_rate: number | string;
}

export interface RegionalAnalytics {
  region_id: string;
  region_name: string;
  total_volume_24h: number | string;
  avg_price_change: number | string;
  active_listings: number;
  market_health: 'strong' | 'moderate' | 'weak';
  dominant_categories: string[];
  top_items_by_volume: TopItemByVolume[];
  liquidity_score: number | string;
}

export interface TopItemByVolume {
  item_id: string;
  item_name: string;
  volume_24h: number;
  avg_price: number | string;
}

export interface TechnicalIndicators {
  item_id: string;
  region_id: string;
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

export interface PriceHistoryParams {
  timeframe?: '1H' | '4H' | '1D' | '1W' | '1M';
  limit?: number;
  indicators?: boolean;
}

export const marketAnalyticsService = {
  /**
   * Get comprehensive market overview with key metrics
   */
  async getMarketOverview(): Promise<MarketOverview> {
    return api.get('/market/overview');
  },

  /**
   * Get analytics for all regions
   */
  async getRegionalAnalytics(): Promise<RegionalAnalytics[]> {
    return api.get('/market/regional-analytics');
  },

  /**
   * Get technical indicators for a specific item in a region
   */
  async getTechnicalIndicators(
    regionId: string,
    itemId: string,
    params?: PriceHistoryParams
  ): Promise<TechnicalIndicators[]> {
    const searchParams = new URLSearchParams();
    if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.indicators) searchParams.append('indicators', 'true');

    const query = searchParams.toString();
    const url = `/market/regions/${regionId}/items/${itemId}/indicators${query ? `?${query}` : ''}`;
    
    return api.get(url);
  },

  /**
   * Get enhanced price history with OHLC data
   */
  async getEnhancedPriceHistory(
    regionId: string,
    itemId: string,
    params?: PriceHistoryParams
  ): Promise<any[]> {
    // This would be an enhanced version of the existing price history endpoint
    // For now, we'll use the existing endpoint but could add more functionality
    const searchParams = new URLSearchParams();
    if (params?.timeframe) searchParams.append('timeframe', params.timeframe);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const query = searchParams.toString();
    const url = `/market/regions/${regionId}/items/${itemId}/history${query ? `?${query}` : ''}`;
    
    return api.get(url);
  },

  /**
   * Calculate profit potential for arbitrage opportunities
   */
  calculateArbitragePotential(opportunity: ArbitrageOpportunity, quantity: number = 1): {
    grossProfit: number;
    netProfit: number;
    buyTotal: number;
    sellTotal: number;
    totalTaxes: number;
  } {
    const buyPrice = typeof opportunity.buy_price === 'string' ? parseFloat(opportunity.buy_price) : opportunity.buy_price;
    const sellPrice = typeof opportunity.sell_price === 'string' ? parseFloat(opportunity.sell_price) : opportunity.sell_price;
    const buyTaxRate = typeof opportunity.buy_region_tax_rate === 'string' ? parseFloat(opportunity.buy_region_tax_rate) : opportunity.buy_region_tax_rate;
    const sellTaxRate = typeof opportunity.sell_region_tax_rate === 'string' ? parseFloat(opportunity.sell_region_tax_rate) : opportunity.sell_region_tax_rate;
    
    const buyTotal = buyPrice * quantity * (1 + buyTaxRate);
    const sellTotal = sellPrice * quantity * (1 - sellTaxRate);
    const grossProfit = (sellPrice - buyPrice) * quantity;
    const totalTaxes = (buyPrice * buyTaxRate + sellPrice * sellTaxRate) * quantity;
    const netProfit = sellTotal - buyTotal;

    return {
      grossProfit,
      netProfit,
      buyTotal,
      sellTotal,
      totalTaxes,
    };
  },

  /**
   * Format currency values
   */
  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(0);
  },

  /**
   * Format percentage values
   */
  formatPercentage(percent: number, decimals: number = 2): string {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(decimals)}%`;
  },

  /**
   * Determine market sentiment based on price change
   */
  getMarketSentiment(priceChangePercent: number): 'bullish' | 'bearish' | 'neutral' {
    if (priceChangePercent > 2) return 'bullish';
    if (priceChangePercent < -2) return 'bearish';
    return 'neutral';
  },

  /**
   * Calculate volatility category
   */
  getVolatilityCategory(volatility: number): 'low' | 'moderate' | 'high' | 'extreme' {
    if (volatility < 5) return 'low';
    if (volatility < 15) return 'moderate';
    if (volatility < 30) return 'high';
    return 'extreme';
  },

  /**
   * Get RSI signal interpretation
   */
  getRSISignal(rsi: number): 'oversold' | 'neutral' | 'overbought' {
    if (rsi < 30) return 'oversold';
    if (rsi > 70) return 'overbought';
    return 'neutral';
  },

  /**
   * Calculate simple moving average from price data
   */
  calculateSMA(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  },

  /**
   * Calculate exponential moving average from price data
   */
  calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA for remaining values
    for (let i = period; i < prices.length; i++) {
      const currentEMA = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
      ema.push(currentEMA);
    }
    
    return ema;
  },
};