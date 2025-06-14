import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { WebSocketMessage, WebSocketMessageType } from '@/types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { tokens, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout>>();
  const maxReconnectAttempts = 5;
  const subscribedChannels = useRef<Set<string>>(new Set());
  const hasShownError = useRef(false);

  const connect = useCallback(() => {
    if (!isAuthenticated || !tokens?.access_token) {
      return;
    }

    try {
      // Use ws:// for local development, wss:// for production
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/market`;
      
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        hasShownError.current = false;
        
        // Send auth message
        newSocket.send(JSON.stringify({
          type: 'auth',
          token: tokens.access_token,
        }));

        // Resubscribe to channels
        subscribedChannels.current.forEach(channel => {
          newSocket.send(JSON.stringify({
            type: WebSocketMessageType.Subscribe,
            channel,
          }));
        });
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setSocket(null);

        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts && isAuthenticated) {
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(() => {
            console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000));
        } else if (!hasShownError.current && reconnectAttempts.current >= maxReconnectAttempts) {
          hasShownError.current = true;
          // Only show error after multiple failed attempts
          console.warn('Failed to connect to real-time updates after multiple attempts');
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case WebSocketMessageType.MarketUpdate:
              // Handle market updates - will be consumed by market components
              break;
              
            case WebSocketMessageType.CharacterDeath:
              // Handle character deaths with enhanced notifications
              import('@/services/deathEventManager').then(({ deathEventManager }) => {
                deathEventManager.handleCharacterDeath(message.data);
              });
              break;
              
            case WebSocketMessageType.Error:
              console.error('WebSocket error message:', message.data.message);
              break;
              
            default:
              // Other message types handled by specific components
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [isAuthenticated, tokens?.access_token]);

  useEffect(() => {
    if (!isAuthenticated || !tokens?.access_token) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      return;
    }

    connect();

    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [isAuthenticated, tokens?.access_token, connect]);

  const subscribe = useCallback((channel: string) => {
    subscribedChannels.current.add(channel);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: WebSocketMessageType.Subscribe,
        channel,
      }));
    }
  }, [socket]);

  const unsubscribe = useCallback((channel: string) => {
    subscribedChannels.current.delete(channel);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: WebSocketMessageType.Unsubscribe,
        channel,
      }));
    }
  }, [socket]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket]);

  const value: WebSocketContextType = {
    socket,
    isConnected,
    subscribe,
    unsubscribe,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}