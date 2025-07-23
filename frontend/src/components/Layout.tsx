import React from 'react';
import { Monitor, Zap, BarChart3, Settings, Moon, Sun, Computer } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useUIState } from '../store';
import { ApiTestPanel } from './ApiTestPanel';
import { LoadTestPanel } from './LoadTestPanel';

type TabType = 'api-test' | 'load-test' | 'results';

export function Layout() {
  const { activeTab, setActiveTab } = useUIState();
  const { theme, setTheme, isDark } = useTheme();

  const tabs = [
    { id: 'api-test' as TabType, label: 'API Test', icon: Monitor },
    { id: 'load-test' as TabType, label: 'Load Test', icon: Zap },
    { id: 'results' as TabType, label: 'Results & History', icon: BarChart3 },
  ];

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Computer, label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="glass-panel m-4 mb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                API Load Testing & Monitoring
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional-grade API performance testing
              </p>
            </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center space-x-2">
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      theme === option.value
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={option.label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="mt-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="glass-card">
          {activeTab === 'api-test' && <ApiTestPanel />}

          {activeTab === 'load-test' && <LoadTestPanel />}

          {activeTab === 'results' && (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Results & History
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                View test results, export reports, and analyze performance trends
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Coming soon in Task 18...
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>API Load Testing & Monitoring SPA v1.0.0</p>
      </footer>
    </div>
  );
}