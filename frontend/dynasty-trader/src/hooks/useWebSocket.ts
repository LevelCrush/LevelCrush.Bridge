import { useEffect, useCallback, useState } from 'react';
import { websocketService, WebSocketMessage } from '@/services/websocket';
import { useAuth } from '@/contexts/AuthContext';

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect();
      
      // Check connection status periodically
      const interval = setInterval(() => {
        setIsConnected(websocketService.isConnected());
      }, 1000);
      
      return () => {
        clearInterval(interval);
        websocketService.disconnect();
      };
    }
  }, [isAuthenticated]);
  
  const subscribe = useCallback((channel: string) => {
    websocketService.subscribe(channel);
  }, []);
  
  const unsubscribe = useCallback((channel: string) => {
    websocketService.unsubscribe(channel);
  }, []);
  
  const addHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    return websocketService.addHandler(handler);
  }, []);
  
  return {
    isConnected,
    subscribe,
    unsubscribe,
    addHandler
  };
}

export function useMarketUpdates(regionId?: string) {
  const { subscribe, unsubscribe, addHandler } = useWebSocket();
  const [lastUpdate, setLastUpdate] = useState<WebSocketMessage | null>(null);
  
  useEffect(() => {
    if (!regionId) return;
    
    const channel = `market:${regionId}`;
    subscribe(channel);
    
    const cleanup = addHandler((message) => {
      if (message.type === 'market_update' && message.data.region_id === regionId) {
        setLastUpdate(message);
      }
    });
    
    return () => {
      unsubscribe(channel);
      cleanup();
    };
  }, [regionId, subscribe, unsubscribe, addHandler]);
  
  return lastUpdate;
}

export function useDeathEvents() {
  const { subscribe, unsubscribe, addHandler } = useWebSocket();
  const [deathEvents, setDeathEvents] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    subscribe('deaths');
    
    const cleanup = addHandler((message) => {
      if (message.type === 'death_event') {
        setDeathEvents(prev => [...prev, message]);
      }
    });
    
    return () => {
      unsubscribe('deaths');
      cleanup();
    };
  }, [subscribe, unsubscribe, addHandler]);
  
  return deathEvents;
}

export function useMarketEvents() {
  const { subscribe, unsubscribe, addHandler } = useWebSocket();
  const [marketEvents, setMarketEvents] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    subscribe('events');
    
    const cleanup = addHandler((message) => {
      if (message.type === 'market_event') {
        setMarketEvents(prev => [...prev, message]);
      }
    });
    
    return () => {
      unsubscribe('events');
      cleanup();
    };
  }, [subscribe, unsubscribe, addHandler]);
  
  return marketEvents;
}

export function usePriceUpdates(regionId?: string, itemId?: string) {
  const { subscribe, unsubscribe, addHandler } = useWebSocket();
  const [priceHistory, setPriceHistory] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    if (!regionId) return;
    
    const channel = `market:${regionId}`;
    subscribe(channel);
    
    const cleanup = addHandler((message) => {
      if (message.type === 'price_update' && 
          message.data.region_id === regionId &&
          (!itemId || message.data.item_id === itemId)) {
        setPriceHistory(prev => [...prev, message]);
      }
    });
    
    return () => {
      unsubscribe(channel);
      cleanup();
    };
  }, [regionId, itemId, subscribe, unsubscribe, addHandler]);
  
  return priceHistory;
}