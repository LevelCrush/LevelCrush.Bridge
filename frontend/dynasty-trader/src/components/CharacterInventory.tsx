import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { characterService } from '@/services/character';
import { Character, CharacterInventory as InventoryType, ItemCategory, ItemRarity } from '@/types';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import SellItemModal from '@/components/SellItemModal';
import ItemDetailsModal from '@/components/ItemDetailsModal';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  TagIcon
} from '@heroicons/react/24/outline';

interface CharacterInventoryProps {
  character: Character;
}

export default function CharacterInventory({ character }: CharacterInventoryProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [sellingItem, setSellingItem] = useState<any | null>(null);
  const [viewingItemDetails, setViewingItemDetails] = useState<any | null>(null);

  // Fetch inventory data
  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['character', character.id, 'inventory'],
    queryFn: () => characterService.getCharacterInventory(character.id),
    enabled: character.is_alive,
  });

  if (!character.is_alive) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <ArchiveBoxIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-white">No Inventory</h3>
          <p className="mt-1 text-sm text-slate-400">Deceased characters cannot carry items</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Inventory</h3>
        <div className="space-y-3">
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (error || !inventory) {
    // Mock inventory data if the endpoint doesn't exist yet
    const mockInventory: InventoryType = {
      character_id: character.id,
      items: [
        {
          id: '1',
          item_id: 'a1b2c3d4-0001-0001-0001-000000000001',
          quantity: 5,
          acquired_price: '10.5',
          acquired_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '2',
          item_id: 'a1b2c3d4-0002-0002-0002-000000000002',
          quantity: 3,
          acquired_price: '45.0',
          acquired_at: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '3',
          item_id: 'a1b2c3d4-0003-0003-0003-000000000001',
          quantity: 1,
          acquired_price: '120.0',
          acquired_at: new Date(Date.now() - 259200000).toISOString(),
        },
      ],
      capacity: 100,
      used_capacity: 9,
    };

    return <CharacterInventoryDisplay 
      inventory={mockInventory} 
      selectedItem={selectedItem} 
      setSelectedItem={setSelectedItem}
      sellingItem={sellingItem}
      setSellingItem={setSellingItem}
      viewingItemDetails={viewingItemDetails}
      setViewingItemDetails={setViewingItemDetails}
      characterId={character.id}
    />;
  }

  return <CharacterInventoryDisplay 
    inventory={inventory} 
    selectedItem={selectedItem} 
    setSelectedItem={setSelectedItem}
    sellingItem={sellingItem}
    setSellingItem={setSellingItem}
    viewingItemDetails={viewingItemDetails}
    setViewingItemDetails={setViewingItemDetails}
    characterId={character.id}
  />;
}

interface CharacterInventoryDisplayProps {
  inventory: InventoryType;
  selectedItem: string | null;
  setSelectedItem: (item: string | null) => void;
  sellingItem: any | null;
  setSellingItem: (item: any | null) => void;
  viewingItemDetails: any | null;
  setViewingItemDetails: (item: any | null) => void;
  characterId: string;
}

function CharacterInventoryDisplay({ 
  inventory, 
  selectedItem, 
  setSelectedItem,
  sellingItem,
  setSellingItem,
  viewingItemDetails,
  setViewingItemDetails,
  characterId
}: CharacterInventoryDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'quantity' | 'acquired'>('name');
  const [showFilters, setShowFilters] = useState(false);
  
  const capacityPercentage = (inventory.used_capacity / inventory.capacity) * 100;
  const getCapacityColor = () => {
    if (capacityPercentage >= 90) return 'text-red-400 bg-red-900';
    if (capacityPercentage >= 70) return 'text-yellow-400 bg-yellow-900';
    return 'text-green-400 bg-green-900';
  };

  const calculateTotalValue = () => {
    return inventory.items.reduce((total, item) => {
      const price = parseFloat(item.acquired_price);
      return total + (price * item.quantity);
    }, 0);
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 60) return '1 month ago';
    const months = Math.floor(diffDays / 30);
    return `${months} months ago`;
  };

  // Filter and sort inventory items
  const filteredAndSortedItems = useMemo(() => {
    let items = [...inventory.items];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        const info = item.item_name ? {
          name: item.item_name,
          description: item.item_description || '',
          category: item.category || '',
          rarity: item.rarity || ''
        } : getItemInfo(item.item_id);
        
        return info.name.toLowerCase().includes(query) || 
               info.description.toLowerCase().includes(query);
      });
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      items = items.filter(item => {
        const info = item.category || getItemInfo(item.item_id).category;
        return info === selectedCategory;
      });
    }

    // Apply rarity filter
    if (selectedRarity !== 'all') {
      items = items.filter(item => {
        const info = item.rarity || getItemInfo(item.item_id).rarity;
        return info === selectedRarity;
      });
    }

    // Apply sorting
    items.sort((a, b) => {
      const aInfo = a.item_name ? {
        name: a.item_name,
        rarity: a.rarity as ItemRarity || ItemRarity.Common
      } : getItemInfo(a.item_id);
      const bInfo = b.item_name ? {
        name: b.item_name,
        rarity: b.rarity as ItemRarity || ItemRarity.Common
      } : getItemInfo(b.item_id);

      switch (sortBy) {
        case 'name':
          return aInfo.name.localeCompare(bInfo.name);
        case 'value':
          const aValue = parseFloat(a.acquired_price) * a.quantity;
          const bValue = parseFloat(b.acquired_price) * b.quantity;
          return bValue - aValue;
        case 'quantity':
          return b.quantity - a.quantity;
        case 'acquired':
          return new Date(b.acquired_at).getTime() - new Date(a.acquired_at).getTime();
        default:
          return 0;
      }
    });

    return items;
  }, [inventory.items, searchQuery, selectedCategory, selectedRarity, sortBy]);

  // Get unique categories and rarities for filters
  const { categories, rarities } = useMemo(() => {
    const categorySet = new Set<string>();
    const raritySet = new Set<string>();

    inventory.items.forEach(item => {
      const info = item.item_name ? {
        category: item.category || 'Raw Material',
        rarity: item.rarity || 'common'
      } : getItemInfo(item.item_id);
      
      categorySet.add(info.category as string);
      raritySet.add(info.rarity as string);
    });

    return {
      categories: Array.from(categorySet).sort(),
      rarities: Array.from(raritySet).sort((a, b) => {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        return rarityOrder.indexOf(a) - rarityOrder.indexOf(b);
      })
    };
  }, [inventory.items]);

  return (
    <div className="card" data-inventory-section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Inventory</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-sm">
            <ArchiveBoxIcon className="h-4 w-4 mr-1 text-slate-400" />
            <span className={`${getCapacityColor().split(' ')[0]}`}>
              {inventory.used_capacity}/{inventory.capacity}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <CurrencyDollarIcon className="h-4 w-4 mr-1 text-slate-400" />
            <span className="text-dynasty-400">{calculateTotalValue().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-dynasty-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters 
                ? 'bg-dynasty-500 border-dynasty-500 text-white' 
                : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            <FunnelIcon className="h-5 w-5" />
            Filters
            {(selectedCategory !== 'all' || selectedRarity !== 'all') && (
              <span className="bg-dynasty-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[selectedCategory !== 'all', selectedRarity !== 'all'].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-slate-700 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <TagIcon className="inline h-4 w-4 mr-1" />
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rarity Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <SparklesIcon className="inline h-4 w-4 mr-1" />
                  Rarity
                </label>
                <select
                  value={selectedRarity}
                  onChange={(e) => setSelectedRarity(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                >
                  <option value="all">All Rarities</option>
                  {rarities.map(rarity => (
                    <option key={rarity} value={rarity}>
                      {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <ChartBarIcon className="inline h-4 w-4 mr-1" />
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                >
                  <option value="name">Name</option>
                  <option value="value">Total Value</option>
                  <option value="quantity">Quantity</option>
                  <option value="acquired">Recently Acquired</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-slate-400 pt-2 border-t border-slate-600">
              Showing {filteredAndSortedItems.length} of {inventory.items.length} items
              {(selectedCategory !== 'all' || selectedRarity !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedRarity('all');
                  }}
                  className="ml-2 text-dynasty-400 hover:text-dynasty-300"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getCapacityColor().split(' ')[1]}`}
            style={{ width: `${capacityPercentage}%` }}
          />
        </div>
      </div>

      {/* Items List */}
      {inventory.items.length === 0 ? (
        <div className="text-center py-8">
          <ArchiveBoxIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-white">Empty Inventory</h3>
          <p className="mt-1 text-sm text-slate-400">Purchase items from the market to fill your inventory</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-8">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No items found</h3>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedItems.map((inventoryItem) => {
            const itemInfo = inventoryItem.item_name ? {
              name: inventoryItem.item_name,
              description: inventoryItem.item_description || 'A valuable trade good',
              category: (inventoryItem.category as ItemCategory) || ItemCategory.RawMaterial,
              rarity: (inventoryItem.rarity as ItemRarity) || ItemRarity.Common
            } : getItemInfo(inventoryItem.item_id);
            const unitPrice = parseFloat(inventoryItem.acquired_price);
            const totalValue = unitPrice * inventoryItem.quantity;
            const isSelected = selectedItem === inventoryItem.id;

            return (
              <div
                key={inventoryItem.id}
                className={`bg-slate-700 rounded-lg p-4 cursor-pointer transition-all border ${
                  isSelected ? 'border-dynasty-500 bg-slate-600' : 'border-slate-600 hover:bg-slate-600'
                }`}
                onClick={() => setSelectedItem(isSelected ? null : inventoryItem.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getCategoryIcon(itemInfo.category)}</span>
                      <h4 className={`font-medium ${getRarityColor(itemInfo.rarity)}`}>
                        {itemInfo.name}
                      </h4>
                      {inventoryItem.quantity > 1 && (
                        <span className="ml-2 text-sm text-slate-400">×{inventoryItem.quantity}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{itemInfo.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-slate-400">Total Value</p>
                    <p className="text-lg font-bold text-white">{totalValue.toLocaleString()} gold</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400 flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          Acquired Price
                        </span>
                        <span className="text-white">{unitPrice.toLocaleString()} gold/unit</span>
                      </div>
                      <div>
                        <span className="text-slate-400 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Acquired
                        </span>
                        <span className="text-white">{getDaysAgo(inventoryItem.acquired_at)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 flex items-center">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          Quantity
                        </span>
                        <span className="text-white">{inventoryItem.quantity} units</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Category</span>
                        <span className="text-white">{itemInfo.category.charAt(0).toUpperCase() + itemInfo.category.slice(1)}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSellingItem(inventoryItem);
                        }}
                        className="btn-primary text-sm flex-1"
                      >
                        Sell on Market
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingItemDetails(inventoryItem);
                        }}
                        className="btn-secondary text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Sell Item Modal */}
      {sellingItem && (
        <SellItemModal
          item={sellingItem}
          characterId={characterId}
          onClose={() => setSellingItem(null)}
        />
      )}
      
      {/* Item Details Modal */}
      {viewingItemDetails && (
        <ItemDetailsModal
          item={viewingItemDetails}
          isOpen={!!viewingItemDetails}
          onClose={() => setViewingItemDetails(null)}
        />
      )}
    </div>
  );
}