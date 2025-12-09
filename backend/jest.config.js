module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/prisma/**',
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};
