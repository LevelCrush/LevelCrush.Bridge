import { useState, useEffect } from 'react';
import { X, Skull, TrendingDown, Package, Coins } from 'lucide-react';
import { CharacterDeathData } from '@/types';
import { formatCurrency } from '@/utils/formatting';

interface DeathNotificationProps {
  deathData: CharacterDeathData;
  onClose: () => void;
}

export function DeathNotification({ deathData, onClose }: DeathNotificationProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setShow(true), 100);
    
    // Auto-close after 10 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md bg-slate-900 border border-red-900/50 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      {/* Header */}
      <div className="bg-red-950/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skull className="w-5 h-5 text-red-400" />
          <h3 className="font-display font-bold text-red-400">Character Death</h3>
        </div>
        <button
          onClick={handleClose}
          className="text-slate-500 hover:text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-lg font-semibold text-white">
            {deathData.character_name}
          </p>
          <p className="text-sm text-slate-400">
            of {deathData.dynasty_name} • Age {deathData.age}
          </p>
          <p className="text-sm text-red-400 mt-1">
            Cause: {deathData.death_cause}
          </p>
        </div>

        {/* Wealth Impact */}
        {deathData.wealth && parseFloat(deathData.wealth) > 0 && (
          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 flex items-center gap-1">
                <Coins className="w-4 h-4" />
                Wealth at Death
              </span>
              <span className="text-sm font-medium text-white">
                {formatCurrency(parseFloat(deathData.wealth))}
              </span>
            </div>
          </div>
        )}

        {/* Market Impact */}
        {deathData.market_impact && (
          <div className="space-y-2">
            {deathData.market_impact.affected_regions.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <TrendingDown className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <p className="text-slate-300">Market shock in {deathData.market_impact.affected_regions.length} regions</p>
                  <p className="text-slate-500 text-xs">Prices may fluctuate</p>
                </div>
              </div>
            )}
            
            {deathData.market_impact.ghost_listings_created > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <Package className="w-4 h-4 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-slate-300">{deathData.market_impact.ghost_listings_created} ghost listings created</p>
                  <p className="text-slate-500 text-xs">Items available from beyond</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}