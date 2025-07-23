import React, { useState, useEffect } from 'react';
import { TestResultsHistory } from './TestResultsHistory';
import { useResultsState } from '../../store';
import { AnimatedContainer } from '../common';

// Mock data for demonstration
const mockResults = [
  {
    id: '1',
    name: 'User API Load Test',
    url: 'https://api.example.com/users',
    method: 'GET',
    startTime: new Date('2024-01-15T10:30:00'),
    endTime: new Date('2024-01-15T10:35:00'),
    duration: 300000,
    virtualUsers: 100,
    totalRequests: 15000,
    successfulRequests: 14850,
    failedRequests: 150,
    avgResponseTime: 120,
    maxResponseTime: 450,
    requestsPerSecond: 50,
    errorRate: 0.01,
    status: 'completed' as const,
    tags: ['api', 'users', 'production'],
  },
  {
    id: '2',
    name: 'Authentication Stress Test',
    url: 'https://api.example.com/auth/login',
    method: 'POST',
    startTime: new Date('2024-01-14T15:20:00'),
    endTime: new Date('2024-01-14T15:30:00'),
    duration: 600000,
    virtualUsers: 500,
    totalRequests: 30000,
    successfulRequests: 28500,
    failedRequests: 1500,
    avgResponseTime: 250,
    maxResponseTime: 1200,
    requestsPerSecond: 50,
    errorRate: 0.05,
    status: 'completed' as const,
    tags: ['auth', 'login', 'stress'],
  },
  {
    id: '3',
    name: 'Database Performance Test',
    url: 'https://api.example.com/data/query',
    method: 'POST',
    startTime: new Date('2024-01-13T09:00:00'),
    endTime: new Date('2024-01-13T09:05:00'),
    duration: 300000,
    virtualUsers: 200,
    totalRequests: 6000,
    successfulRequests: 5400,
    failedRequests: 600,
    avgResponseTime: 800,
    maxResponseTime: 3000,
    requestsPerSecond: 20,
    errorRate: 0.1,
    status: 'failed' as const,
    tags: ['database', 'query', 'performance'],
  },
];

export function ResultsPanel() {
  const { testResults } = useResultsState();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(mockResults);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleResultSelect = (result: any) => {
    console.log('Selected result:', result);
    // TODO: Navigate to detailed result view
  };

  const handleResultDelete = (resultId: string) => {
    setResults(prev => prev.filter(r => r.id !== resultId));
    console.log('Deleted result:', resultId);
  };

  const handleResultExport = (result: any) => {
    // Export result as JSON
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-result-${result.name.replace(/\s+/g, '-').toLowerCase()}-${result.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatedContainer direction="up" delay={0.1}>
      <TestResultsHistory
        results={results}
        loading={loading}
        onResultSelect={handleResultSelect}
        onResultDelete={handleResultDelete}
        onResultExport={handleResultExport}
      />
    </AnimatedContainer>
  );
}