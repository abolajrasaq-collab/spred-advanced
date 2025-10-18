/**
 * Jest Test Sequencer
 * Custom test sequencing for performance and integration tests
 */

class CustomSequencer {
  sort(tests) {
    // Separate tests by type
    const unitTests = [];
    const integrationTests = [];
    const performanceTests = [];
    const e2eTests = [];
    const otherTests = [];

    tests.forEach(test => {
      const path = test.path;
      
      if (path.includes('performance') || path.includes('benchmark')) {
        performanceTests.push(test);
      } else if (path.includes('integration')) {
        integrationTests.push(test);
      } else if (path.includes('e2e')) {
        e2eTests.push(test);
      } else if (path.includes('__tests__')) {
        unitTests.push(test);
      } else {
        otherTests.push(test);
      }
    });

    // Sort tests within each category
    const sortByPath = (a, b) => a.path.localeCompare(b.path);
    
    unitTests.sort(sortByPath);
    integrationTests.sort(sortByPath);
    performanceTests.sort(sortByPath);
    e2eTests.sort(sortByPath);
    otherTests.sort(sortByPath);

    // Return tests in optimal order:
    // 1. Unit tests (fastest, most isolated)
    // 2. Integration tests (medium complexity)
    // 3. Performance tests (may be slower)
    // 4. E2E tests (slowest, most complex)
    // 5. Other tests
    return [
      ...unitTests,
      ...integrationTests,
      ...performanceTests,
      ...e2eTests,
      ...otherTests,
    ];
  }
}

module.exports = CustomSequencer;
