import { ItemCategory, ItemRarity } from '@/types';

// Mock items data until backend provides an items endpoint
export const mockItems: Record<string, { name: string; category: ItemCategory; rarity: ItemRarity; description: string }> = {
  // Food items
  'a1b2c3d4-0001-0001-0001-000000000001': {
    name: 'Fresh Bread',
    category: ItemCategory.Food,
    rarity: ItemRarity.Common,
    description: 'A warm loaf of freshly baked bread'
  },
  'a1b2c3d4-0001-0001-0001-000000000002': {
    name: 'Aged Wine',
    category: ItemCategory.Food,
    rarity: ItemRarity.Uncommon,
    description: 'A fine vintage from the southern vineyards'
  },
  'a1b2c3d4-0001-0001-0001-000000000003': {
    name: 'Royal Feast',
    category: ItemCategory.Food,
    rarity: ItemRarity.Rare,
    description: 'A lavish meal fit for nobility'
  },

  // Materials
  'a1b2c3d4-0002-0002-0002-000000000001': {
    name: 'Iron Ore',
    category: ItemCategory.Material,
    rarity: ItemRarity.Common,
    description: 'Raw iron ore from the northern mines'
  },
  'a1b2c3d4-0002-0002-0002-000000000002': {
    name: 'Silver Ingot',
    category: ItemCategory.Material,
    rarity: ItemRarity.Uncommon,
    description: 'Refined silver ready for crafting'
  },
  'a1b2c3d4-0002-0002-0002-000000000003': {
    name: 'Mithril Ore',
    category: ItemCategory.Material,
    rarity: ItemRarity.Epic,
    description: 'Legendary metal with magical properties'
  },

  // Weapons
  'a1b2c3d4-0003-0003-0003-000000000001': {
    name: 'Iron Sword',
    category: ItemCategory.Weapon,
    rarity: ItemRarity.Common,
    description: 'A basic but reliable weapon'
  },
  'a1b2c3d4-0003-0003-0003-000000000002': {
    name: 'Steel Battleaxe',
    category: ItemCategory.Weapon,
    rarity: ItemRarity.Uncommon,
    description: 'Heavy two-handed weapon'
  },
  'a1b2c3d4-0003-0003-0003-000000000003': {
    name: 'Dragonbane',
    category: ItemCategory.Weapon,
    rarity: ItemRarity.Legendary,
    description: 'Ancient blade forged to slay dragons'
  },

  // Armor
  'a1b2c3d4-0004-0004-0004-000000000001': {
    name: 'Leather Vest',
    category: ItemCategory.Armor,
    rarity: ItemRarity.Common,
    description: 'Light protection for travelers'
  },
  'a1b2c3d4-0004-0004-0004-000000000002': {
    name: 'Chainmail',
    category: ItemCategory.Armor,
    rarity: ItemRarity.Uncommon,
    description: 'Interlocking metal rings for defense'
  },

  // Tools
  'a1b2c3d4-0005-0005-0005-000000000001': {
    name: 'Mining Pick',
    category: ItemCategory.Tool,
    rarity: ItemRarity.Common,
    description: 'Essential tool for extracting ore'
  },
  'a1b2c3d4-0005-0005-0005-000000000002': {
    name: 'Master Lockpicks',
    category: ItemCategory.Tool,
    rarity: ItemRarity.Rare,
    description: 'Finely crafted tools for delicate work'
  },

  // Luxury
  'a1b2c3d4-0006-0006-0006-000000000001': {
    name: 'Silk Cloth',
    category: ItemCategory.Luxury,
    rarity: ItemRarity.Uncommon,
    description: 'Fine fabric from eastern lands'
  },
  'a1b2c3d4-0006-0006-0006-000000000002': {
    name: 'Golden Goblet',
    category: ItemCategory.Luxury,
    rarity: ItemRarity.Rare,
    description: 'Ornate drinking vessel'
  },
  'a1b2c3d4-0006-0006-0006-000000000003': {
    name: 'Diamond Necklace',
    category: ItemCategory.Luxury,
    rarity: ItemRarity.Epic,
    description: 'Exquisite jewelry with perfect gems'
  },

  // Artifacts
  'a1b2c3d4-0007-0007-0007-000000000001': {
    name: 'Ancient Scroll',
    category: ItemCategory.Artifact,
    rarity: ItemRarity.Rare,
    description: 'Knowledge from a forgotten age'
  },
  'a1b2c3d4-0007-0007-0007-000000000002': {
    name: 'Crystal Orb',
    category: ItemCategory.Artifact,
    rarity: ItemRarity.Epic,
    description: 'Mystical sphere pulsing with energy'
  },
  'a1b2c3d4-0007-0007-0007-000000000003': {
    name: 'Crown of Kings',
    category: ItemCategory.Artifact,
    rarity: ItemRarity.Legendary,
    description: 'Symbol of ultimate power and authority'
  }
};

// Helper function to get item info with fallback
export function getItemInfo(itemId: string) {
  const item = mockItems[itemId];
  if (item) {
    return item;
  }
  
  // Generate a fallback for unknown items
  const shortId = itemId.slice(0, 8);
  return {
    name: `Item ${shortId}`,
    category: ItemCategory.Material,
    rarity: ItemRarity.Common,
    description: 'An unidentified trade good'
  };
}

// Get rarity color for UI
export function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case ItemRarity.Common:
      return 'text-gray-400';
    case ItemRarity.Uncommon:
      return 'text-green-400';
    case ItemRarity.Rare:
      return 'text-blue-400';
    case ItemRarity.Epic:
      return 'text-purple-400';
    case ItemRarity.Legendary:
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}

// Get category icon (using emoji for now)
export function getCategoryIcon(category: ItemCategory): string {
  switch (category) {
    case ItemCategory.Food:
      return '🍞';
    case ItemCategory.Material:
      return '⛏️';
    case ItemCategory.Weapon:
      return '⚔️';
    case ItemCategory.Armor:
      return '🛡️';
    case ItemCategory.Tool:
      return '🔧';
    case ItemCategory.Luxury:
      return '💎';
    case ItemCategory.Artifact:
      return '📜';
    default:
      return '📦';
  }
}