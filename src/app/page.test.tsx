import '@testing-library/jest-dom';
import Page from './page';

describe('Home Page', () => {
  it('should exist', () => {
    expect(typeof Page).toBe('function')
  })

  it('should be a React component', () => {
    expect(Page.name).toBe('Home')
  })
})
