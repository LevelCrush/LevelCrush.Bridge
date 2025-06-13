export interface Character {
  id: string;
  user_id: string;
  dynasty_id: string;
  name: string;
  age: number;
  health: number;
  max_health: number;
  location_id: string;
  wealth: string; // Decimal as string
  died_at?: string;
  death_cause?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCharacterRequest {
  dynasty_id: string;
  name: string;
  starting_location_id?: string;
}

export interface CharacterStats {
  trading_skill: number;
  negotiation_skill: number;
  endurance: number;
  luck: number;
}

export interface CharacterInventory {
  character_id: string;
  items: InventoryItem[];
  capacity: number;
  used_capacity: number;
}

export interface InventoryItem {
  id: string;
  item_id: string;
  quantity: number;
  acquired_price: string; // Decimal as string
  acquired_at: string;
}