# Testing Guide

This document outlines the testing setup and guidelines for the Spred Mobile App.

## Testing Framework

The app uses **Jest** and **React Native Testing Library** for unit and integration testing.

### Key Dependencies
- `jest`: JavaScript testing framework
- `@testing-library/react-native`: React Native testing utilities
- `@testing-library/jest-native`: Additional Jest matchers for React Native

## Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: jsdom for React Native compatibility
- **Coverage Threshold**: 70% for branches, functions, lines, and statements
- **Module Name Mapping**: Supports `@/*` and `types/*` path aliases
- **Transform Ignore Patterns**: Configured for React Native modules

### Test Setup (`jest.setup.js`)
Includes mocks for:
- React Native modules (AsyncStorage, Video, MMKV, etc.)
- Navigation libraries
- Vector icons
- File system operations
- Image picker
- External libraries

## Running Tests

```bash
# Run all tests
npm test
# or
yarn test

# Run tests with coverage
npm run test:coverage
# or
yarn test:coverage

# Run tests in watch mode
npm run test:watch
# or
yarn test:watch

# Run specific test file
npm test -- CustomText.test.tsx
```

## Test Structure

### Test File Locations
- Component tests: `src/components/ComponentName/__tests__/ComponentName.test.tsx`
- Utility tests: `src/utils/__tests__/utilityName.test.ts`
- Service tests: `src/services/__tests__/ServiceName.test.ts`
- Helper tests: `src/helpers/__tests__/helperName.test.ts`

### Naming Conventions
- Test files: `*.test.ts` or `*.test.tsx`
- Test suites: Use `describe()` blocks for logical grouping
- Test cases: Use descriptive names starting with "should..."

## Testing Examples

### Component Testing
```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomButton from '../CustomButton';

describe('CustomButton', () => {
  it('should render with correct title', () => {
    const { getByText } = render(
      <CustomButton title="Click Me" onPress={() => {}} />
    );

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPressMock = jest.fn();

    const { getByText } = render(
      <CustomButton title="Click Me" onPress={onPressMock} />
    );

    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

### Service Testing
```typescript
import { errorHandler, ErrorCategory, ErrorSeverity } from '../errorHandling';

describe('ErrorHandlingService', () => {
  beforeEach(() => {
    errorHandler.clearErrorLog();
    jest.clearAllMocks();
  });

  it('should create standardized error object', () => {
    const error = errorHandler.createError(
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      'Network timeout',
      'Please check your connection'
    );

    expect(error).toMatchObject({
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
    });
  });
});
```

### Async Testing
```typescript
import { storeDataJson, getDataJson } from '../Asyncstorage';

describe('AsyncStorage Helpers', () => {
  it('should store and retrieve JSON data', async () => {
    const key = 'testKey';
    const value = { name: 'John', age: 30 };

    await storeDataJson(key, value);
    const result = await getDataJson(key);

    expect(result).toEqual(value);
  });
});
```

## Mocking Guidelines

### External Dependencies
All external React Native dependencies are mocked in `jest.setup.js`:
- AsyncStorage
- React Native Video
- File System operations
- Navigation
- Vector Icons
- Image Picker

### API Calls
```typescript
// Mock API responses
jest.mock('../api', () => ({
  fetchUserData: jest.fn(() =>
    Promise.resolve({ id: '1', name: 'John Doe' })
  ),
}));
```

### Custom Hooks
```typescript
// Mock custom hooks
jest.mock('../hooks/useTheme', () => ({
  useThemeColors: () => ({
    primary: '#F45303',
    secondary: '#D69E2E',
  }),
}));
```

## Coverage Requirements

The project maintains a 70% coverage threshold across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
- HTML report: `coverage/lcov-report/index.html`
- JSON report: `coverage/coverage-final.json`
- Text summary: Displayed in terminal after test run

## Best Practices

### 1. Test Isolation
- Use `beforeEach()` and `afterEach()` to reset state
- Clear mocks between tests
- Avoid dependencies between tests

### 2. Descriptive Test Names
```typescript
// Good
it('should display error message when network request fails')

// Bad
it('should work correctly')
```

### 3. AAA Pattern (Arrange, Act, Assert)
```typescript
it('should calculate total price correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 4. Mock External Dependencies
- Mock API calls and external services
- Use realistic mock data
- Keep mocks simple and focused

### 5. Test Edge Cases
- Empty data
- Error conditions
- Boundary values
- Null/undefined inputs

## Debugging Tests

### Common Issues

1. **Mock not working**: Check if mock is properly imported
2. **Async test timeout**: Use `await` or return promises
3. **Component not found**: Check if component is properly rendered
4. **Style assertions failing**: Use `toMatchObject()` for partial style matching

### Debug Commands
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug info
npm test -- --testNamePattern="should render correctly" --verbose
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hooks (if configured)

### CI Configuration
Ensure your CI environment:
- Installs dependencies
- Runs `npm test` or `yarn test`
- Checks coverage thresholds
- Reports test results

## Adding New Tests

When adding new components or utilities:

1. Create test file in appropriate `__tests__` directory
2. Import testing utilities
3. Write comprehensive test cases
4. Ensure coverage meets threshold
5. Update this guide if needed

## Troubleshooting

### Common Test Failures

1. **Module not found**: Check imports and mock setup
2. **Timeout errors**: Increase timeout for async operations
3. **Snapshot mismatches**: Update snapshots if changes are intentional
4. **Mock issues**: Verify mock implementations match real APIs

### Getting Help

- Check Jest documentation: https://jestjs.io/docs/getting-started
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- Team knowledge base or Slack channels