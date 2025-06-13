export interface MarketItem {
  id: string;
  name: string;
  description: string;
  base_price: string; // Decimal as string
  weight: number;
  rarity: ItemRarity;
  category: ItemCategory;
  is_tradeable: boolean;
  created_at: string;
}

export enum ItemRarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary'
}

export enum ItemCategory {
  Food = 'food',
  Material = 'material',
  Weapon = 'weapon',
  Armor = 'armor',
  Tool = 'tool',
  Luxury = 'luxury',
  Artifact = 'artifact'
}

export interface MarketRegion {
  id: string;
  name: string;
  description: string;
  tax_rate: string;
  safety_level: number;
  prosperity_level: number;
  created_at: string;
  // Frontend display helpers
  population?: number;
  wealth_level?: number;
  is_capital?: boolean;
}

export interface MarketListing {
  id: string;
  region_id: string;
  item_id: string;
  seller_character_id?: string;
  price: string; // Decimal as string
  quantity: number;
  original_quantity: number;
  listed_at: string;
  expires_at?: string;
  is_active: boolean;
  is_ghost_listing: boolean;
  ghost_price_modifier: string; // Decimal as string
}

export interface MarketPrice {
  region_id: string;
  item_id: string;
  current_price: string; // Decimal as string
  average_price_24h: string; // Decimal as string
  volume_24h: number;
  price_change_24h: number; // Percentage
  last_updated: string;
}

export interface CreateMarketListingRequest {
  character_id?: string;
  region_id: string;
  item_id: string;
  price: string; // Decimal as string
  quantity: number;
  expires_in_hours?: number;
}

export interface PurchaseRequest {
  listing_id: string;
  quantity: number;
}

export interface MarketTransaction {
  id: string;
  listing_id: string;
  buyer_character_id: string;
  seller_character_id?: string;
  item_id: string;
  quantity: number;
  price_per_unit: string; // Decimal as string
  total_price: string; // Decimal as string
  tax_amount: string; // Decimal as string
  region_id: string;
  created_at: string;
}

export interface MarketEvent {
  id: string;
  region_id: string;
  event_type: MarketEventType;
  title: string;
  description: string;
  affected_categories: ItemCategory[];
  price_modifier: number; // Multiplier (e.g., 1.5 = 50% increase)
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export enum MarketEventType {
  Shortage = 'shortage',
  Surplus = 'surplus',
  Festival = 'festival',
  Disaster = 'disaster',
  War = 'war',
  Discovery = 'discovery'
}

export interface MarketStats {
  region_id: string;
  region_name: string;
  total_listings: number;
  total_volume_24h: string; // Decimal as string
  average_prices: ItemPriceInfo[];
  trending_items: TrendingItem[];
}

export interface ItemPriceInfo {
  item_id: string;
  item_name: string;
  avg_price: string; // Decimal as string
  price_change_24h: string; // Decimal as string
  volume_24h: number;
}

export interface TrendingItem {
  item_id: string;
  item_name: string;
  price_change_percentage: string; // Decimal as string
  volume_increase: number;
}

