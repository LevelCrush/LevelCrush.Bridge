import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  CurrencyDollarIcon,
  ScaleIcon,
  ChartBarIcon,
  SparklesIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { getItemInfo, getRarityColor, getCategoryIcon } from '@/data/mockItems';
import { ItemCategory, ItemRarity } from '@/types';

interface ItemDetailsModalProps {
  item: {
    item_id: string;
    item_name?: string;
    item_description?: string;
    item_category?: string;
    item_rarity?: string;
    item_base_price?: string;
    item_weight?: number;
    quantity?: number;
    acquired_price?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function ItemDetailsModal({ item, isOpen, onClose }: ItemDetailsModalProps) {
  const itemInfo = item.item_name ? {
    name: item.item_name,
    description: item.item_description || 'A valuable trade good',
    category: (item.item_category as ItemCategory) || ItemCategory.Material,
    rarity: (item.item_rarity as ItemRarity) || ItemRarity.Common,
    basePrice: item.item_base_price,
    weight: item.item_weight
  } : {
    ...getItemInfo(item.item_id),
    basePrice: item.item_base_price,
    weight: item.item_weight
  };

  const getRarityStars = (rarity: string) => {
    const rarityLevels: Record<string, number> = {
      common: 1,
      uncommon: 2,
      rare: 3,
      epic: 4,
      legendary: 5
    };
    return rarityLevels[rarity] || 1;
  };

  const getRarityBgClass = (rarity: string) => {
    const bgClasses: Record<string, string> = {
      common: 'bg-gray-900',
      uncommon: 'bg-green-900',
      rare: 'bg-blue-900',
      epic: 'bg-purple-900',
      legendary: 'bg-yellow-900'
    };
    return bgClasses[rarity] || 'bg-gray-900';
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md text-slate-400 hover:text-white focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 sm:mx-0 sm:h-20 sm:w-20">
                    <span className="text-3xl sm:text-4xl">{getCategoryIcon(itemInfo.category)}</span>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                    <Dialog.Title as="h3" className={`text-xl font-semibold leading-6 ${getRarityColor(itemInfo.rarity)}`}>
                      {itemInfo.name}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-slate-400">{itemInfo.description}</p>
                    </div>
                  </div>
                </div>

                {/* Rarity Section */}
                <div className={`mt-6 p-4 rounded-lg ${getRarityBgClass(itemInfo.rarity)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="h-5 w-5 text-white" />
                      <span className="text-sm font-medium text-white">Rarity</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-sm font-bold ${getRarityColor(itemInfo.rarity)}`}>
                        {itemInfo.rarity.charAt(0).toUpperCase() + itemInfo.rarity.slice(1)}
                      </span>
                      <div className="flex space-x-0.5 ml-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < getRarityStars(itemInfo.rarity)
                                ? getRarityColor(itemInfo.rarity).replace('text-', 'fill-')
                                : 'fill-slate-600'
                            }`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details Grid */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center text-slate-400 mb-1">
                      <TagIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Category</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                      {itemInfo.category.charAt(0).toUpperCase() + itemInfo.category.slice(1)}
                    </p>
                  </div>

                  {itemInfo.basePrice && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center text-slate-400 mb-1">
                        <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Base Price</span>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {parseFloat(itemInfo.basePrice).toLocaleString()} gold
                      </p>
                    </div>
                  )}

                  {itemInfo.weight && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center text-slate-400 mb-1">
                        <ScaleIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Weight</span>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {itemInfo.weight} kg
                      </p>
                    </div>
                  )}

                  {item.quantity && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center text-slate-400 mb-1">
                        <ChartBarIcon className="h-4 w-4 mr-1" />
                        <span className="text-xs">Quantity</span>
                      </div>
                      <p className="text-sm font-medium text-white">
                        {item.quantity} units
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Info */}
                {item.acquired_price && (
                  <div className="mt-4 bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center text-slate-400 mb-2">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Acquisition Details</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Acquired Price:</span>
                        <span className="text-white font-medium">
                          {parseFloat(item.acquired_price).toLocaleString()} gold/unit
                        </span>
                      </div>
                      {item.quantity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Total Value:</span>
                          <span className="text-white font-medium">
                            {(parseFloat(item.acquired_price) * item.quantity).toLocaleString()} gold
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Item Lore or Additional Description */}
                <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-500 italic">
                    {itemInfo.rarity === 'legendary' && "This legendary item is spoken of in hushed whispers throughout the land."}
                    {itemInfo.rarity === 'epic' && "An epic artifact that has witnessed the rise and fall of empires."}
                    {itemInfo.rarity === 'rare' && "A rare find that would make any merchant's fortune."}
                    {itemInfo.rarity === 'uncommon' && "An uncommon trade good sought after by discerning buyers."}
                    {itemInfo.rarity === 'common' && "A common item that forms the backbone of everyday trade."}
                  </p>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="btn-secondary w-full"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}