import { render, screen, fireEvent } from '@testing-library/react'
import { Navigation } from '../Navigation'
import { ThemeProvider } from '../../contexts/ThemeContext'
import { AppPanel } from '../../types/ui'

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  )
}

describe('Navigation', () => {
  const mockOnPanelChange = jest.fn()

  beforeEach(() => {
    mockOnPanelChange.mockClear()
  })

  it('renders all navigation panels', () => {
    renderWithTheme(
      <Navigation activePanel="api-test" onPanelChange={mockOnPanelChange} />
    )

    expect(screen.getByText('API Test')).toBeInTheDocument()
    expect(screen.getByText('Load Test')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })

  it('highlights the active panel', () => {
    renderWithTheme(
      <Navigation activePanel="load-test" onPanelChange={mockOnPanelChange} />
    )

    const loadTestButton = screen.getByText('Load Test').closest('button')
    const apiTestButton = screen.getByText('API Test').closest('button')

    expect(loadTestButton).toHaveClass('bg-white', 'text-blue-600')
    expect(apiTestButton).not.toHaveClass('bg-white', 'text-blue-600')
  })

  it('calls onPanelChange when a panel is clicked', () => {
    renderWithTheme(
      <Navigation activePanel="api-test" onPanelChange={mockOnPanelChange} />
    )

    fireEvent.click(screen.getByText('Dashboard'))

    expect(mockOnPanelChange).toHaveBeenCalledWith('dashboard')
  })

  it('renders theme toggle button', () => {
    renderWithTheme(
      <Navigation activePanel="api-test" onPanelChange={mockOnPanelChange} />
    )

    const themeButton = screen.getByRole('button', { name: /switch to/i })
    expect(themeButton).toBeInTheDocument()
  })

  it('toggles theme when theme button is clicked', () => {
    renderWithTheme(
      <Navigation activePanel="api-test" onPanelChange={mockOnPanelChange} />
    )

    const themeButton = screen.getByRole('button', { name: /switch to/i })
    
    // Initial state should show moon (light mode)
    expect(themeButton).toHaveTextContent('🌙')
    
    fireEvent.click(themeButton)
    
    // After click should show sun (dark mode)
    expect(themeButton).toHaveTextContent('☀️')
  })
})