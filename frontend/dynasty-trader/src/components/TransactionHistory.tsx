import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { characterService } from '@/services/character';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import ItemDetailsModal from '@/components/ItemDetailsModal';
import { Character, ItemCategory, ItemRarity } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface TransactionHistoryProps {
  character: Character;
}

interface Transaction {
  id: string;
  buyer_character_id: string;
  seller_character_id: string;
  listing_id: string;
  region_id: string;
  item_id: string;
  quantity: number;
  price_per_unit: string;
  total_price: string;
  tax_amount: string;
  transaction_type: string;
  created_at: string;
  item_name?: string;
  item_description?: string;
  item_category?: string;
  item_rarity?: string;
  item_weight?: number;
  region_name: string;
  buyer_name: string;
  seller_name?: string;
  transaction_side: 'buy' | 'sell' | 'other';
}

export default function TransactionHistory({ character }: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewingItemDetails, setViewingItemDetails] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transaction history
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['character', character.id, 'transactions'],
    queryFn: () => characterService.getCharacterTransactions(character.id),
    enabled: character.is_alive,
  });

  // Calculate time range filter
  const getTimeRangeDate = () => {
    const now = new Date();
    switch (selectedTimeRange) {
      case 'today':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let filtered = [...transactions];

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.transaction_side === filterType);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const itemName = t.item_name || getItemInfo(t.item_id).name;
        const sellerName = t.seller_name || 'Market';
        const buyerName = t.buyer_name;
        const regionName = t.region_name;
        
        return itemName.toLowerCase().includes(query) ||
               sellerName.toLowerCase().includes(query) ||
               buyerName.toLowerCase().includes(query) ||
               regionName.toLowerCase().includes(query);
      });
    }

    // Apply time range filter
    const timeRangeDate = getTimeRangeDate();
    if (timeRangeDate) {
      filtered = filtered.filter(t => new Date(t.created_at) >= timeRangeDate);
    }

    return filtered;
  }, [transactions, filterType, searchQuery, selectedTimeRange]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredTransactions.length) return null;

    const totalSpent = filteredTransactions
      .filter(t => t.transaction_side === 'buy')
      .reduce((sum, t) => sum + parseFloat(t.total_price), 0);

    const totalEarned = filteredTransactions
      .filter(t => t.transaction_side === 'sell')
      .reduce((sum, t) => sum + (parseFloat(t.total_price) - parseFloat(t.tax_amount)), 0);

    const totalTaxesPaid = filteredTransactions
      .reduce((sum, t) => sum + parseFloat(t.tax_amount), 0);

    const uniqueItems = new Set(filteredTransactions.map(t => t.item_id)).size;

    return {
      totalSpent,
      totalEarned,
      netProfit: totalEarned - totalSpent,
      totalTaxesPaid,
      transactionCount: filteredTransactions.length,
      uniqueItems,
    };
  }, [filteredTransactions]);

  if (!character.is_alive) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-medium text-white">No Trade History</h3>
          <p className="mt-1 text-sm text-slate-400">Deceased characters cannot trade</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Trade History</h3>
        <div className="space-y-3">
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Trade History</h3>
        {stats && (
          <div className="text-sm text-slate-400">
            {stats.transactionCount} transactions
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item, trader, or region..."
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
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="bg-slate-700 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Transaction Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'buy', label: 'Purchases', icon: ShoppingCartIcon },
                    { value: 'sell', label: 'Sales', icon: BuildingStorefrontIcon },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilterType(option.value as any)}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg border transition-colors flex items-center justify-center gap-2",
                        filterType === option.value
                          ? "bg-dynasty-500 border-dynasty-500 text-white"
                          : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500"
                      )}
                    >
                      {option.icon && <option.icon className="h-4 w-4" />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Time Range
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-dynasty-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Spent</p>
            <p className="text-lg font-bold text-red-400">
              -{stats.totalSpent.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Total Earned</p>
            <p className="text-lg font-bold text-green-400">
              +{stats.totalEarned.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Net Profit</p>
            <p className={cn(
              "text-lg font-bold",
              stats.netProfit >= 0 ? "text-dynasty-400" : "text-red-400"
            )}>
              {stats.netProfit >= 0 ? '+' : ''}{stats.netProfit.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400">Taxes Paid</p>
            <p className="text-lg font-bold text-orange-400">
              {stats.totalTaxesPaid.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No transactions found</h3>
          <p className="mt-1 text-sm text-slate-400">
            {searchQuery || filterType !== 'all' || selectedTimeRange !== 'all'
              ? 'Try adjusting your filters'
              : 'Start trading on the market to see your history'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const itemInfo = transaction.item_name ? {
              name: transaction.item_name,
              description: transaction.item_description || 'A valuable trade good',
              category: (transaction.item_category as ItemCategory) || ItemCategory.RawMaterial,
              rarity: (transaction.item_rarity as ItemRarity) || ItemRarity.Common
            } : getItemInfo(transaction.item_id);
            
            const isBuy = transaction.transaction_side === 'buy';
            const isExpanded = selectedTransaction?.id === transaction.id;

            return (
              <div
                key={transaction.id}
                className={cn(
                  "bg-slate-700 rounded-lg p-4 cursor-pointer transition-all border",
                  isExpanded ? "border-dynasty-500 bg-slate-600" : "border-slate-600 hover:bg-slate-600"
                )}
                onClick={() => setSelectedTransaction(isExpanded ? null : transaction)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        isBuy ? "bg-red-900" : "bg-green-900"
                      )}>
                        {isBuy ? (
                          <ArrowDownIcon className="h-5 w-5 text-red-400" />
                        ) : (
                          <ArrowUpIcon className="h-5 w-5 text-green-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          <span className="text-lg">{getCategoryIcon(itemInfo.category)}</span>
                          <span className={getRarityColor(itemInfo.rarity)}>
                            {itemInfo.name}
                          </span>
                          <span className="text-slate-400">×{transaction.quantity}</span>
                        </h4>
                        <p className="text-sm text-slate-400">
                          {isBuy ? 'Purchased from' : 'Sold to'} {' '}
                          <span className="text-white">
                            {isBuy 
                              ? transaction.seller_name || 'Market' 
                              : transaction.buyer_name
                            }
                          </span>
                          {' in '}
                          <span className="text-white">{transaction.region_name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-lg font-bold",
                      isBuy ? "text-red-400" : "text-green-400"
                    )}>
                      {isBuy ? '-' : '+'}{parseFloat(transaction.total_price).toLocaleString()} gold
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400 flex items-center gap-1">
                          <CurrencyDollarIcon className="h-4 w-4" />
                          Price per Unit
                        </span>
                        <span className="text-white">
                          {parseFloat(transaction.price_per_unit).toLocaleString()} gold
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPinIcon className="h-4 w-4" />
                          Region
                        </span>
                        <span className="text-white">{transaction.region_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {isBuy ? 'Seller' : 'Buyer'}
                        </span>
                        <span className="text-white">
                          {isBuy 
                            ? transaction.seller_name || 'Market Listing' 
                            : transaction.buyer_name
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tax Amount</span>
                        <span className="text-orange-400">
                          {parseFloat(transaction.tax_amount).toLocaleString()} gold
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingItemDetails({
                            item_id: transaction.item_id,
                            item_name: transaction.item_name,
                            item_description: transaction.item_description,
                            item_category: transaction.item_category,
                            item_rarity: transaction.item_rarity,
                            item_weight: transaction.item_weight,
                            quantity: transaction.quantity,
                            acquired_price: transaction.price_per_unit
                          });
                        }}
                        className="btn-secondary text-sm"
                      >
                        View Item Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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