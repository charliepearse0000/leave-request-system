describe('Home Page', () => {
  it('should exist', () => {
    const Home = require('./page').default
    expect(typeof Home).toBe('function')
  })

  it('should be a React component', () => {
    const Home = require('./page').default
    expect(Home.name).toBe('Home')
  })
})