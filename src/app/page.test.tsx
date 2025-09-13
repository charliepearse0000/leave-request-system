import { render, screen } from '@testing-library/react'
import Home from './page'

describe('Home Page', () => {
  it('renders the Next.js logo', () => {
    render(<Home />)
    
    const logo = screen.getByAltText('Next.js logo')
    expect(logo).toBeInTheDocument()
  })

  it('renders the getting started text', () => {
    render(<Home />)
    
    const gettingStartedText = screen.getByText(/Get started by editing/i)
    expect(gettingStartedText).toBeInTheDocument()
  })

  it('renders the deploy now link', () => {
    render(<Home />)
    
    const deployLink = screen.getByRole('link', { name: /deploy now/i })
    expect(deployLink).toBeInTheDocument()
    expect(deployLink).toHaveAttribute('href', expect.stringContaining('vercel.com'))
  })

  it('renders the read docs link', () => {
    render(<Home />)
    
    const docsLink = screen.getByRole('link', { name: /read our docs/i })
    expect(docsLink).toBeInTheDocument()
    expect(docsLink).toHaveAttribute('href', expect.stringContaining('nextjs.org'))
  })
})