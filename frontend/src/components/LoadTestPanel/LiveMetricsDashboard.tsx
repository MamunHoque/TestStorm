import React from 'react';
import { Activity, Clock, CheckCircle, AlertTriangle, Users, Zap } from 'lucide-react';

interface MetricsData {
  activeUsers: number;
  avgResponseTime: number;
  maxLatency: number;
  successRate: number;
  totalRequests: number;
  requestsPerSecond: number;
  errorRate: number;
  p95ResponseTime: number;
}

interface LiveMetricsDashboardProps {
  metrics: MetricsData | null;
  isRunning: boolean;
  testDuration: number;
}

export function LiveMetricsDashboard({ metrics, isRunning, testDuration }: LiveMetricsDashboardProps) {
  // Calculate derived metrics
  const successPercentage = metrics ? (metrics.successRate * 100) : 0;
  const failPercentage = 100 - successPercentage;
  const formattedDuration = formatDuration(testDuration);

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Format duration
  function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get status color based on metrics
  const getStatusColor = () => {
    if (!isRunning) return 'bg-gray-400';
    if (!metrics) return 'bg-yellow-500';
    
    if (metrics.errorRate > 0.1) return 'bg-red-500'; // >10% error rate
    if (metrics.avgResponseTime > 2000) return 'bg-orange-500'; // >2s response time
    return 'bg-green-500'; // All good
  };

  const getStatusText = () => {
    if (!isRunning) return 'Idle';
    if (!metrics) return 'Starting';
    
    if (metrics.errorRate > 0.1) return 'High Error Rate';
    if (metrics.avgResponseTime > 2000) return 'Slow Response';
    return 'Healthy';
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="glass-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${isRunning ? 'animate-pulse' : ''}`} />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Load Test Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText()} • Duration: {formattedDuration}
              </p>
            </div>
          </div>
          
          {isRunning && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Live
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Response Time */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Response
              </span>
            </div>
            {isRunning && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics?.avgResponseTime ? `${Math.round(metrics.avgResponseTime)}` : '0'}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">ms</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            P95: {metrics?.p95ResponseTime ? `${Math.round(metrics.p95ResponseTime)}ms` : '0ms'}
          </div>
        </div>

        {/* Max Latency */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Max Latency
              </span>
            </div>
            {isRunning && <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics?.maxLatency ? `${Math.round(metrics.maxLatency)}` : '0'}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">ms</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Peak response time
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </span>
            </div>
            {isRunning && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {successPercentage.toFixed(1)}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">%</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {metrics?.totalRequests ? formatNumber(metrics.totalRequests) : '0'} total requests
          </div>
        </div>

        {/* Total Requests */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Requests/sec
              </span>
            </div>
            {isRunning && <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />}
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {metrics?.requestsPerSecond ? Math.round(metrics.requestsPerSecond) : '0'}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-1">req/s</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {metrics?.activeUsers || 0} active users
          </div>
        </div>
      </div>

      {/* Success vs Fail Progress Bar */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Request Success Rate
          </h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                Success ({successPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-gray-600 dark:text-gray-400">
                Failed ({failPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 ease-out"
            style={{ width: `${successPercentage}%` }}
          />
          <div 
            className="absolute right-0 top-0 h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500 ease-out"
            style={{ width: `${failPercentage}%` }}
          />
          
          {/* Progress Bar Labels */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-medium text-white drop-shadow-sm">
              {metrics?.totalRequests ? formatNumber(metrics.totalRequests) : '0'} requests
            </span>
          </div>
        </div>
        
        {/* Detailed Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metrics?.successfulRequests ? formatNumber(metrics.successfulRequests) : '0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Successful</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metrics?.failedRequests ? formatNumber(metrics.failedRequests) : '0'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {metrics?.errorRate ? `${(metrics.errorRate * 100).toFixed(2)}%` : '0%'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Error Rate</div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Virtual Users */}
        <div className="glass-panel text-center">
          <Users className="w-8 h-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics?.activeUsers || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Virtual Users</div>
        </div>

        {/* Test Duration */}
        <div className="glass-panel text-center">
          <Clock className="w-8 h-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formattedDuration}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Test Duration</div>
        </div>

        {/* Throughput */}
        <div className="glass-panel text-center">
          <Activity className="w-8 h-8 mx-auto text-purple-600 dark:text-purple-400 mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics?.requestsPerSecond ? formatNumber(metrics.requestsPerSecond) : '0'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Throughput (req/s)</div>
        </div>
      </div>
    </div>
  );
}