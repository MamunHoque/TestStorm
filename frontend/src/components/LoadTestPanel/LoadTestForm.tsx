// Load Test Form Component
import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Square, RotateCcw, Info, Code, Plus, Trash2 } from 'lucide-react';
import { LoadTestConfig } from '../../types/loadTest';
import { HTTP_METHODS, AUTH_TYPES, LOAD_TEST_PRESETS } from '../../utils/constants';
import { useLoadTestState } from '../../store';
import { Slider } from '../common';

// Validation schema
const loadTestSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(100, 'Test name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  target: z.object({
    url: z.string().url('Please enter a valid URL'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
    headers: z.record(z.string()).default({}),
    body: z.string().optional(),
    graphql: z.object({
      enabled: z.boolean().default(false),
      query: z.string().optional(),
      variables: z.record(z.any()).optional(),
    }).optional(),
  }),
  load: z.object({
    virtualUsers: z.number().min(1, 'At least 1 user required').max(10000, 'Max 10,000 users'),
    rampUpTime: z.number().min(0, 'Cannot be negative').max(300, 'Max 300 seconds'),
    duration: z.number().min(1, 'Min 1 second').max(3600, 'Max 3600 seconds'),
    requestRate: z.number().positive().optional(),
  }),
  authentication: z.object({
    type: z.enum(['none', 'bearer', 'apikey', 'basic']),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  options: z.object({
    keepAlive: z.boolean().default(true),
    randomizedDelays: z.boolean().default(false),
    timeout: z.number().min(1000).max(300000).default(30000),
    followRedirects: z.boolean().default(true),
    validateSSL: z.boolean().default(true),
  }),
});

type LoadTestFormData = z.infer<typeof loadTestSchema>;

interface LoadTestFormProps {
  onSubmit: (config: LoadTestConfig) => void;
  onStop: () => void;
  isRunning: boolean;
  isLoading: boolean;
}

export function LoadTestForm({ onSubmit, onStop, isRunning, isLoading }: LoadTestFormProps) {
  const { currentLoadTest, setCurrentLoadTest } = useLoadTestState();
  const [showGraphQL, setShowGraphQL] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<LoadTestFormData>({
    resolver: zodResolver(loadTestSchema),
    defaultValues: currentLoadTest as LoadTestFormData,
    mode: 'onChange',
  });

  const watchedValues = watch();
  const authType = watch('authentication.type');
  const method = watch('target.method');
  const virtualUsers = watch('load.virtualUsers');
  const duration = watch('load.duration');

  // Update store when form values change
  useEffect(() => {
    setCurrentLoadTest(watchedValues);
  }, [watchedValues, setCurrentLoadTest]);

  // Calculate estimated requests per second
  const estimatedRPS = Math.ceil(virtualUsers / 10);

  const onFormSubmit = (data: LoadTestFormData) => {
    onSubmit(data as LoadTestConfig);
  };

  // Load preset configuration
  const loadPreset = (presetName: string) => {
    const preset = LOAD_TEST_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setValue('load.virtualUsers', preset.virtualUsers);
      setValue('load.rampUpTime', preset.rampUpTime);
      setValue('load.duration', preset.duration);
    }
  };

  // Reset form to defaults
  const resetForm = () => {
    reset({
      name: '',
      description: '',
      target: {
        url: '',
        method: 'GET',
        headers: {},
        body: '',
      },
      load: {
        virtualUsers: 100,
        rampUpTime: 30,
        duration: 300,
      },
      authentication: {
        type: 'none',
      },
      options: {
        keepAlive: true,
        randomizedDelays: false,
        timeout: 30000,
        followRedirects: true,
        validateSSL: true,
      },
    });
  };

  // Add header row
  const addHeader = () => {
    const headers = watchedValues.target.headers || {};
    const newKey = `header_${Object.keys(headers).length + 1}`;
    setValue('target.headers', { ...headers, [newKey]: '' });
  };

  // Remove header row
  const removeHeader = (key: string) => {
    const headers = { ...watchedValues.target.headers };
    delete headers[key];
    setValue('target.headers', headers);
  };

  return (
    <div className="space-y-6">
      {/* Header with Info */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Load Test Panel
            </h2>
            <div className="group relative">
              <Info className="w-5 h-5 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                Configure and run load tests with up to 10,000 virtual users
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Est. {estimatedRPS} req/sec
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Quick presets:
          </span>
          {LOAD_TEST_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => loadPreset(preset.name)}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              disabled={isRunning}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Test Configuration */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Test Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Test Name *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="My Load Test"
                    className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                    disabled={isRunning}
                  />
                )}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    placeholder="Optional description"
                    className="form-input"
                    disabled={isRunning}
                  />
                )}
              />
            </div>
          </div>
        </div>

        {/* Target Configuration */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Target API
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-3">
              <label className="form-label">URL *</label>
              <Controller
                name="target.url"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="url"
                    placeholder="https://api.example.com/users"
                    className={`form-input ${errors.target?.url ? 'border-red-500' : ''}`}
                    disabled={isRunning}
                  />
                )}
              />
              {errors.target?.url && (
                <p className="text-red-500 text-sm mt-1">{errors.target.url.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Method *</label>
              <Controller
                name="target.method"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-input" disabled={isRunning}>
                    {HTTP_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>

          {/* GraphQL Toggle */}
          <div className="flex items-center space-x-3 mb-4">
            <button
              type="button"
              onClick={() => setShowGraphQL(!showGraphQL)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                showGraphQL
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              disabled={isRunning}
            >
              <Code className="w-4 h-4" />
              <span>GraphQL Query</span>
            </button>
            {showGraphQL && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Enable GraphQL query editor
              </span>
            )}
          </div>

          {/* GraphQL Editor */}
          {showGraphQL && (
            <div className="mb-4">
              <label className="form-label">GraphQL Query</label>
              <Controller
                name="target.graphql.query"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={6}
                    placeholder={`query GetUsers {
  users {
    id
    name
    email
  }
}`}
                    className="form-input font-mono text-sm"
                    disabled={isRunning}
                  />
                )}
              />
            </div>
          )}

          {/* Request Body for POST/PUT/PATCH */}
          {['POST', 'PUT', 'PATCH'].includes(method) && !showGraphQL && (
            <div className="mb-4">
              <label className="form-label">Request Body</label>
              <Controller
                name="target.body"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={6}
                    placeholder='{"key": "value"}'
                    className="form-input font-mono text-sm"
                    disabled={isRunning}
                  />
                )}
              />
            </div>
          )}

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="form-label">Headers</label>
              <button
                type="button"
                onClick={addHeader}
                className="btn-secondary flex items-center space-x-2 text-sm"
                disabled={isRunning}
              >
                <Plus className="w-4 h-4" />
                <span>Add Header</span>
              </button>
            </div>

            <div className="space-y-2">
              {Object.entries(watchedValues.target.headers || {}).map(([key, value]) => (
                <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Header name"
                    value={key}
                    onChange={(e) => {
                      const headers = { ...watchedValues.target.headers };
                      delete headers[key];
                      headers[e.target.value] = value;
                      setValue('target.headers', headers);
                    }}
                    className="form-input text-sm"
                    disabled={isRunning}
                  />
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Header value"
                      value={value}
                      onChange={(e) => {
                        setValue(`target.headers.${key}`, e.target.value);
                      }}
                      className="form-input text-sm flex-1"
                      disabled={isRunning}
                    />
                    <button
                      type="button"
                      onClick={() => removeHeader(key)}
                      className="btn-secondary p-2"
                      disabled={isRunning}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {Object.keys(watchedValues.target.headers || {}).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No custom headers. Click "Add Header" to add headers.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Load Configuration */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Load Configuration
          </h3>

          <div className="space-y-6">
            {/* Virtual Users Slider */}
            <Controller
              name="load.virtualUsers"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Virtual Users"
                  value={field.value}
                  min={1}
                  max={10000}
                  step={1}
                  unit=""
                  disabled={isRunning}
                  onChange={field.onChange}
                  description="Number of concurrent virtual users to simulate"
                  formatValue={(value) => `${value.toLocaleString()} users`}
                />
              )}
            />
            {errors.load?.virtualUsers && (
              <p className="text-red-500 text-sm mt-1">{errors.load.virtualUsers.message}</p>
            )}

            {/* Ramp-up Time Slider */}
            <Controller
              name="load.rampUpTime"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Ramp-up Time"
                  value={field.value}
                  min={0}
                  max={300}
                  step={5}
                  unit="s"
                  disabled={isRunning}
                  onChange={field.onChange}
                  description="Time to gradually increase users from 0 to target"
                  formatValue={(value) => value === 0 ? 'Instant' : `${value}s`}
                />
              )}
            />
            {errors.load?.rampUpTime && (
              <p className="text-red-500 text-sm mt-1">{errors.load.rampUpTime.message}</p>
            )}

            {/* Duration Slider */}
            <Controller
              name="load.duration"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Test Duration"
                  value={field.value}
                  min={1}
                  max={3600}
                  step={1}
                  unit=""
                  disabled={isRunning}
                  onChange={field.onChange}
                  description="Total time to run the load test"
                  formatValue={(value) => {
                    const minutes = Math.floor(value / 60);
                    const seconds = value % 60;
                    if (minutes === 0) return `${seconds}s`;
                    if (seconds === 0) return `${minutes}m`;
                    return `${minutes}m ${seconds}s`;
                  }}
                />
              )}
            />
            {errors.load?.duration && (
              <p className="text-red-500 text-sm mt-1">{errors.load.duration.message}</p>
            )}

            {/* Request Rate Slider (Optional) */}
            <Controller
              name="load.requestRate"
              control={control}
              render={({ field }) => (
                <Slider
                  label="Request Rate (Optional)"
                  value={field.value || estimatedRPS}
                  min={1}
                  max={1000}
                  step={1}
                  unit=" req/s"
                  disabled={isRunning}
                  onChange={(value) => field.onChange(value)}
                  description="Requests per second per virtual user (leave empty for auto)"
                  formatValue={(value) => `${value} req/s`}
                />
              )}
            />
          </div>

          {/* Advanced Options */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              Advanced Options
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keep-Alive Connections */}
              <div className="flex items-center space-x-3">
                <Controller
                  name="options.keepAlive"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isRunning}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  )}
                />
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Keep-Alive Connections
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Reuse HTTP connections for better performance
                  </p>
                </div>
              </div>

              {/* Randomized Delays */}
              <div className="flex items-center space-x-3">
                <Controller
                  name="options.randomizedDelays"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isRunning}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                  )}
                />
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Randomized Delays
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add random delays between requests for realistic simulation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Authentication
          </h3>

          <div className="space-y-4">
            <div>
              <label className="form-label">Type</label>
              <Controller
                name="authentication.type"
                control={control}
                render={({ field }) => (
                  <select {...field} className="form-input" disabled={isRunning}>
                    {AUTH_TYPES.map((auth) => (
                      <option key={auth.value} value={auth.value}>
                        {auth.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {authType === 'bearer' && (
              <div>
                <label className="form-label">Bearer Token *</label>
                <Controller
                  name="authentication.token"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="password"
                      placeholder="Enter bearer token"
                      className="form-input"
                      disabled={isRunning}
                    />
                  )}
                />
              </div>
            )}

            {authType === 'apikey' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">API Key *</label>
                  <Controller
                    name="authentication.apiKey"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="password"
                        placeholder="Enter API key"
                        className="form-input"
                        disabled={isRunning}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="form-label">Header Name *</label>
                  <Controller
                    name="authentication.apiKeyHeader"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="X-API-Key"
                        className="form-input"
                        disabled={isRunning}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {authType === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Username *</label>
                  <Controller
                    name="authentication.username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter username"
                        className="form-input"
                        disabled={isRunning}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="form-label">Password *</label>
                  <Controller
                    name="authentication.password"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="password"
                        placeholder="Enter password"
                        className="form-input"
                        disabled={isRunning}
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Timeout (ms)</label>
              <Controller
                name="options.timeout"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1000"
                    max="300000"
                    className="form-input"
                    disabled={isRunning}
                  />
                )}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="options.keepAlive"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isRunning}
                  />
                )}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Keep-alive Connections
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="options.randomizedDelays"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isRunning}
                  />
                )}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Randomized User Delays
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="options.followRedirects"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isRunning}
                  />
                )}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Follow Redirects
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="options.validateSSL"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="checkbox"
                    checked={field.value}
                    className="w-4 h-4 text-blue-600 rounded"
                    disabled={isRunning}
                  />
                )}
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Validate SSL
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary flex items-center space-x-2"
            disabled={isRunning}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <div className="flex space-x-3">
            {isRunning && (
              <button
                type="button"
                onClick={onStop}
                className="btn-danger flex items-center space-x-2"
                disabled={isLoading}
              >
                <Square className="w-4 h-4" />
                <span>Stop Test</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!isValid || isRunning || isLoading}
              className="btn-primary flex items-center space-x-2 min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <div className="loading-ring" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Start Test</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}