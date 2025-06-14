import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, CharacterStats } from '../types/index.js';
import { Colors, createErrorEmbed } from '../utils/embeds.js';
import { dynastyTraderAPI } from '../services/api.js';
import { logger } from '../utils/logger.js';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Trading commands for Dynasty Trader')
    .addSubcommand(subcommand =>
      subcommand
        .setName('sell')
        .setDescription('Create a market listing to sell an item')
        .addStringOption(option =>
          option
            .setName('item')
            .setDescription('The item name or ID to sell')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('quantity')
            .setDescription('How many to sell')
            .setRequired(true)
            .setMinValue(1)
        )
        .addNumberOption(option =>
          option
            .setName('price')
            .setDescription('Price per item in gold')
            .setRequired(true)
            .setMinValue(0.01)
        )
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Character name to sell from (defaults to active character)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('Purchase an item from the market')
        .addStringOption(option =>
          option
            .setName('listing')
            .setDescription('The market listing ID')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('quantity')
            .setDescription('How many to buy (defaults to all)')
            .setRequired(false)
            .setMinValue(1)
        )
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Character name to buy with (defaults to active character)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('cancel')
        .setDescription('Cancel one of your market listings')
        .addStringOption(option =>
          option
            .setName('listing')
            .setDescription('The market listing ID to cancel')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('listings')
        .setDescription('View your active market listings')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Character name to view listings for (defaults to all)')
            .setRequired(false)
        )
    ),

  async execute(interaction: CommandInteraction) {
    const subcommand = interaction.options.data[0].name;

    // Check if user is linked
    const discordUser = await dynastyTraderAPI.getDiscordUser(interaction.user.id);
    if (!discordUser) {
      const embed = createErrorEmbed('You need to link your Dynasty Trader account first.\nUse `/link` to get started.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Defer reply for longer operations
    await interaction.deferReply({ ephemeral: true });

    try {
      switch (subcommand) {
        case 'sell':
          await handleSell(interaction, discordUser.user_id);
          break;
        case 'buy':
          await handleBuy(interaction, discordUser.user_id);
          break;
        case 'cancel':
          await handleCancel(interaction, discordUser.user_id);
          break;
        case 'listings':
          await handleListings(interaction, discordUser.user_id);
          break;
      }
    } catch (error) {
      logger.error('Trade command error:', error);
      const embed = createErrorEmbed(error instanceof Error ? error.message : 'An error occurred while processing your trade');
      await interaction.editReply({ embeds: [embed] });
    }
  },
};

async function handleSell(interaction: CommandInteraction, userId: string) {
  const itemName = interaction.options.get('item')?.value as string;
  const quantity = interaction.options.get('quantity')?.value as number;
  const price = interaction.options.get('price')?.value as number;
  const characterName = interaction.options.get('character')?.value as string | undefined;

  // Get user's characters
  const characters = await dynastyTraderAPI.getCharacters(userId);
  if (!characters || characters.length === 0) {
    throw new Error('You have no characters in your dynasty');
  }

  // Find the character to sell from
  let character;
  if (characterName) {
    character = characters.find((c: any) => c.name.toLowerCase() === characterName.toLowerCase());
    if (!character) {
      throw new Error(`Character "${characterName}" not found in your dynasty`);
    }
  } else {
    // Use the active character (first alive character)
    character = characters.find((c: any) => c.health > 0);
    if (!character) {
      throw new Error('You have no living characters');
    }
  }

  // Get character's inventory
  const inventory = await dynastyTraderAPI.getCharacterInventory(character.id);
  if (!inventory || inventory.length === 0) {
    throw new Error(`${character.name} has no items to sell`);
  }

  // Find the item in inventory
  const inventoryItem = inventory.find((item: any) => 
    item.item_name.toLowerCase().includes(itemName.toLowerCase()) ||
    item.item_id.toString() === itemName
  );

  if (!inventoryItem) {
    throw new Error(`Item "${itemName}" not found in ${character.name}'s inventory`);
  }

  if (inventoryItem.quantity < quantity) {
    throw new Error(`${character.name} only has ${inventoryItem.quantity} ${inventoryItem.item_name}`);
  }

  // Create the market listing
  const listing = await dynastyTraderAPI.createMarketListing({
    character_id: character.id,
    item_id: inventoryItem.item_id,
    quantity: quantity,
    price_per_unit: price,
    region_id: character.region_id || character.location_id || '00000000-0000-0000-0000-000000000001' // Default to Capital City
  });

  // Create success embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle('🏪 Market Listing Created')
    .setDescription(`${character.name} is now selling items in ${character.region_name}`)
    .addFields(
      { name: 'Item', value: inventoryItem.item_name, inline: true },
      { name: 'Quantity', value: quantity.toString(), inline: true },
      { name: 'Price per Unit', value: `${price.toFixed(2)} gold`, inline: true },
      { name: 'Total Value', value: `${(price * quantity).toFixed(2)} gold`, inline: true },
      { name: 'Listing ID', value: listing.id.toString(), inline: true },
      { name: 'Region', value: character.region_name || 'Unknown', inline: true }
    )
    .setFooter({ text: 'Use /trade cancel to remove this listing' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleBuy(interaction: CommandInteraction, userId: string) {
  const listingId = interaction.options.get('listing')?.value as string;
  const requestedQuantity = interaction.options.get('quantity')?.value as number | undefined;
  const characterName = interaction.options.get('character')?.value as string | undefined;

  // Get user's characters
  const characters = await dynastyTraderAPI.getCharacters(userId);
  if (!characters || characters.length === 0) {
    throw new Error('You have no characters in your dynasty');
  }

  // Find the character to buy with
  let character;
  if (characterName) {
    character = characters.find((c: any) => c.name.toLowerCase() === characterName.toLowerCase());
    if (!character) {
      throw new Error(`Character "${characterName}" not found in your dynasty`);
    }
  } else {
    // Use the active character (first alive character)
    character = characters.find((c: any) => c.health > 0);
    if (!character) {
      throw new Error('You have no living characters');
    }
  }

  // Get character stats to check gold
  const characterStats: CharacterStats = await dynastyTraderAPI.getCharacterStats(character.id);
  if (!characterStats) {
    throw new Error('Unable to retrieve character information');
  }

  // Get the listing details
  const regions = await dynastyTraderAPI.getMarketRegions();
  let listing;
  let foundRegion;

  // Search all regions for the listing
  for (const region of regions) {
    const listings = await dynastyTraderAPI.getMarketListings(region.id);
    listing = listings.find((l: any) => l.id.toString() === listingId);
    if (listing) {
      foundRegion = region;
      break;
    }
  }

  if (!listing || !foundRegion) {
    throw new Error(`Listing ${listingId} not found or no longer available`);
  }

  // Check if character is in the same region
  const characterRegionId = character.region_id || character.location_id;
  if (characterRegionId !== foundRegion.id) {
    const characterRegionName = character.region_name || 'Unknown Location';
    throw new Error(`${character.name} is in ${characterRegionName}, but the listing is in ${foundRegion.name}. Characters must be in the same region to trade.`);
  }

  // Determine quantity to buy
  const quantityToBuy = requestedQuantity || listing.quantity;
  if (quantityToBuy > listing.quantity) {
    throw new Error(`Only ${listing.quantity} available in this listing`);
  }

  // Calculate total cost
  const totalCost = listing.price_per_unit * quantityToBuy;
  if (characterStats.inheritance_received < totalCost) {
    throw new Error(`${character.name} only has ${characterStats.inheritance_received.toFixed(2)} gold, but needs ${totalCost.toFixed(2)} gold`);
  }

  // Execute the purchase
  const purchase = await dynastyTraderAPI.purchaseFromListing({
    listing_id: parseInt(listingId),
    buyer_character_id: character.id,
    quantity: quantityToBuy
  });

  // Create success embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle('💰 Purchase Successful')
    .setDescription(`${character.name} has purchased items from the market`)
    .addFields(
      { name: 'Item', value: listing.item_name, inline: true },
      { name: 'Quantity', value: quantityToBuy.toString(), inline: true },
      { name: 'Price per Unit', value: `${listing.price_per_unit.toFixed(2)} gold`, inline: true },
      { name: 'Total Cost', value: `${totalCost.toFixed(2)} gold`, inline: true },
      { name: 'Seller', value: listing.seller_character_name || 'Unknown', inline: true },
      { name: 'Region', value: foundRegion.name, inline: true },
      { name: 'Gold Remaining', value: `${(characterStats.inheritance_received - totalCost).toFixed(2)} gold`, inline: false }
    )
    .setFooter({ text: 'Items added to inventory' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleCancel(interaction: CommandInteraction, userId: string) {
  const listingId = interaction.options.get('listing')?.value as string;

  // Get user's characters
  const characters = await dynastyTraderAPI.getCharacters(userId);
  if (!characters || characters.length === 0) {
    throw new Error('You have no characters in your dynasty');
  }

  // Find the listing across all regions
  const regions = await dynastyTraderAPI.getMarketRegions();
  let listing;
  let foundRegion;

  for (const region of regions) {
    const listings = await dynastyTraderAPI.getMarketListings(region.id);
    listing = listings.find((l: any) => l.id.toString() === listingId);
    if (listing) {
      foundRegion = region;
      break;
    }
  }

  if (!listing || !foundRegion) {
    throw new Error(`Listing ${listingId} not found`);
  }

  // Check if the listing belongs to one of the user's characters
  const ownerCharacter = characters.find((c: any) => c.id === listing.seller_character_id);
  if (!ownerCharacter) {
    throw new Error('This listing does not belong to any of your characters');
  }

  // Cancel the listing
  await dynastyTraderAPI.cancelMarketListing(parseInt(listingId));

  // Create success embed
  const embed = new EmbedBuilder()
    .setColor(Colors.Success)
    .setTitle('🚫 Listing Cancelled')
    .setDescription('Your market listing has been cancelled')
    .addFields(
      { name: 'Item', value: listing.item_name, inline: true },
      { name: 'Quantity', value: listing.quantity.toString(), inline: true },
      { name: 'Price per Unit', value: `${listing.price_per_unit.toFixed(2)} gold`, inline: true },
      { name: 'Character', value: ownerCharacter.name, inline: true },
      { name: 'Region', value: foundRegion.name, inline: true }
    )
    .setFooter({ text: 'Items returned to inventory' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleListings(interaction: CommandInteraction, userId: string) {
  const characterName = interaction.options.get('character')?.value as string | undefined;

  // Get user's characters
  const characters = await dynastyTraderAPI.getCharacters(userId);
  if (!characters || characters.length === 0) {
    throw new Error('You have no characters in your dynasty');
  }

  // Filter characters if name provided
  const filteredCharacters = characterName
    ? characters.filter((c: any) => c.name.toLowerCase() === characterName.toLowerCase())
    : characters;

  if (filteredCharacters.length === 0) {
    throw new Error(`Character "${characterName}" not found in your dynasty`);
  }

  // Get all listings for these characters
  const regions = await dynastyTraderAPI.getMarketRegions();
  const allListings = [];

  for (const region of regions) {
    const listings = await dynastyTraderAPI.getMarketListings(region.id);
    const userListings = listings.filter((l: any) => 
      filteredCharacters.some((c: any) => c.id === l.seller_character_id)
    );
    
    for (const listing of userListings) {
      allListings.push({
        ...listing,
        region_name: region.name,
        character_name: filteredCharacters.find((c: any) => c.id === listing.seller_character_id)?.name || 'Unknown'
      });
    }
  }

  if (allListings.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Info)
      .setTitle('📋 Active Market Listings')
      .setDescription(characterName 
        ? `${characterName} has no active market listings`
        : 'You have no active market listings'
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Create embed with listings
  const embed = new EmbedBuilder()
    .setColor(Colors.Info)
    .setTitle('📋 Active Market Listings')
    .setDescription(characterName 
      ? `${characterName}'s active listings`
      : `You have ${allListings.length} active listing${allListings.length > 1 ? 's' : ''}`
    );

  // Add fields for each listing (max 25)
  const displayListings = allListings.slice(0, 25);
  for (const listing of displayListings) {
    const totalValue = listing.price_per_unit * listing.quantity;
    embed.addFields({
      name: `${listing.item_name} (ID: ${listing.id})`,
      value: `Character: **${listing.character_name}**\n` +
             `Region: **${listing.region_name}**\n` +
             `Quantity: **${listing.quantity}**\n` +
             `Price: **${listing.price_per_unit.toFixed(2)}** gold each\n` +
             `Total: **${totalValue.toFixed(2)}** gold`,
      inline: true
    });
  }

  if (allListings.length > 25) {
    embed.setFooter({ text: `Showing 25 of ${allListings.length} listings` });
  }

  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

export default command;