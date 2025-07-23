import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Play, Square, RotateCcw, Code, Monitor, Zap, Settings } from 'lucide-react';
import { LoadTestForm } from './LoadTestForm';
import { PerformanceCharts } from './PerformanceCharts';
import { LiveMetricsDashboard } from './LiveMetricsDashboard';
import { LoadTestConfig } from '../../types/loadTest';
import { useLoadTestState } from '../../store';
import { useLoadTestWebSocket } from '../../hooks/useLoadTestWebSocket';
import { loadTestService } from '../../services';

interface MetricsDataPoint {
  timestamp: number;
  requestsPerSecond: number;
  errorRate: number;
  avgResponseTime: number;
  p50ResponseTime: number;
  p90ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

export function LoadTestPanel() {
  const { 
    currentLoadTest, 
    setCurrentLoadTest, 
    loadTestExecutions, 
    addLoadTestExecution 
  } = useLoadTestState();
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);
  const [showGraphQL, setShowGraphQL] = useState(false);
  const [metricsHistory, setMetricsHistory] = useState<MetricsDataPoint[]>([]);

  // WebSocket hook for real-time updates
  const {
    metrics,
    status,
    logs,
    isConnected,
    error: wsError,
    isTestRunning,
    testDuration,
    errorLogs,
  } = useLoadTestWebSocket(currentTestId || undefined);

  // Handle load test submission
  const handleSubmit = useCallback(async (config: LoadTestConfig) => {
    try {
      setIsLoading(true);
      
      // Start the load test
      const response = await loadTestService.startLoadTest(config);
      const testId = response.testId;
      
      // Update state
      setCurrentTestId(testId);
      setCurrentLoadTest(config);
      setIsRunning(true);
      
      // Add to executions
      addLoadTestExecution({
        id: testId,
        config,
        status: 'running',
        started_at: new Date(),
        metrics: null,
      });
      
    } catch (error) {
      console.error('Failed to start load test:', error);
      // Handle error - could show toast notification
    } finally {
      setIsLoading(false);
    }
  }, [setCurrentLoadTest, addLoadTestExecution]);

  // Handle stopping the test
  const handleStop = useCallback(async () => {
    if (!currentTestId) return;
    
    try {
      setIsLoading(true);
      await loadTestService.stopLoadTest(currentTestId);
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to stop load test:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTestId]);

  // Handle reset
  const handleReset = useCallback(() => {
    setCurrentTestId(null);
    setIsRunning(false);
    setCurrentLoadTest(null);
    setMetricsHistory([]);
  }, [setCurrentLoadTest]);

  // Update metrics history when new metrics arrive
  useEffect(() => {
    if (metrics && isRunning) {
      const newDataPoint: MetricsDataPoint = {
        timestamp: Date.now(),
        requestsPerSecond: metrics.requestsPerSecond || 0,
        errorRate: metrics.errorRate || 0,
        avgResponseTime: metrics.avgResponseTime || 0,
        p50ResponseTime: metrics.p50ResponseTime || 0,
        p90ResponseTime: metrics.p90ResponseTime || 0,
        p95ResponseTime: metrics.p95ResponseTime || 0,
        p99ResponseTime: metrics.p99ResponseTime || 0,
        activeUsers: metrics.activeUsers || 0,
        totalRequests: metrics.totalRequests || 0,
        successfulRequests: metrics.successfulRequests || 0,
        failedRequests: metrics.failedRequests || 0,
      };

      setMetricsHistory(prev => {
        // Keep last 100 data points for performance
        const updated = [...prev, newDataPoint];
        return updated.slice(-100);
      });
    }
  }, [metrics, isRunning]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Load Test Configuration
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Configure and execute high-performance load tests with up to 10,000 virtual users
              </p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            {isConnected && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Connected</span>
              </div>
            )}
            
            {isRunning && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Monitor className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Test Running
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReset}
            disabled={isRunning || isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          
          <button
            onClick={() => setShowGraphQL(!showGraphQL)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              showGraphQL
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>GraphQL Mode</span>
          </button>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          <div className="glass-panel">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test Configuration
              </h3>
            </div>
            
            <LoadTestForm
              onSubmit={handleSubmit}
              onStop={handleStop}
              isRunning={isRunning}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Right Panel - Real-time Monitoring */}
        <div className="space-y-6">
          {/* Live Metrics Dashboard */}
          <LiveMetricsDashboard
            metrics={metrics ? {
              activeUsers: metrics.activeUsers || 0,
              avgResponseTime: metrics.avgResponseTime || 0,
              maxLatency: metrics.p99ResponseTime || 0,
              successRate: (1 - (metrics.errorRate || 0)),
              totalRequests: metrics.totalRequests || 0,
              requestsPerSecond: metrics.requestsPerSecond || 0,
              errorRate: metrics.errorRate || 0,
              p95ResponseTime: metrics.p95ResponseTime || 0,
              successfulRequests: metrics.successfulRequests || 0,
              failedRequests: metrics.failedRequests || 0,
            } : null}
            isRunning={isRunning}
            testDuration={testDuration}
          />

          {/* Performance Charts */}
          <PerformanceCharts 
            metricsData={metricsHistory}
            isRunning={isRunning}
          />

          {/* Error Logs */}
          {errorLogs.length > 0 && (
            <div className="glass-panel">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Errors
              </h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {errorLogs.slice(-5).map((log, index) => (
                  <div key={index} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <span className="font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="ml-2">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}