import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Activity, Clock, AlertTriangle } from 'lucide-react';

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

interface PerformanceChartsProps {
  metricsData: MetricsDataPoint[];
  isRunning: boolean;
}

type ChartTab = 'requests-errors' | 'response-times' | 'latency-distribution';

export function PerformanceCharts({ metricsData, isRunning }: PerformanceChartsProps) {
  const [activeTab, setActiveTab] = useState<ChartTab>('requests-errors');

  // Process data for different chart types
  const processedData = useMemo(() => {
    return metricsData.map((point, index) => ({
      ...point,
      time: new Date(point.timestamp).toLocaleTimeString(),
      timeIndex: index,
      errorPercentage: (point.errorRate * 100).toFixed(1),
      successRate: ((1 - point.errorRate) * 100).toFixed(1),
    }));
  }, [metricsData]);

  // Latency distribution data for the current moment
  const latencyDistribution = useMemo(() => {
    if (processedData.length === 0) return [];
    
    const latest = processedData[processedData.length - 1];
    return [
      { name: 'P50', value: latest.p50ResponseTime, color: '#10b981' },
      { name: 'P90', value: latest.p90ResponseTime, color: '#f59e0b' },
      { name: 'P95', value: latest.p95ResponseTime, color: '#ef4444' },
      { name: 'P99', value: latest.p99ResponseTime, color: '#8b5cf6' },
    ];
  }, [processedData]);

  const tabs = [
    {
      id: 'requests-errors' as ChartTab,
      label: 'Requests/sec vs Errors',
      icon: TrendingUp,
      description: 'Request throughput and error rates over time',
    },
    {
      id: 'response-times' as ChartTab,
      label: 'Response Times',
      icon: Clock,
      description: 'Response time percentiles (P50, P90, P95, P99)',
    },
    {
      id: 'latency-distribution' as ChartTab,
      label: 'Latency Distribution',
      icon: Activity,
      description: 'Current latency distribution across percentiles',
    },
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Time: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              {entry.dataKey.includes('Rate') || entry.dataKey.includes('Percentage') ? '%' : 
               entry.dataKey.includes('Time') ? 'ms' : 
               entry.dataKey.includes('Requests') ? ' req/s' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isRunning && metricsData.length === 0) {
    return (
      <div className="glass-panel">
        <div className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Real-time Performance Charts
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start a load test to see real-time performance metrics and charts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      {/* Chart Tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Analytics
        </h3>
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Content */}
      <div className="h-80">
        {activeTab === 'requests-errors' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Requests/sec', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Error Rate (%)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="requestsPerSecond"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="Requests/sec"
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="errorPercentage"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="Error Rate (%)"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'response-times' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="p50ResponseTime"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="P50"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="p90ResponseTime"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="P90"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="p95ResponseTime"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="P95"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="p99ResponseTime"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                name="P99"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'latency-distribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Pie Chart */}
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Current Latency Distribution
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={latencyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {latencyDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}ms`, 'Response Time']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Percentile Breakdown
              </h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickLine={false}
                    label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value}ms`, 'Response Time']}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Chart Status */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-gray-600 dark:text-gray-400">
                {isRunning ? 'Live Data' : 'Historical Data'}
              </span>
            </div>
            
            <span className="text-gray-600 dark:text-gray-400">
              Data Points: {processedData.length}
            </span>
          </div>

          <div className="text-gray-500 dark:text-gray-500 text-xs">
            {isRunning ? 'Charts update in real-time' : 'Test completed'}
          </div>
        </div>
      </div>
    </div>
  );
}