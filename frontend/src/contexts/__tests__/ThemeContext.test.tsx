import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

// Test component that uses the theme context
function TestComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document classes
    document.documentElement.classList.remove('dark')
  })

  it('provides default light theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('toggles theme from light to dark', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByText('Toggle Theme')
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    
    fireEvent.click(toggleButton)
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
  })

  it('toggles theme from dark to light', () => {
    // Set initial dark theme in localStorage
    localStorage.setItem('theme', 'dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByText('Toggle Theme')
    
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    
    fireEvent.click(toggleButton)
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('persists theme to localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByText('Toggle Theme')
    
    fireEvent.click(toggleButton)
    
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('applies dark class to document when theme is dark', () => {
    localStorage.setItem('theme', 'dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class from document when theme is light', () => {
    // Start with dark theme
    localStorage.setItem('theme', 'dark')
    document.documentElement.classList.add('dark')
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const toggleButton = screen.getByText('Toggle Theme')
    fireEvent.click(toggleButton)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useTheme must be used within a ThemeProvider')
    
    consoleSpy.mockRestore()
  })
})