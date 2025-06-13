import { useEffect, useState } from 'react';
import { useDeathEvents } from '@/hooks/useWebSocket';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { DeathEvent } from '@/services/websocket';

interface DeathNotification extends DeathEvent {
  id: string;
  timestamp: number;
}

export default function DeathNotifications() {
  const deathEvents = useDeathEvents();
  const [notifications, setNotifications] = useState<DeathNotification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    deathEvents.forEach((event) => {
      if (event.type === 'death_event') {
        const notification: DeathNotification = {
          ...event.data,
          id: `${event.data.character_id}-${Date.now()}`,
          timestamp: Date.now(),
        };
        setNotifications((prev) => [...prev, notification]);

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setDismissed((prev) => new Set([...prev, notification.id]));
        }, 10000);
      }
    });
  }, [deathEvents]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visibleNotifications = notifications.filter(
    (n) => !dismissed.has(n.id) && Date.now() - n.timestamp < 15000
  );

  if (visibleNotifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-slate-800 border border-red-600 rounded-lg shadow-lg p-4 animate-slide-in-right"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-2xl mr-2">💀</span>
                <h4 className="font-medium text-white">Character Death</h4>
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-medium">{notification.character_name}</span> of{' '}
                <span className="text-dynasty-400">{notification.dynasty_name}</span> has died at age{' '}
                {notification.age}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Cause: {notification.cause}
              </p>
              {parseFloat(notification.wealth) > 10000 && (
                <p className="text-sm text-yellow-400 mt-1">
                  Market impact: {notification.market_impact.toFixed(1)}%
                </p>
              )}
            </div>
            <button
              onClick={() => handleDismiss(notification.id)}
              className="ml-4 text-slate-400 hover:text-white"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}