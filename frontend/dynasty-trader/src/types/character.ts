export interface Character {
  id: string;
  dynasty_id: string;
  name: string;
  birth_date: string;
  death_date?: string;
  death_cause?: string;
  health: number;
  stamina: number;
  charisma: number;
  intelligence: number;
  luck: number;
  location_id?: string;
  is_alive: boolean;
  generation: number;
  parent_character_id?: string;
  inheritance_received: string;
  created_at: string;
  updated_at: string;
  // Frontend computed
  age?: number;
  wealth?: string;
  max_health?: number;
  max_stamina?: number;
}

export interface CreateCharacterRequest {
  dynasty_id: string;
  name: string;
  starting_location_id?: string;
}

export interface CharacterStats {
  character_id: string;
  name: string;
  age: number;
  health: number;
  stamina: number;
  charisma: number;
  intelligence: number;
  luck: number;
  trading_bonus: number;
  location?: string;
  wealth: string;
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
  item_name?: string;
  item_description?: string;
  category?: string;
  rarity?: string;
  quantity: number;
  acquired_price: string; // Decimal as string
  acquired_at: string;
}