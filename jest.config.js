export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    // Mock env.ts to avoid import.meta issues in tests (must be first, catches all imports)
    '.*/config/env$': '<rootDir>/src/tests/mocks/envMock.ts',
    // Regular path aliases
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/tests/mocks/fileMock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
