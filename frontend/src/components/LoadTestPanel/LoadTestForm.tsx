import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Square, Globe, Clock, Users, Settings, Code } from 'lucide-react';
import { LoadTestConfig } from '../../types/loadTest';

// Form validation schema
const loadTestSchema = z.object({
  name: z.string().min(1, 'Test name is required'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.string().optional(),
  body: z.string().optional(),
  virtualUsers: z.number().min(1).max(10000),
  rampUpTime: z.number().min(0).max(300),
  duration: z.number().min(1).max(3600),
  timeout: z.number().min(1000).max(60000),
  keepAlive: z.boolean(),
  followRedirects: z.boolean(),
  validateSSL: z.boolean(),
});

type FormData = z.infer<typeof loadTestSchema>;

interface LoadTestFormProps {
  onSubmit: (config: LoadTestConfig) => void;
  onStop: () => void;
  isRunning: boolean;
  isLoading: boolean;
}

export function LoadTestForm({ onSubmit, onStop, isRunning, isLoading }: LoadTestFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGraphQLMode, setIsGraphQLMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(loadTestSchema),
    defaultValues: {
      name: 'Load Test',
      method: 'GET',
      virtualUsers: 100,
      rampUpTime: 30,
      duration: 300,
      timeout: 30000,
      keepAlive: true,
      followRedirects: true,
      validateSSL: true,
    },
  });

  const method = watch('method');

  const handleFormSubmit = (data: FormData) => {
    // Parse headers
    let headers: Record<string, string> = {};
    if (data.headers) {
      try {
        headers = JSON.parse(data.headers);
      } catch {
        // If JSON parsing fails, treat as simple key:value pairs
        const lines = data.headers.split('\n');
        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            headers[key.trim()] = valueParts.join(':').trim();
          }
        });
      }
    }

    const config: LoadTestConfig = {
      name: data.name,
      description: data.description,
      target: {
        url: data.url,
        method: data.method,
        headers,
        body: data.body,
        graphql: isGraphQLMode ? {
          enabled: true,
          query: data.body || '',
          variables: {},
        } : undefined,
      },
      load: {
        virtualUsers: data.virtualUsers,
        rampUpTime: data.rampUpTime,
        duration: data.duration,
      },
      authentication: {
        type: 'none',
      },
      options: {
        keepAlive: data.keepAlive,
        randomizedDelays: false,
        timeout: data.timeout,
        followRedirects: data.followRedirects,
        validateSSL: data.validateSSL,
      },
    };

    onSubmit(config);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Configuration */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Test Name
          </label>
          <input
            {...register('name')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="My Load Test"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description (Optional)
          </label>
          <input
            {...register('description')}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Test description..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Target URL
            </label>
            <input
              {...register('url')}
              type="url"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="https://api.example.com/endpoint"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Method
            </label>
            <select
              {...register('method')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Load Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Load Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Virtual Users (1-10,000)
            </label>
            <input
              {...register('virtualUsers', { valueAsNumber: true })}
              type="number"
              min="1"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.virtualUsers && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.virtualUsers.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ramp-up Time (seconds)
            </label>
            <input
              {...register('rampUpTime', { valueAsNumber: true })}
              type="number"
              min="0"
              max="300"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.rampUpTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.rampUpTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration (seconds)
            </label>
            <input
              {...register('duration', { valueAsNumber: true })}
              type="number"
              min="1"
              max="3600"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Request Body (for POST/PUT/PATCH) */}
      {(method === 'POST' || method === 'PUT' || method === 'PATCH') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Request Body
            </label>
            <button
              type="button"
              onClick={() => setIsGraphQLMode(!isGraphQLMode)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs rounded ${
                isGraphQLMode
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>GraphQL</span>
            </button>
          </div>
          <textarea
            {...register('body')}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
            placeholder={isGraphQLMode 
              ? 'query { users { id name email } }'
              : '{"key": "value"}'
            }
          />
        </div>
      )}

      {/* Advanced Options */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          <Settings className="w-4 h-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Headers (JSON or key:value per line)
              </label>
              <textarea
                {...register('headers')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                placeholder='{"Authorization": "Bearer token"} or Authorization: Bearer token'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout (milliseconds)
              </label>
              <input
                {...register('timeout', { valueAsNumber: true })}
                type="number"
                min="1000"
                max="60000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  {...register('keepAlive')}
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Keep-Alive</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  {...register('followRedirects')}
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Follow Redirects</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  {...register('validateSSL')}
                  type="checkbox"
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Validate SSL</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {!isRunning ? (
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5" />
            <span>{isLoading ? 'Starting...' : 'Start Load Test'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            disabled={isLoading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Square className="w-5 h-5" />
            <span>{isLoading ? 'Stopping...' : 'Stop Test'}</span>
          </button>
        )}
      </div>
    </form>
  );
}