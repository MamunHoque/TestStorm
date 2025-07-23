import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Trash2, Calendar, Clock, Users, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedContainer, LoadingSkeleton } from '../common';

interface TestResult {
  id: string;
  name: string;
  url: string;
  method: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  virtualUsers: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  status: 'completed' | 'failed' | 'stopped';
  tags?: string[];
}

interface TestResultsHistoryProps {
  results: TestResult[];
  loading?: boolean;
  onResultSelect?: (result: TestResult) => void;
  onResultDelete?: (resultId: string) => void;
  onResultExport?: (result: TestResult) => void;
}

type SortField = 'startTime' | 'duration' | 'virtualUsers' | 'totalRequests' | 'avgResponseTime' | 'errorRate';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'completed' | 'failed' | 'stopped';

export function TestResultsHistory({ 
  results, 
  loading = false, 
  onResultSelect, 
  onResultDelete, 
  onResultExport 
}: TestResultsHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      const matchesSearch = searchTerm === '' || 
        result.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.method.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || result.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });

    // Sort results
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'startTime' || sortField === 'endTime') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [results, searchTerm, statusFilter, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle selection
  const handleSelectResult = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedResults.size === filteredAndSortedResults.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(filteredAndSortedResults.map(r => r.id)));
    }
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'stopped': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton variant="text" height="2rem" width="300px" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingSkeleton key={index} variant="rounded" height="80px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Test Results History
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {results.length} total results • {filteredAndSortedResults.length} filtered
          </p>
        </div>
        
        {selectedResults.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedResults.size} selected
            </span>
            <button
              onClick={() => {
                selectedResults.forEach(id => {
                  const result = results.find(r => r.id === id);
                  if (result && onResultExport) onResultExport(result);
                });
              }}
              className="btn-secondary text-sm"
              title="Export selected"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                selectedResults.forEach(id => {
                  if (onResultDelete) onResultDelete(id);
                });
                setSelectedResults(new Set());
              }}
              className="btn-danger text-sm"
              title="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-panel">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, URL, or method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="stopped">Stopped</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split('-');
                setSortField(field as SortField);
                setSortDirection(direction as SortDirection);
              }}
              className="form-input"
            >
              <option value="startTime-desc">Newest First</option>
              <option value="startTime-asc">Oldest First</option>
              <option value="duration-desc">Longest Duration</option>
              <option value="duration-asc">Shortest Duration</option>
              <option value="virtualUsers-desc">Most Users</option>
              <option value="totalRequests-desc">Most Requests</option>
              <option value="avgResponseTime-desc">Slowest Response</option>
              <option value="errorRate-desc">Highest Error Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredAndSortedResults.length === 0 ? (
          <div className="glass-panel text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No test results found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {results.length === 0 
                ? "Run your first load test to see results here"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <AnimatedContainer stagger staggerDelay={0.05}>
            {/* Select All */}
            <div className="glass-panel">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedResults.size === filteredAndSortedResults.length && filteredAndSortedResults.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Select all ({filteredAndSortedResults.length})
                </span>
              </label>
            </div>

            {/* Results */}
            {filteredAndSortedResults.map((result) => (
              <motion.div
                key={result.id}
                className="glass-panel hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => onResultSelect?.(result)}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectResult(result.id);
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {result.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {result.method} {result.url}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{result.startTime.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(result.duration)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{result.virtualUsers} users</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>{formatNumber(result.totalRequests)} requests</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(result.avgResponseTime)}ms
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Avg Response</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(result.requestsPerSecond)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Req/sec</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${
                          result.errorRate > 0.1 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                        }`}>
                          {(result.errorRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Error Rate</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResultExport?.(result);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Export result"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResultDelete?.(result.id);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete result"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatedContainer>
        )}
      </div>
    </div>
  );
}