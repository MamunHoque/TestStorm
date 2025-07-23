import React, { useState, useEffect } from 'react';
import { Monitor, Zap, BarChart3, Settings, Moon, Sun, Computer, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import { useUIState } from '../store';
import { ApiTestPanel } from './ApiTestPanel';
import { LoadTestPanel } from './LoadTestPanel';
import { ResultsPanel } from './ResultsPanel';
import { TabTransition, AnimatedContainer, Container } from './common';

type TabType = 'api-test' | 'load-test' | 'results';

export function Layout() {
  const { activeTab, setActiveTab } = useUIState();
  const { theme, setTheme, isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <AnimatedContainer direction="down" delay={0.1}>
        <header className="glass-panel m-2 sm:m-4 mb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </motion.div>
              <div>
                <h1 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {isMobile ? 'API Load Testing' : 'API Load Testing & Monitoring'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {isMobile ? 'Performance testing' : 'Professional-grade API performance testing'}
                </p>
              </div>
            </div>

            {/* Theme Switcher */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        theme === option.value
                          ? 'bg-white dark:bg-gray-700 shadow-sm'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      title={option.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-8'} ${isMobile ? 'overflow-x-auto' : ''}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 relative whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    } ${isMobile ? 'w-full justify-center' : ''}`}
                    whileHover={{ y: isMobile ? 0 : -2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </nav>
        </header>
      </AnimatedContainer>

      {/* Main Content */}
      <main className="p-2 sm:p-4">
        <Container size={isMobile ? 'full' : 'xl'}>
          <AnimatedContainer direction="up" delay={0.2}>
            <div className="glass-card">
              <TabTransition activeKey={activeTab}>
                {activeTab === 'api-test' && <ApiTestPanel />}

                {activeTab === 'load-test' && <LoadTestPanel />}

                {activeTab === 'results' && <ResultsPanel />}
              </TabTransition>
            </div>
          </AnimatedContainer>
        </Container>
      </main>

      {/* Footer */}
      <AnimatedContainer direction="up" delay={0.3}>
        <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          <p>API Load Testing & Monitoring SPA v1.0.0</p>
        </footer>
      </AnimatedContainer>
    </div>
  );
}