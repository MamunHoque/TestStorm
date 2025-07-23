import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navigation } from './components/Navigation';
import { ApiTestPanel } from './components/ApiTestPanel';
import { LoadTestPanel } from './components/LoadTestPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { HistoryPanel } from './components/HistoryPanel';
import type { AppPanel } from './types/ui';
import './App.css';

function AppContent() {
  const [activePanel, setActivePanel] = useState<AppPanel>('api-test');

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'api-test':
        return <ApiTestPanel />;
      case 'load-test':
        return <LoadTestPanel />;
      case 'dashboard':
        return <DashboardPanel />;
      case 'history':
        return <HistoryPanel />;
      default:
        return <ApiTestPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                API Load Testing & Monitoring
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Test REST and GraphQL APIs for functional correctness and performance under load
              </p>
            </div>
          </div>
          
          {/* Navigation */}
          <Navigation 
            activePanel={activePanel} 
            onPanelChange={setActivePanel} 
          />
        </header>

        {/* Main Content */}
        <main className="pb-8">
          <div className="transition-all duration-200 ease-in-out">
            {renderActivePanel()}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-700 py-6 mt-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Built with React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
