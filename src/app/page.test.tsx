describe('Home Page', () => {
  it('should exist', () => {
    // Simple test to verify the module can be imported
    const Home = require('./page').default
    expect(typeof Home).toBe('function')
  })

  it('should be a React component', () => {
    // Test that it's a valid React component
    const Home = require('./page').default
    expect(Home.name).toBe('Home')
  })
})