import { authStore } from '@/stores/authStore';

export type WebSocketMessage = 
  | { type: 'market_update'; data: MarketUpdate }
  | { type: 'death_event'; data: DeathEvent }
  | { type: 'market_event'; data: MarketEventNotification }
  | { type: 'price_update'; data: PriceUpdate };

export interface MarketUpdate {
  region_id: string;
  listing_id: string;
  action: 'new' | 'sold' | 'expired' | 'updated';
  price?: string;
  quantity?: number;
}

export interface DeathEvent {
  character_id: string;
  character_name: string;
  dynasty_name: string;
  age: number;
  wealth: string;
  cause: string;
  region_id: string;
  market_impact: number;
}

export interface MarketEventNotification {
  event_id: string;
  event_type: string;
  title: string;
  description: string;
  affected_regions: string[];
  price_modifier: number;
  duration_hours: number;
}

export interface PriceUpdate {
  region_id: string;
  item_id: string;
  old_price: string;
  new_price: string;
  timestamp: string;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: number | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  
  connect(): void {
    const token = authStore.getState().token;
    if (!token) {
      console.error('No auth token available for WebSocket connection');
      return;
    }

    const wsUrl = import.meta.env.VITE_API_URL.replace('http', 'ws') + '/ws/market';
    
    try {
      this.ws = new WebSocket(wsUrl, [token]);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Resubscribe to all channels
        this.subscriptions.forEach(channel => {
          this.subscribe(channel);
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.handlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.ws = null;
        
        // Attempt reconnection if it wasn't a deliberate close
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }
  
  private scheduleReconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds
    
    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectInterval = window.setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  disconnect(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.handlers.clear();
    this.subscriptions.clear();
    this.reconnectAttempts = 0;
  }
  
  subscribe(channel: string): void {
    this.subscriptions.add(channel);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        channel
      }));
    }
  }
  
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        channel
      }));
    }
  }
  
  addHandler(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    
    // Return cleanup function
    return () => {
      this.handlers.delete(handler);
    };
  }
  
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();