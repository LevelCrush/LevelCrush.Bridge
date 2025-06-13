import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { characterService } from '@/services/character';
import { Character } from '@/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  MapPinIcon,
  UserIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';

interface TransactionHistoryProps {
  character: Character;
}

export default function TransactionHistory({ character }: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  // Fetch transaction history
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['character', character.id, 'transactions'],
    queryFn: () => characterService.getCharacterTransactions(character.id),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Transaction History</h3>
        <div className="space-y-3">
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
          <LoadingSkeleton className="h-20" />
        </div>
      </div>
    );
  }

  if (error || !transactions) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-white mb-4">Transaction History</h3>
        <div className="text-center py-8">
          <ReceiptRefundIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No transactions yet</h3>
          <p className="mt-1 text-sm text-slate-400">Buy or sell items on the market to see your history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Transaction History</h3>
        <span className="text-sm text-slate-400">{transactions.length} transactions</span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <ReceiptRefundIcon className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-white">No transactions yet</h3>
          <p className="mt-1 text-sm text-slate-400">Buy or sell items on the market to see your history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const isBuy = transaction.transaction_side === 'buy';
            const itemInfo = transaction.item_name ? {
              name: transaction.item_name,
              category: transaction.item_category,
              rarity: transaction.item_rarity
            } : getItemInfo(transaction.item_id);
            const isSelected = selectedTransaction === transaction.id;

            return (
              <div
                key={transaction.id}
                className={`bg-slate-700 rounded-lg p-4 cursor-pointer transition-all border ${
                  isSelected ? 'border-dynasty-500 bg-slate-600' : 'border-slate-600 hover:bg-slate-600'
                }`}
                onClick={() => setSelectedTransaction(isSelected ? null : transaction.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isBuy ? 'bg-green-900' : 'bg-red-900'
                    }`}>
                      {isBuy ? (
                        <ArrowDownIcon className="h-5 w-5 text-green-400" />
                      ) : (
                        <ArrowUpIcon className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(itemInfo.category)}</span>
                        <h4 className={`font-medium ${getRarityColor(itemInfo.rarity)}`}>
                          {itemInfo.name}
                        </h4>
                        <span className="ml-2 text-sm text-slate-400">×{transaction.quantity}</span>
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-slate-400">
                        <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                          {isBuy ? 'Purchased' : 'Sold'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <MapPinIcon className="h-3 w-3 mr-1" />
                          {transaction.region_name}
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {formatDate(transaction.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">
                      {isBuy ? '-' : '+'}{formatPrice(transaction.total_price)} gold
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatPrice(transaction.price_per_unit)} per unit
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Transaction Type</span>
                        <p className="text-white capitalize">{transaction.transaction_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Tax Amount</span>
                        <p className="text-white">{formatPrice(transaction.tax_amount)} gold</p>
                      </div>
                      {isBuy && transaction.seller_name && (
                        <div>
                          <span className="text-slate-400 flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Seller
                          </span>
                          <p className="text-white">{transaction.seller_name}</p>
                        </div>
                      )}
                      {!isBuy && transaction.buyer_name && (
                        <div>
                          <span className="text-slate-400 flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Buyer
                          </span>
                          <p className="text-white">{transaction.buyer_name}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Net Amount</span>
                        <p className={`font-medium ${
                          isBuy ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {isBuy ? '-' : '+'}
                          {formatPrice(
                            isBuy 
                              ? transaction.total_price
                              : (parseFloat(transaction.total_price) - parseFloat(transaction.tax_amount)).toString()
                          )} gold
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Item Weight</span>
                        <p className="text-white">{transaction.item_weight * transaction.quantity} kg total</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}