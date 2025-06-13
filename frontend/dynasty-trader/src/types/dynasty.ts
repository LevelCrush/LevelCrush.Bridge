export interface Dynasty {
  id: string;
  user_id: string;
  name: string;
  motto?: string;
  founded_at: string;
  generation: number;
  reputation: number;
  total_wealth: string; // Decimal as string
  active_characters: number;
  total_characters: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDynastyRequest {
  name: string;
  motto?: string;
}

export interface DynastyStats {
  dynasty_id: string;
  total_trades: number;
  successful_trades: number;
  total_profit: string; // Decimal as string
  legendary_items_owned: number;
  regions_with_presence: number;
  oldest_character_age: number;
  characters_lost: number;
}

export interface DynastyLineage {
  dynasty_id: string;
  characters: LineageCharacter[];
}

export interface LineageCharacter {
  id: string;
  name: string;
  generation: number;
  birth_date: string;
  death_date?: string;
  death_cause?: string;
  peak_wealth: string; // Decimal as string
  notable_achievement?: string;
}