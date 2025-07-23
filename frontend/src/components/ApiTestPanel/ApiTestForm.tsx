// API Test Form Component
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Play, Loader2, Plus, Trash2 } from 'lucide-react';
import { ApiTestConfig } from '../../types/api';
import { HTTP_METHODS, AUTH_TYPES } from '../../utils/constants';
import { useApiTestState } from '../../store';

// Validation schema
const apiTestSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  body: z.string().optional(),
  authentication: z.object({
    type: z.enum(['none', 'bearer', 'apikey', 'basic']),
    token: z.string().optional(),
    apiKey: z.string().optional(),
    apiKeyHeader: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  timeout: z.number().min(1000).max(300000).default(30000),
  followRedirects: z.boolean().default(true),
  validateSSL: z.boolean().default(true),
});

type ApiTestFormData = z.infer<typeof apiTestSchema>;

interface ApiTestFormProps {
  onSubmit: (config: ApiTestConfig) => void;
  isLoading: boolean;
}

export function ApiTestForm({ onSubmit, isLoading }: ApiTestFormProps) {
  const { currentApiTest, setCurrentApiTest } = useApiTestState();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ApiTestFormData>({
    resolver: zodResolver(apiTestSchema),
    defaultValues: currentApiTest as ApiTestFormData,
    mode: 'onChange',
  });

  const watchedValues = watch();
  const authType = watch('authentication.type');
  const method = watch('method');

  // Update store when form values change
  useEffect(() => {
    setCurrentApiTest(watchedValues);
  }, [watchedValues, setCurrentApiTest]);

  const onFormSubmit = (data: ApiTestFormData) => {
    onSubmit(data as ApiTestConfig);
  };

  // Add header row
  const addHeader = () => {
    const headers = watchedValues.headers || {};
    const newKey = `header_${Object.keys(headers).length + 1}`;
    setValue('headers', { ...headers, [newKey]: '' });
  };

  // Remove header row
  const removeHeader = (key: string) => {
    const headers = { ...watchedValues.headers };
    delete headers[key];
    setValue('headers', headers);
  };

  // Add query parameter row
  const addQueryParam = () => {
    const queryParams = watchedValues.queryParams || {};
    const newKey = `param_${Object.keys(queryParams).length + 1}`;
    setValue('queryParams', { ...queryParams, [newKey]: '' });
  };

  // Remove query parameter row
  const removeQueryParam = (key: string) => {
    const queryParams = { ...watchedValues.queryParams };
    delete queryParams[key];
    setValue('queryParams', queryParams);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* URL and Method */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="form-label">URL *</label>
          <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="url"
                placeholder="https://api.example.com/users"
                className={`form-input ${errors.url ? 'border-red-500' : ''}`}
              />
            )}
          />
          {errors.url && (
            <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label className="form-label">Method *</label>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <select {...field} className="form-input">
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
                <select {...field} className="form-input">
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
                    />
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Headers */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Headers
          </h3>
          <button
            type="button"
            onClick={addHeader}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Header</span>
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(watchedValues.headers || {}).map(([key, value]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Header name"
                value={key}
                onChange={(e) => {
                  const headers = { ...watchedValues.headers };
                  delete headers[key];
                  headers[e.target.value] = value;
                  setValue('headers', headers);
                }}
                className="form-input"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Header value"
                  value={value}
                  onChange={(e) => {
                    setValue(`headers.${key}`, e.target.value);
                  }}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeHeader(key)}
                  className="btn-secondary p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {Object.keys(watchedValues.headers || {}).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No headers added. Click "Add Header" to add custom headers.
            </p>
          )}
        </div>
      </div>

      {/* Query Parameters */}
      <div className="glass-panel">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Query Parameters
          </h3>
          <button
            type="button"
            onClick={addQueryParam}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Parameter</span>
          </button>
        </div>

        <div className="space-y-3">
          {Object.entries(watchedValues.queryParams || {}).map(([key, value]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Parameter name"
                value={key}
                onChange={(e) => {
                  const queryParams = { ...watchedValues.queryParams };
                  delete queryParams[key];
                  queryParams[e.target.value] = value;
                  setValue('queryParams', queryParams);
                }}
                className="form-input"
              />
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Parameter value"
                  value={value}
                  onChange={(e) => {
                    setValue(`queryParams.${key}`, e.target.value);
                  }}
                  className="form-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeQueryParam(key)}
                  className="btn-secondary p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {Object.keys(watchedValues.queryParams || {}).length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No query parameters added. Click "Add Parameter" to add parameters.
            </p>
          )}
        </div>
      </div>

      {/* Request Body */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div className="glass-panel">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Request Body
          </h3>
          <Controller
            name="body"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={8}
                placeholder='{"key": "value"}'
                className="form-input font-mono text-sm"
              />
            )}
          />
        </div>
      )}

      {/* Options */}
      <div className="glass-panel">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Options
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="form-label">Timeout (ms)</label>
            <Controller
              name="timeout"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  min="1000"
                  max="300000"
                  className="form-input"
                />
              )}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="followRedirects"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={field.value}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              )}
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Follow Redirects
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="validateSSL"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="checkbox"
                  checked={field.value}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              )}
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Validate SSL
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="btn-primary flex items-center space-x-2 min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Testing...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Send Request</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}