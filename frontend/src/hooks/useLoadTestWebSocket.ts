// Specialized hook for load test WebSocket events
import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, LoadTestMetricsUpdate, LoadTestStatusUpdate, LoadTestLogEntry } from './useWebSocket';
import { useLoadTestState } from '../store';

interface LoadTestWebSocketState {
  metrics: LoadTestMetricsUpdate | null;
  status: LoadTestStatusUpdate | null;
  logs: LoadTestLogEntry[];
  isConnected: boolean;
  error: string | null;
}

export function useLoadTestWebSocket(testId?: string) {
  const {
    connected,
    error,
    subscribeToTest,
    unsubscribeFromTest,
    getTestStatus,
    addEventListener,
    removeEventListener,
  } = useWebSocket();

  const { updateLoadTestExecution } = useLoadTestState();

  const [state, setState] = useState<LoadTestWebSocketState>({
    metrics: null,
    status: null,
    logs: [],
    isConnected: false,
    error: null,
  });

  // Handle metrics updates
  const handleMetricsUpdate = useCallback((metrics: LoadTestMetricsUpdate) => {
    if (!testId || metrics.testId === testId) {
      setState(prev => ({ ...prev, metrics }));
    }
  }, [testId]);

  // Handle status updates
  const handleStatusUpdate = useCallback((status: LoadTestStatusUpdate) => {
    if (!testId || status.testId === testId) {
      setState(prev => ({ ...prev, status }));
      
      // Update store with status change
      if (testId) {
        updateLoadTestExecution(testId, {
          status: status.status,
          ...(status.error && { error_message: status.error }),
          ...(status.status === 'completed' && { completed_at: new Date() }),
        });
      }
    }
  }, [testId, updateLoadTestExecution]);

  // Handle log entries
  const handleLogEntry = useCallback((logEntry: LoadTestLogEntry) => {
    if (!testId || logEntry.testId === testId) {
      setState(prev => ({
        ...prev,
        logs: [...prev.logs.slice(-99), logEntry], // Keep last 100 logs
      }));
    }
  }, [testId]);

  // Handle test completion
  const handleTestComplete = useCallback((data: any) => {
    if (!testId || data.testId === testId) {
      setState(prev => ({
        ...prev,
        status: {
          testId: data.testId,
          status: 'completed',
          timestamp: new Date(data.timestamp),
        },
      }));

      // Update store with completion
      if (testId) {
        updateLoadTestExecution(testId, {
          status: 'completed',
          completed_at: new Date(),
        });
      }
    }
  }, [testId, updateLoadTestExecution]);

  // Handle test status response
  const handleTestStatus = useCallback((status: LoadTestStatusUpdate) => {
    if (!testId || status.testId === testId) {
      setState(prev => ({ ...prev, status }));
    }
  }, [testId]);

  // Handle WebSocket errors
  const handleWebSocketError = useCallback((error: any) => {
    setState(prev => ({ ...prev, error: error.message || 'WebSocket error' }));
  }, []);

  // Subscribe to test when testId changes
  useEffect(() => {
    if (connected && testId) {
      subscribeToTest(testId);
      getTestStatus(testId);

      return () => {
        unsubscribeFromTest(testId);
      };
    }
  }, [connected, testId, subscribeToTest, unsubscribeFromTest, getTestStatus]);

  // Set up event listeners
  useEffect(() => {
    const cleanupFunctions = [
      addEventListener('metrics-update', handleMetricsUpdate),
      addEventListener('status-update', handleStatusUpdate),
      addEventListener('log-entry', handleLogEntry),
      addEventListener('test-complete', handleTestComplete),
      addEventListener('test-status', handleTestStatus),
      addEventListener('error', handleWebSocketError),
    ];

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [
    addEventListener,
    handleMetricsUpdate,
    handleStatusUpdate,
    handleLogEntry,
    handleTestComplete,
    handleTestStatus,
    handleWebSocketError,
  ]);

  // Update connection state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isConnected: connected,
      error: error,
    }));
  }, [connected, error]);

  // Clear logs when testId changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      logs: [],
      metrics: null,
      status: null,
    }));
  }, [testId]);

  // Get filtered logs by level
  const getLogsByLevel = useCallback((level?: 'info' | 'warn' | 'error' | 'debug') => {
    if (!level) return state.logs;
    return state.logs.filter(log => log.level === level);
  }, [state.logs]);

  // Get latest metrics for specific metric type
  const getLatestMetric = useCallback((metricName: keyof LoadTestMetricsUpdate) => {
    return state.metrics?.[metricName] || null;
  }, [state.metrics]);

  // Check if test is currently running
  const isTestRunning = useCallback(() => {
    return state.status?.status === 'running';
  }, [state.status]);

  // Get test duration
  const getTestDuration = useCallback(() => {
    return state.metrics?.elapsedTime || 0;
  }, [state.metrics]);

  return {
    // State
    ...state,
    
    // Computed values
    isTestRunning: isTestRunning(),
    testDuration: getTestDuration(),
    errorLogs: getLogsByLevel('error'),
    
    // Methods
    getLogsByLevel,
    getLatestMetric,
    
    // Actions
    subscribeToTest: (id: string) => subscribeToTest(id),
    unsubscribeFromTest: (id: string) => unsubscribeFromTest(id),
    refreshStatus: () => testId && getTestStatus(testId),
  };
}