import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Terminal, Filter, Download, Trash2 } from 'lucide-react';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
}

interface LiveLogsPanelProps {
  logs: LogEntry[];
  isRunning: boolean;
  className?: string;
}

type LogLevel = 'all' | 'info' | 'warn' | 'error' | 'debug';

export function LiveLogsPanel({ logs, isRunning, className = '' }: LiveLogsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterLevel, setFilterLevel] = useState<LogLevel>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Filter logs based on level and search term
  const filteredLogs = logs.filter(log => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.url?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return levelMatch && searchMatch;
  });

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoScroll]);

  // Handle manual scroll to disable auto-scroll
  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setAutoScroll(isAtBottom);
    }
  };

  // Format log entry for display
  const formatLogEntry = (log: LogEntry): string => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const method = log.method || '';
    const url = log.url || '';
    const status = log.statusCode ? ` – ${log.statusCode}` : '';
    const responseTime = log.responseTime ? ` – ${log.responseTime}ms` : '';
    
    if (method && url) {
      return `[${timestamp}] ${method} ${url}${status}${responseTime}`;
    }
    
    return `[${timestamp}] ${log.message}`;
  };

  // Get log level color
  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400';
      case 'info': return 'text-blue-600 dark:text-blue-400';
      case 'debug': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-900 dark:text-gray-100';
    }
  };

  // Get log level background
  const getLogLevelBg = (level: string): string => {
    switch (level) {
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-l-red-500';
      case 'warn': return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-yellow-500';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-l-blue-500';
      case 'debug': return 'bg-gray-50 dark:bg-gray-900/20 border-l-gray-500';
      default: return 'bg-white dark:bg-gray-800 border-l-gray-300';
    }
  };

  // Export logs to file
  const exportLogs = () => {
    const logText = filteredLogs.map(log => formatLogEntry(log)).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-test-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const clearLogs = () => {
    // This would need to be implemented in the parent component
    console.log('Clear logs requested');
  };

  const logLevelOptions = [
    { value: 'all' as LogLevel, label: 'All Logs', count: logs.length },
    { value: 'error' as LogLevel, label: 'Errors', count: logs.filter(l => l.level === 'error').length },
    { value: 'warn' as LogLevel, label: 'Warnings', count: logs.filter(l => l.level === 'warn').length },
    { value: 'info' as LogLevel, label: 'Info', count: logs.filter(l => l.level === 'info').length },
    { value: 'debug' as LogLevel, label: 'Debug', count: logs.filter(l => l.level === 'debug').length },
  ];

  return (
    <div className={`glass-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Terminal className="w-5 h-5" />
          <span>Live Logs</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({filteredLogs.length})
          </span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                autoScroll
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
              title="Toggle auto-scroll"
            >
              Auto-scroll
            </button>

            {/* Export logs */}
            <button
              onClick={exportLogs}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              title="Export logs"
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear logs */}
            <button
              onClick={clearLogs}
              className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Clear logs"
              disabled={logs.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            {/* Log level filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as LogLevel)}
                className="text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {logLevelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search filter */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isRunning ? 'Live' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Logs container */}
          <div 
            ref={logsContainerRef}
            onScroll={handleScroll}
            className="h-64 overflow-y-auto bg-gray-900 dark:bg-black rounded-lg p-3 font-mono text-sm scrollbar-thin"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {logs.length === 0 ? (
                  <>
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No logs yet. Start a load test to see real-time logs.</p>
                  </>
                ) : (
                  <p>No logs match the current filter criteria.</p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border-l-2 ${getLogLevelBg(log.level)} transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`${getLogLevelColor(log.level)} break-all`}>
                          {formatLogEntry(log)}
                        </div>
                        {log.message !== formatLogEntry(log) && (
                          <div className="text-gray-600 dark:text-gray-400 mt-1 text-xs">
                            {log.message}
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`inline-block px-1.5 py-0.5 text-xs rounded uppercase font-medium ${
                          log.level === 'error' ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200' :
                          log.level === 'warn' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                          log.level === 'info' ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' :
                          'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>Total: {logs.length} logs</span>
                <span>Filtered: {filteredLogs.length} logs</span>
                {searchTerm && <span>Search: "{searchTerm}"</span>}
              </div>
              <div className="flex items-center space-x-2">
                {!autoScroll && (
                  <button
                    onClick={() => {
                      setAutoScroll(true);
                      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Scroll to bottom
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}