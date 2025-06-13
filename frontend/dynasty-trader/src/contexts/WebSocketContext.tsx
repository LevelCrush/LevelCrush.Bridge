import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { WebSocketMessage, WebSocketMessageType } from '@/types';
import toast from 'react-hot-toast';

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  sendMessage: (message: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { tokens, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!isAuthenticated || !tokens?.access_token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection with auth
    const newSocket = io({
      path: '/ws',
      auth: {
        token: tokens.access_token,
      },
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      
      // Resubscribe to channels if needed
      const subscribedChannels = localStorage.getItem('ws_subscribed_channels');
      if (subscribedChannels) {
        const channels = JSON.parse(subscribedChannels);
        channels.forEach((channel: string) => {
          newSocket.emit('message', {
            type: WebSocketMessageType.Subscribe,
            channel,
          });
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        toast.error('Failed to connect to real-time updates');
      }
    });

    // Message handlers
    newSocket.on('message', (message: WebSocketMessage) => {
      switch (message.type) {
        case WebSocketMessageType.MarketUpdate:
          // Handle market updates - will be consumed by market components
          break;
          
        case WebSocketMessageType.CharacterDeath:
          // Show notification for character deaths
          const deathData = message.data;
          toast(`${deathData.character_name} of ${deathData.dynasty_name} has died at age ${deathData.age}`, {
            icon: '💀',
            duration: 5000,
          });
          break;
          
        case WebSocketMessageType.Error:
          toast.error(message.data.message);
          break;
          
        default:
          // Other message types handled by specific components
          break;
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, tokens?.access_token]);

  const subscribe = (channel: string) => {
    if (!socket || !isConnected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    socket.emit('message', {
      type: WebSocketMessageType.Subscribe,
      channel,
    });

    // Store subscribed channels for reconnection
    const stored = localStorage.getItem('ws_subscribed_channels');
    const channels = stored ? JSON.parse(stored) : [];
    if (!channels.includes(channel)) {
      channels.push(channel);
      localStorage.setItem('ws_subscribed_channels', JSON.stringify(channels));
    }
  };

  const unsubscribe = (channel: string) => {
    if (!socket || !isConnected) {
      return;
    }

    socket.emit('message', {
      type: WebSocketMessageType.Unsubscribe,
      channel,
    });

    // Remove from stored channels
    const stored = localStorage.getItem('ws_subscribed_channels');
    if (stored) {
      const channels = JSON.parse(stored);
      const filtered = channels.filter((ch: string) => ch !== channel);
      localStorage.setItem('ws_subscribed_channels', JSON.stringify(filtered));
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (!socket || !isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    socket.emit('message', message);
  };

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