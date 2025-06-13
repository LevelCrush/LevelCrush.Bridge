export interface WebSocketMessage {
  type: WebSocketMessageType;
  channel?: string;
  data: any;
}

export enum WebSocketMessageType {
  // Client to server
  Subscribe = 'subscribe',
  Unsubscribe = 'unsubscribe',
  Ping = 'ping',
  
  // Server to client
  MarketUpdate = 'market_update',
  PriceUpdate = 'price_update',
  NewListing = 'new_listing',
  ListingSold = 'listing_sold',
  MarketEvent = 'market_event',
  CharacterDeath = 'character_death',
  DynastyUpdate = 'dynasty_update',
  Error = 'error',
  Pong = 'pong',
  Subscribed = 'subscribed',
  Unsubscribed = 'unsubscribed'
}

export interface MarketUpdateData {
  region_id: string;
  item_id: string;
  new_price: string; // Decimal as string
  volume: number;
  timestamp: string;
}

export interface PriceUpdateData {
  updates: Array<{
    region_id: string;
    item_id: string;
    price: string; // Decimal as string
    change_percentage: number;
  }>;
  timestamp: string;
}

export interface NewListingData {
  listing: {
    id: string;
    region_id: string;
    item_id: string;
    price: string; // Decimal as string
    quantity: number;
    seller_character_id?: string;
    is_ghost_listing: boolean;
  };
}

export interface ListingSoldData {
  listing_id: string;
  buyer_character_id: string;
  quantity_sold: number;
  remaining_quantity: number;
  total_price: string; // Decimal as string
}

export interface CharacterDeathData {
  character_id: string;
  character_name: string;
  dynasty_id: string;
  dynasty_name: string;
  death_cause: string;
  age: number;
  wealth: string; // Decimal as string
  market_impact: {
    affected_regions: string[];
    ghost_listings_created: number;
  };
}

export interface WebSocketError {
  code: string;
  message: string;
  channel?: string;
}