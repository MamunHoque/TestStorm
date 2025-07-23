import React, { useState, useCallback } from 'react';
import { Play, Square, RotateCcw, Code, Monitor, Zap, Settings } from 'lucide-react';
import { LoadTestForm } from './LoadTestForm';
import { LoadTestConfig } from '../../types/loadTest';
import { useLoadTestState } from '../../store';
import { useLoadTestWebSocket } from '../../hooks/useLoadTestWebSocket';
import { loadTestService } from '../../services';

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
  }, [setCurrentLoadTest]);

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
          {/* Metrics Overview */}
          <div className="glass-panel">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Real-time Metrics
            </h3>
            
            {!isRunning && !currentTestId ? (
              <div className="text-center py-8">
                <Monitor className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Start a load test to see real-time metrics
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Virtual Users */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Virtual Users
                    </span>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                    {metrics?.activeUsers || 0}
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Avg Response
                    </span>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                    {metrics?.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}ms` : '0ms'}
                  </div>
                </div>

                {/* Requests Per Second */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Requests/sec
                    </span>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                    {metrics?.requestsPerSecond ? Math.round(metrics.requestsPerSecond) : 0}
                  </div>
                </div>

                {/* Error Rate */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      Error Rate
                    </span>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                    {metrics?.errorRate ? `${(metrics.errorRate * 100).toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Status */}
          {(isRunning || currentTestId) && (
            <div className="glass-panel">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Test Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status?.status === 'running' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : status?.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {status?.status || 'idle'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {testDuration ? `${Math.floor(testDuration / 1000)}s` : '0s'}
                  </span>
                </div>
                
                {errorLogs.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Recent Errors ({errorLogs.length}):
                    </span>
                    <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                      {errorLogs.slice(-3).map((log, index) => (
                        <div key={index} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                          {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}