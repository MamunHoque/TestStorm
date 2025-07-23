import type { AppPanel } from '../types/ui'
import { useTheme } from '../contexts/ThemeContext'

interface NavigationProps {
  activePanel: AppPanel
  onPanelChange: (panel: AppPanel) => void
}

const panels = [
  { id: 'api-test' as AppPanel, label: 'API Test', icon: '🔧' },
  { id: 'load-test' as AppPanel, label: 'Load Test', icon: '⚡' },
  { id: 'dashboard' as AppPanel, label: 'Dashboard', icon: '📊' },
  { id: 'history' as AppPanel, label: 'History', icon: '📋' },
]

export function Navigation({ activePanel, onPanelChange }: NavigationProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="flex items-center justify-between">
      <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
        {panels.map((panel) => (
          <button
            key={panel.id}
            onClick={() => onPanelChange(panel.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activePanel === panel.id
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <span className="text-lg">{panel.icon}</span>
            <span>{panel.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>
    </nav>
  )
}