import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (e.g., after user has explored the app)
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt || isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-slate-800 border border-dynasty-600 rounded-lg shadow-lg p-4 z-50 animate-slide-in-right">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <ArrowDownTrayIcon className="h-6 w-6 text-dynasty-400 mr-2" />
          <h3 className="font-medium text-white">Install Dynasty Trader</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <p className="text-sm text-slate-300 mb-4">
        Install our app for a better experience with offline support and quick access from your home screen.
      </p>
      
      <div className="flex space-x-3">
        <button
          onClick={handleInstall}
          className="btn-primary flex-1 text-sm"
        >
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="btn-secondary text-sm"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}