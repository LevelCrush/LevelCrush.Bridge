import { SlashCommandBuilder, ContextMenuCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import { CommandInteraction, Client, Collection } from 'discord.js';

export interface Command {
  data: SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}

export interface DynastyTraderUser {
  id: string;
  email: string;
  discord_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Dynasty {
  id: string;
  user_id: string;
  name: string;
  motto?: string;
  reputation: number;
  wealth: string;
  created_at: string;
}

export interface Character {
  id: string;
  dynasty_id: string;
  name: string;
  generation: number;
  birth_date: string;
  death_date?: string;
  is_alive: boolean;
  health: number;
  stamina: number;
  charisma: number;
  intelligence: number;
  luck: number;
  wealth?: string;
  location_id?: string;
  region_id?: string;
  region_name?: string;
}

export interface CharacterStats {
  id: string;
  name: string;
  health: number;
  stamina: number;
  charisma: number;
  intelligence: number;
  luck: number;
  inheritance_received: number;
  total_inventory_value: number;
  wealth: number;
}

export interface MarketRegion {
  id: string;
  name: string;
  description: string;
  is_capital: boolean;
  safety_level: number;
  prosperity_level: number;
  tax_rate: string;
}

export interface MarketListing {
  id: string;
  seller_character_id: string;
  seller_character_name?: string;
  region_id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  price: string;
  price_per_unit: number;
  is_active: boolean;
  is_ghost_listing: boolean;
  listed_at: string;
  expires_at?: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  price_modifier: number;
  affected_categories?: string[];
  affected_regions?: string[];
  starts_at: string;
  ends_at: string;
}

export interface DeathEvent {
  id: string;
  character_id: string;
  character_name: string;
  dynasty_name: string;
  death_date: string;
  death_cause: string;
  character_age: number;
  character_generation: number;
  character_wealth: string;
  market_impact: {
    affected_regions: string[];
    ghost_listings_created: number;
  };
}