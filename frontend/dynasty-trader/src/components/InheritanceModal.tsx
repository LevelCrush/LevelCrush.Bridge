import { useState, useEffect } from 'react';
import { X, Skull, ArrowDown, Coins, Building2, Users, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/formatting';

interface InheritanceData {
  characterName: string;
  characterAge: number;
  dynastyName: string;
  deathCause: string;
  totalWealth: number;
  deathTax: number;
  netInheritance: number;
  heirs: Array<{
    id: string;
    name: string;
    relationship: string;
    inheritanceAmount: number;
  }>;
  dynastyTreasuryAmount: number;
  marketImpact: {
    affectedRegions: string[];
    ghostListingsCreated: number;
  };
}

interface InheritanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  inheritanceData: InheritanceData;
}

export function InheritanceModal({ isOpen, onClose, inheritanceData }: InheritanceModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      // Auto-advance through steps
      const timer = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < 3) return prev + 1;
          clearInterval(timer);
          return prev;
        });
      }, 2000);
      
      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const deathTaxPercentage = 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-slate-900 border border-red-900/50 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-950/80 to-purple-950/80 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skull className="w-6 h-6 text-red-400" />
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">Character Death</h2>
                    <p className="text-sm text-red-300">Inheritance & Market Impact</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                {/* Character Info */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentStep >= 0 ? 1 : 0, y: currentStep >= 0 ? 0 : 20 }}
                  className="text-center space-y-2"
                >
                  <h3 className="text-2xl font-display font-bold text-white">
                    {inheritanceData.characterName}
                  </h3>
                  <p className="text-slate-400">
                    of {inheritanceData.dynastyName} • Age {inheritanceData.characterAge}
                  </p>
                  <p className="text-red-400">
                    {inheritanceData.deathCause}
                  </p>
                </motion.div>

                {/* Wealth Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentStep >= 1 ? 1 : 0, y: currentStep >= 1 ? 0 : 20 }}
                  className="bg-slate-800/50 rounded-lg p-4 space-y-3"
                >
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-yellow-500" />
                    Wealth Distribution
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Total Wealth at Death</span>
                      <span className="text-lg font-semibold text-white">
                        {formatCurrency(inheritanceData.totalWealth)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-red-400">
                      <span>Death Tax ({deathTaxPercentage}%)</span>
                      <span className="font-semibold">
                        -{formatCurrency(inheritanceData.deathTax)}
                      </span>
                    </div>
                    
                    <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                      <span className="text-slate-300 font-semibold">Net Inheritance</span>
                      <span className="text-lg font-bold text-green-400">
                        {formatCurrency(inheritanceData.netInheritance)}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Inheritance Flow */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentStep >= 2 ? 1 : 0, y: currentStep >= 2 ? 0 : 20 }}
                  className="space-y-4"
                >
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    Inheritance Distribution
                  </h4>

                  {inheritanceData.heirs.length > 0 ? (
                    <div className="space-y-2">
                      {inheritanceData.heirs.map((heir) => (
                        <div
                          key={heir.id}
                          className="bg-slate-800/30 rounded-lg p-3 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-white">{heir.name}</p>
                            <p className="text-sm text-slate-400">{heir.relationship}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowDown className="w-4 h-4 text-green-400" />
                            <span className="font-semibold text-green-400">
                              +{formatCurrency(heir.inheritanceAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="font-medium text-white">Dynasty Treasury</p>
                          <p className="text-sm text-slate-400">No living heirs</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-purple-400">
                          +{formatCurrency(inheritanceData.dynastyTreasuryAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Market Impact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: currentStep >= 3 ? 1 : 0, y: currentStep >= 3 ? 0 : 20 }}
                  className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 space-y-3"
                >
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    Market Impact
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    {inheritanceData.marketImpact.affectedRegions.length > 0 && (
                      <p className="text-slate-300">
                        Market shock in <span className="font-semibold text-red-400">
                          {inheritanceData.marketImpact.affectedRegions.length} regions
                        </span>
                      </p>
                    )}
                    
                    {inheritanceData.marketImpact.ghostListingsCreated > 0 && (
                      <p className="text-slate-300">
                        <span className="font-semibold text-purple-400">
                          {inheritanceData.marketImpact.ghostListingsCreated} ghost listings
                        </span> created from estate liquidation
                      </p>
                    )}
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}