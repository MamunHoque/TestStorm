// API Test Panel Main Component
import React, { useState } from 'react';
import { ApiTestForm } from './ApiTestForm';
import { ResponseViewer } from './ResponseViewer';
import { ApiTestConfig, ApiTestResult } from '../../types/api';
import { useApiTestState } from '../../store';
import { ApiService } from '../../services';
import { LoadingSpinner } from '../common/LoadingSpinner';

export function ApiTestPanel() {
  const { addApiTestResult, setApiTestRunning, isApiTestRunning } = useApiTestState();
  const [currentResult, setCurrentResult] = useState<ApiTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (config: ApiTestConfig) => {
    setError(null);
    setApiTestRunning(true);

    try {
      const result = await ApiService.executeApiTest(config);
      setCurrentResult(result);
      addApiTestResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to execute API test');
      console.error('API test failed:', err);
    } finally {
      setApiTestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            API Test Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Test individual API endpoints for functional correctness
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Test Failed
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600 dark:hover:text-red-200"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <div className="space-y-6">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Request Configuration
              </h2>
              {isApiTestRunning && (
                <LoadingSpinner size="sm" text="Sending request..." />
              )}
            </div>
            <ApiTestForm onSubmit={handleSubmit} isLoading={isApiTestRunning} />
          </div>
        </div>

        {/* Response Viewer */}
        <div className="space-y-6">
          <div className="glass-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Response
              </h2>
              {currentResult && (
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Executed at: {new Date(currentResult.created_at).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
            <ResponseViewer result={currentResult} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              // TODO: Load example GET request
            }}
            className="btn-secondary text-left p-4"
          >
            <div className="font-medium">Example GET Request</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Load a sample GET request to test
            </div>
          </button>

          <button
            onClick={() => {
              // TODO: Load example POST request
            }}
            className="btn-secondary text-left p-4"
          >
            <div className="font-medium">Example POST Request</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Load a sample POST request with JSON body
            </div>
          </button>

          <button
            onClick={() => {
              // TODO: Clear form
            }}
            className="btn-secondary text-left p-4"
          >
            <div className="font-medium">Clear Form</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Reset all fields to default values
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}