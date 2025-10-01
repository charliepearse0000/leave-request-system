import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/global-setup.ts',
  globalTeardown: '<rootDir>/tests/global-teardown.ts',


  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/controllers/*.ts",
    "src/routes/*.ts",
    "src/services/*.ts",
    "src/models/*.ts",
    "src/config/*.ts",
    "src/middlewares/*.ts",
  ],
  coverageThreshold: {
    global: {
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;