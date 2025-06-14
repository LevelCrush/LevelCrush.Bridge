import { EmbedBuilder, ColorResolvable } from 'discord.js';
import type { Dynasty, Character, MarketRegion, MarketListing, DeathEvent } from '../types/index.js';

export const Colors = {
  Success: 0x00ff00,
  Error: 0xff0000,
  Warning: 0xffa500,
  Info: 0x0099ff,
  Dynasty: 0xb45fff,
  Death: 0x8b0000,
  Market: 0xffd700,
} as const;

export function createDynastyEmbed(dynasty: Dynasty): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Dynasty)
    .setTitle(`🏛️ ${dynasty.name}`)
    .setDescription(dynasty.motto || '*No motto set*')
    .addFields(
      { name: '💰 Wealth', value: `${parseFloat(dynasty.wealth).toLocaleString()} gold`, inline: true },
      { name: '⭐ Reputation', value: dynasty.reputation.toString(), inline: true },
      { name: '📅 Founded', value: new Date(dynasty.created_at).toLocaleDateString(), inline: true }
    )
    .setTimestamp();
}

export function createCharacterEmbed(character: Character, region?: MarketRegion): EmbedBuilder {
  const age = Math.floor(
    (new Date().getTime() - new Date(character.birth_date).getTime()) / 
    (1000 * 60 * 60 * 24 * 365)
  );

  const embed = new EmbedBuilder()
    .setColor(character.is_alive ? Colors.Success : Colors.Death)
    .setTitle(`${character.is_alive ? '👤' : '💀'} ${character.name}`)
    .setDescription(`Generation ${character.generation} • Age ${age}`)
    .addFields(
      { name: '❤️ Health', value: `${character.health}/100`, inline: true },
      { name: '⚡ Stamina', value: `${character.stamina}/100`, inline: true },
      { name: '💬 Charisma', value: character.charisma.toString(), inline: true },
      { name: '🧠 Intelligence', value: character.intelligence.toString(), inline: true },
      { name: '🍀 Luck', value: character.luck.toString(), inline: true }
    );

  if (character.wealth) {
    embed.addFields({ 
      name: '💰 Wealth', 
      value: `${parseFloat(character.wealth).toLocaleString()} gold`, 
      inline: true 
    });
  }

  if (region) {
    embed.addFields({ 
      name: '📍 Location', 
      value: region.name, 
      inline: true 
    });
  }

  if (!character.is_alive && character.death_date) {
    embed.addFields({ 
      name: '⚰️ Died', 
      value: new Date(character.death_date).toLocaleDateString(), 
      inline: true 
    });
  }

  return embed.setTimestamp();
}

export function createMarketEmbed(region: MarketRegion, stats?: any): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(Colors.Market)
    .setTitle(`🏪 ${region.name} Market`)
    .setDescription(region.description)
    .addFields(
      { name: '🛡️ Safety', value: `${region.safety_level}%`, inline: true },
      { name: '💎 Prosperity', value: `${region.prosperity_level}%`, inline: true },
      { name: '💸 Tax Rate', value: `${(parseFloat(region.tax_rate) * 100).toFixed(1)}%`, inline: true }
    );

  if (stats) {
    embed.addFields(
      { name: '📊 Active Listings', value: stats.total_listings?.toString() || '0', inline: true },
      { name: '📈 24h Volume', value: `${parseFloat(stats.total_volume_24h || '0').toLocaleString()} gold`, inline: true }
    );
  }

  if (region.is_capital) {
    embed.setFooter({ text: '👑 Capital City' });
  }

  return embed.setTimestamp();
}

export function createListingEmbed(listing: MarketListing & { item_name?: string; seller_name?: string }): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(listing.is_ghost_listing ? Colors.Death : Colors.Info)
    .setTitle(`📦 ${listing.item_name || 'Unknown Item'}`)
    .addFields(
      { name: '💰 Price', value: `${parseFloat(listing.price).toLocaleString()} gold`, inline: true },
      { name: '📦 Quantity', value: listing.quantity.toString(), inline: true },
      { name: '👤 Seller', value: listing.seller_name || 'Unknown', inline: true }
    )
    .setFooter({ 
      text: listing.is_ghost_listing ? '👻 Ghost Listing' : `Listed ${new Date(listing.listed_at).toLocaleDateString()}` 
    })
    .setTimestamp();
}

export function createDeathEmbed(death: DeathEvent): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(Colors.Death)
    .setTitle('⚰️ Character Death Announcement')
    .setDescription(`**${death.character_name}** of **${death.dynasty_name}** has passed away`)
    .addFields(
      { name: '🎂 Age', value: `${death.character_age} years`, inline: true },
      { name: '👥 Generation', value: death.character_generation.toString(), inline: true },
      { name: '💀 Cause', value: death.death_cause || 'Natural causes', inline: true },
      { name: '💰 Wealth', value: `${parseFloat(death.character_wealth).toLocaleString()} gold`, inline: true }
    );

  if (death.market_impact.affected_regions.length > 0) {
    embed.addFields({
      name: '📊 Market Impact',
      value: `Affected regions: ${death.market_impact.affected_regions.join(', ')}\nGhost listings: ${death.market_impact.ghost_listings_created}`,
      inline: false
    });
  }

  return embed.setTimestamp(new Date(death.death_date));
}

export function createErrorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Error)
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();
}

export function createSuccessEmbed(title: string, message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle(`✅ ${title}`)
    .setDescription(message)
    .setTimestamp();
}

export function createLeaderboardEmbed(type: string, entries: any[]): EmbedBuilder {
  const titles: Record<string, string> = {
    wealth: '💰 Wealthiest Dynasties',
    reputation: '⭐ Most Reputable Dynasties',
    generation: '👥 Longest Lineages',
  };

  const embed = new EmbedBuilder()
    .setColor(Colors.Dynasty)
    .setTitle(titles[type] || 'Dynasty Leaderboard')
    .setTimestamp();

  const description = entries.map((entry, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    let value = '';
    
    switch (type) {
      case 'wealth':
        value = `${parseFloat(entry.wealth).toLocaleString()} gold`;
        break;
      case 'reputation':
        value = `${entry.reputation} reputation`;
        break;
      case 'generation':
        value = `Generation ${entry.highest_generation}`;
        break;
    }

    return `${medal} **${entry.name}** - ${value}`;
  }).join('\n');

  embed.setDescription(description || 'No dynasties found');

  return embed;
}