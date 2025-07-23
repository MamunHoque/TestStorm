// Response Viewer Component
import React, { useState } from 'react';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { ApiTestResult } from '../../types/api';
import { formatResponseTime, formatBytes, formatStatusCode } from '../../utils/formatters';

interface ResponseViewerProps {
  result: ApiTestResult | null;
}

export function ResponseViewer({ result }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'metrics'>('body');
  const [showRawJson, setShowRawJson] = useState(false);

  if (!result) {
    return (
      <div className="glass-panel h-96 flex items-center justify-center">
        <div className="text-center">
          <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Response Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Send a request to see the response here
          </p>
        </div>
      </div>
    );
  }

  const { response, metrics, status, error } = result;
  const statusInfo = formatStatusCode(response.statusCode);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Add toast notification
  };

  const downloadResponse = () => {
    const blob = new Blob([JSON.stringify(response.body, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatJsonBody = (body: any) => {
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  };

  const isJsonResponse = () => {
    const contentType = response.headers['content-type'] || '';
    return contentType.includes('application/json');
  };

  return (
    <div className="glass-panel">
      {/* Response Status */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <span className={`font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Time:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatResponseTime(response.responseTime)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Size:
            </span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatBytes(response.size)}
            </span>
          </div>

          {status === 'error' && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-red-600">Error:</span>
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {isJsonResponse() && (
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="btn-secondary flex items-center space-x-2"
            >
              {showRawJson ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showRawJson ? 'Pretty' : 'Raw'}</span>
            </button>
          )}

          <button
            onClick={() => copyToClipboard(formatJsonBody(response.body))}
            className="btn-secondary flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </button>

          <button
            onClick={downloadResponse}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Response Tabs */}
      <div className="flex space-x-1 mb-4">
        {['body', 'headers', 'metrics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Response Content */}
      <div className="min-h-[300px]">
        {activeTab === 'body' && (
          <div className="space-y-4">
            {isJsonResponse() && !showRawJson ? (
              <JsonViewer data={response.body} />
            ) : (
              <pre className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-auto text-sm font-mono max-h-96 scrollbar-thin">
                {formatJsonBody(response.body)}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'headers' && (
          <div className="space-y-2">
            {Object.entries(response.headers).map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 border-b border-gray-100 dark:border-gray-700"
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {key}
                </div>
                <div className="md:col-span-2 text-gray-600 dark:text-gray-400 font-mono text-sm break-all">
                  {value}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Timing Breakdown
              </h4>
              <div className="space-y-2">
                <MetricRow label="DNS Lookup" value={formatResponseTime(metrics.dnsLookup)} />
                <MetricRow label="TCP Connection" value={formatResponseTime(metrics.tcpConnection)} />
                <MetricRow label="TLS Handshake" value={formatResponseTime(metrics.tlsHandshake)} />
                <MetricRow label="First Byte" value={formatResponseTime(metrics.firstByte)} />
                <MetricRow label="Content Transfer" value={formatResponseTime(metrics.contentTransfer)} />
                <MetricRow label="Total Time" value={formatResponseTime(metrics.totalTime)} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Response Details
              </h4>
              <div className="space-y-2">
                <MetricRow label="Status Code" value={response.statusCode.toString()} />
                <MetricRow label="Status Text" value={response.statusText} />
                <MetricRow label="Response Time" value={formatResponseTime(response.responseTime)} />
                <MetricRow label="Response Size" value={formatBytes(response.size)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// JSON Viewer Component
function JsonViewer({ data }: { data: any }) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const renderValue = (value: any, key: string, depth: number = 0): React.ReactNode => {
    const indent = '  '.repeat(depth);

    if (value === null) {
      return <span className="text-gray-500">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-600 dark:text-blue-400">{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-green-600 dark:text-green-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-red-600 dark:text-red-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div>
          <button
            onClick={() => toggleExpanded(key)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isExpanded ? '▼' : '▶'} [{value.length}]
          </button>
          {isExpanded && (
            <div className="ml-4">
              {value.map((item, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-600 dark:text-gray-400">{index}: </span>
                  {renderValue(item, `${key}.${index}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const isExpanded = expandedKeys.has(key);
      const keys = Object.keys(value);
      return (
        <div>
          <button
            onClick={() => toggleExpanded(key)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            {isExpanded ? '▼' : '▶'} {`{${keys.length}}`}
          </button>
          {isExpanded && (
            <div className="ml-4">
              {keys.map((objKey) => (
                <div key={objKey} className="py-1">
                  <span className="text-purple-600 dark:text-purple-400">"{objKey}"</span>
                  <span className="text-gray-600 dark:text-gray-400">: </span>
                  {renderValue(value[objKey], `${key}.${objKey}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm max-h-96 overflow-auto scrollbar-thin">
      {renderValue(data, 'root')}
    </div>
  );
}

// Metric Row Component
function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span className="font-mono text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}