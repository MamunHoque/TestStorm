// WebSocket hook for real-time communication
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface LoadTestMetricsUpdate {
  testId: string;
  timestamp: Date;
  activeUsers: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  elapsedTime: number;
}

export interface LoadTestStatusUpdate {
  testId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface LoadTestLogEntry {
  testId: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastConnected: Date | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastConnected: null,
  });

  const [subscribedTests, setSubscribedTests] = useState<Set<string>>(new Set());

  // Event handlers
  const eventHandlers = useRef<Map<string, Function[]>>(new Map());

  // Connect to WebSocket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
    
    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setState({
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date(),
      });
    });

    socket.on('disconnect', (reason: string) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
      }));
    });

    socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message,
      }));
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date(),
      }));
    });

    socket.on('reconnect_error', (error: Error) => {
      console.error('WebSocket reconnection error:', error);
      setState(prev => ({
        ...prev,
        error: error.message,
      }));
    });

    // Server events
    socket.on('connected', (data: any) => {
      console.log('Server connection confirmed:', data);
    });

    socket.on('subscribed', (data: { testId: string; timestamp: string }) => {
      console.log(`Subscribed to test: ${data.testId}`);
      setSubscribedTests(prev => new Set([...prev, data.testId]));
    });

    socket.on('unsubscribed', (data: { testId: string; timestamp: string }) => {
      console.log(`Unsubscribed from test: ${data.testId}`);
      setSubscribedTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.testId);
        return newSet;
      });
    });

    // Load test events
    socket.on('metrics-update', (metrics: LoadTestMetricsUpdate) => {
      triggerEventHandlers('metrics-update', metrics);
    });

    socket.on('status-update', (status: LoadTestStatusUpdate) => {
      triggerEventHandlers('status-update', status);
    });

    socket.on('log-entry', (logEntry: LoadTestLogEntry) => {
      triggerEventHandlers('log-entry', logEntry);
    });

    socket.on('test-complete', (data: any) => {
      triggerEventHandlers('test-complete', data);
    });

    socket.on('test-status', (status: LoadTestStatusUpdate) => {
      triggerEventHandlers('test-status', status);
    });

    socket.on('error', (error: any) => {
      console.error('WebSocket server error:', error);
      triggerEventHandlers('error', error);
    });

    socket.on('server-shutdown', (data: any) => {
      console.warn('Server is shutting down:', data);
      triggerEventHandlers('server-shutdown', data);
    });

  }, [reconnection, reconnectionAttempts, reconnectionDelay]);

  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        connecting: false,
        error: null,
        lastConnected: null,
      });
      setSubscribedTests(new Set());
    }
  }, []);

  // Subscribe to test updates
  const subscribeToTest = useCallback((testId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe-test', testId);
    }
  }, []);

  // Unsubscribe from test updates
  const unsubscribeFromTest = useCallback((testId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe-test', testId);
    }
  }, []);

  // Get test status
  const getTestStatus = useCallback((testId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get-test-status', testId);
    }
  }, []);

  // Add event listener
  const addEventListener = useCallback((event: string, handler: Function) => {
    if (!eventHandlers.current.has(event)) {
      eventHandlers.current.set(event, []);
    }
    eventHandlers.current.get(event)!.push(handler);

    // Return cleanup function
    return () => {
      const handlers = eventHandlers.current.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);

  // Remove event listener
  const removeEventListener = useCallback((event: string, handler: Function) => {
    const handlers = eventHandlers.current.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }, []);

  // Trigger event handlers
  const triggerEventHandlers = useCallback((event: string, data: any) => {
    const handlers = eventHandlers.current.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventHandlers.current.clear();
    };
  }, []);

  return {
    // State
    ...state,
    subscribedTests: Array.from(subscribedTests),
    
    // Actions
    connect,
    disconnect,
    subscribeToTest,
    unsubscribeFromTest,
    getTestStatus,
    
    // Event handling
    addEventListener,
    removeEventListener,
    
    // Socket instance (for advanced usage)
    socket: socketRef.current,
  };
}