import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3001';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!autoConnect) return;

    console.log('🔌 Connecting to WebSocket:', WS_URL);

    const socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      setError(null);
      onConnect?.();
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();
    });

    socket.on('connect_error', (err) => {
      console.error('🔴 WebSocket error:', err.message);
      const error = new Error(err.message);
      setError(error);
      onError?.(error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  const emit = <T,>(event: string, data?: T) => {
    if (!socketRef.current) {
      console.warn('⚠️  Socket not connected');
      return;
    }
    socketRef.current.emit(event, data);
  };

  const on = <T,>(event: string, callback: (data: T) => void) => {
    if (!socketRef.current) return;
    socketRef.current.on(event, callback);
  };

  const off = <T,>(event: string, callback?: (data: T) => void) => {
    if (!socketRef.current) return;
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  };

  const api = useMemo(
    () => ({
      get socket() {
        return socketRef.current;
      },
      isConnected,
      error,
      emit,
      on,
      off,
    }),
    [isConnected, error]
  );

  return api;
}
