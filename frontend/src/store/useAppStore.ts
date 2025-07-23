// Main application store using Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { ApiTestConfig, ApiTestResult } from '../types/api';
import { LoadTestConfig, LoadTestExecution } from '../types/loadTest';
import { TestResult } from '../types/results';

interface AppState {
  // API Testing State
  currentApiTest: Partial<ApiTestConfig>;
  apiTestHistory: ApiTestResult[];
  isApiTestRunning: boolean;
  
  // Load Testing State
  currentLoadTest: Partial<LoadTestConfig>;
  loadTestHistory: LoadTestExecution[];
  isLoadTestRunning: boolean;
  currentLoadTestId?: string;
  
  // Results State
  testResults: TestResult[];
  selectedResults: string[];
  
  // UI State
  activeTab: 'api-test' | 'load-test' | 'results';
  sidebarOpen: boolean;
  
  // Actions
  setCurrentApiTest: (config: Partial<ApiTestConfig>) => void;
  addApiTestResult: (result: ApiTestResult) => void;
  setApiTestRunning: (running: boolean) => void;
  clearApiTestHistory: () => void;
  
  setCurrentLoadTest: (config: Partial<LoadTestConfig>) => void;
  addLoadTestExecution: (execution: LoadTestExecution) => void;
  updateLoadTestExecution: (id: string, updates: Partial<LoadTestExecution>) => void;
  setLoadTestRunning: (running: boolean, testId?: string) => void;
  clearLoadTestHistory: () => void;
  
  addTestResult: (result: TestResult) => void;
  removeTestResult: (id: string) => void;
  toggleResultSelection: (id: string) => void;
  clearSelectedResults: () => void;
  
  setActiveTab: (tab: 'api-test' | 'load-test' | 'results') => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentApiTest: {
          url: '',
          method: 'GET',
          headers: {},
          queryParams: {},
          authentication: { type: 'none' },
          timeout: 30000,
          followRedirects: true,
          validateSSL: true,
        },
        apiTestHistory: [],
        isApiTestRunning: false,
        
        currentLoadTest: {
          name: '',
          target: {
            url: '',
            method: 'GET',
            headers: {},
          },
          load: {
            virtualUsers: 100,
            rampUpTime: 30,
            duration: 300,
          },
          authentication: { type: 'none' },
          options: {
            keepAlive: true,
            randomizedDelays: false,
            timeout: 30000,
            followRedirects: true,
            validateSSL: true,
          },
        },
        loadTestHistory: [],
        isLoadTestRunning: false,
        currentLoadTestId: undefined,
        
        testResults: [],
        selectedResults: [],
        
        activeTab: 'api-test',
        sidebarOpen: false,
        
        // API Test Actions
        setCurrentApiTest: (config) =>
          set((state) => ({
            currentApiTest: { ...state.currentApiTest, ...config },
          })),
        
        addApiTestResult: (result) =>
          set((state) => ({
            apiTestHistory: [result, ...state.apiTestHistory.slice(0, 99)], // Keep last 100
          })),
        
        setApiTestRunning: (running) =>
          set({ isApiTestRunning: running }),
        
        clearApiTestHistory: () =>
          set({ apiTestHistory: [] }),
        
        // Load Test Actions
        setCurrentLoadTest: (config) =>
          set((state) => ({
            currentLoadTest: { ...state.currentLoadTest, ...config },
          })),
        
        addLoadTestExecution: (execution) =>
          set((state) => ({
            loadTestHistory: [execution, ...state.loadTestHistory.slice(0, 49)], // Keep last 50
          })),
        
        updateLoadTestExecution: (id, updates) =>
          set((state) => ({
            loadTestHistory: state.loadTestHistory.map((execution) =>
              execution.id === id ? { ...execution, ...updates } : execution
            ),
          })),
        
        setLoadTestRunning: (running, testId) =>
          set({ 
            isLoadTestRunning: running,
            currentLoadTestId: running ? testId : undefined,
          }),
        
        clearLoadTestHistory: () =>
          set({ loadTestHistory: [] }),
        
        // Results Actions
        addTestResult: (result) =>
          set((state) => ({
            testResults: [result, ...state.testResults.slice(0, 199)], // Keep last 200
          })),
        
        removeTestResult: (id) =>
          set((state) => ({
            testResults: state.testResults.filter((result) => result.id !== id),
            selectedResults: state.selectedResults.filter((selectedId) => selectedId !== id),
          })),
        
        toggleResultSelection: (id) =>
          set((state) => ({
            selectedResults: state.selectedResults.includes(id)
              ? state.selectedResults.filter((selectedId) => selectedId !== id)
              : [...state.selectedResults, id],
          })),
        
        clearSelectedResults: () =>
          set({ selectedResults: [] }),
        
        // UI Actions
        setActiveTab: (tab) =>
          set({ activeTab: tab }),
        
        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }),
      }),
      {
        name: 'api-load-tester-store',
        partialize: (state) => ({
          // Only persist certain parts of the state
          currentApiTest: state.currentApiTest,
          currentLoadTest: state.currentLoadTest,
          apiTestHistory: state.apiTestHistory.slice(0, 20), // Persist only last 20
          loadTestHistory: state.loadTestHistory.slice(0, 10), // Persist only last 10
          testResults: state.testResults.slice(0, 50), // Persist only last 50
          activeTab: state.activeTab,
        }),
      }
    ),
    {
      name: 'api-load-tester-store',
    }
  )
);

// Selectors for better performance
export const useApiTestState = () => useAppStore((state) => ({
  currentApiTest: state.currentApiTest,
  apiTestHistory: state.apiTestHistory,
  isApiTestRunning: state.isApiTestRunning,
  setCurrentApiTest: state.setCurrentApiTest,
  addApiTestResult: state.addApiTestResult,
  setApiTestRunning: state.setApiTestRunning,
  clearApiTestHistory: state.clearApiTestHistory,
}));

export const useLoadTestState = () => useAppStore((state) => ({
  currentLoadTest: state.currentLoadTest,
  loadTestHistory: state.loadTestHistory,
  isLoadTestRunning: state.isLoadTestRunning,
  currentLoadTestId: state.currentLoadTestId,
  setCurrentLoadTest: state.setCurrentLoadTest,
  addLoadTestExecution: state.addLoadTestExecution,
  updateLoadTestExecution: state.updateLoadTestExecution,
  setLoadTestRunning: state.setLoadTestRunning,
  clearLoadTestHistory: state.clearLoadTestHistory,
}));

export const useResultsState = () => useAppStore((state) => ({
  testResults: state.testResults,
  selectedResults: state.selectedResults,
  addTestResult: state.addTestResult,
  removeTestResult: state.removeTestResult,
  toggleResultSelection: state.toggleResultSelection,
  clearSelectedResults: state.clearSelectedResults,
}));

export const useUIState = () => useAppStore((state) => ({
  activeTab: state.activeTab,
  sidebarOpen: state.sidebarOpen,
  setActiveTab: state.setActiveTab,
  setSidebarOpen: state.setSidebarOpen,
}));