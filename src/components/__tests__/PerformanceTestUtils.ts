/**
 * Performance Testing Utilities for Components
 * Provides tools for measuring and testing component performance
 */

import React from 'react';
import { render, RenderAPI } from '@testing-library/react-native';
import { performance } from 'perf_hooks';
import { renderWithProviders } from '../../utils/testing/TestUtils';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

export interface PerformanceTestOptions {
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  memoryThreshold?: number;
  renderTimeThreshold?: number;
}

export class ComponentPerformanceTester {
  private metrics: PerformanceMetrics[] = [];
  private reRenderCount = 0;
  private startTime = 0;
  private startMemory = 0;

  /**
   * Measure component render performance
   */
  async measureRenderPerformance(
    component: React.ReactElement,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceMetrics> {
    const {
      iterations = 10,
      warmupIterations = 3,
      timeout = 5000,
    } = options;

    // Warmup runs
    for (let i = 0; i < warmupIterations; i++) {
      renderWithProviders(component);
    }

    // Performance measurement runs
    const results: PerformanceMetrics[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await this.measureSingleRender(component, timeout);
      results.push(result);
    }

    // Calculate averages
    const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
    const avgMemoryUsage = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;
    const avgComponentCount = results.reduce((sum, r) => sum + r.componentCount, 0) / results.length;

    return {
      renderTime: avgRenderTime,
      memoryUsage: avgMemoryUsage,
      componentCount: avgComponentCount,
      reRenderCount: this.renderCount,
    };
  }

  private async measureSingleRender(
    component: React.ReactElement,
    timeout: number
  ): Promise<PerformanceMetrics> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Render timeout after ${timeout}ms`));
      }, timeout);

      const startTime = performance.now();
      const startMemory = process.memoryUsage();

      try {
        const { toJSON } = renderWithProviders(component);
        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        clearTimeout(timer);

        const renderTime = endTime - startTime;
        const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
        const componentCount = this.countComponents(toJSON());

        resolve({
          renderTime,
          memoryUsage,
          componentCount,
          reRenderCount: 0,
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private countComponents(element: any): number {
    if (!element || typeof element !== 'object') return 0;
    
    let count = 1; // Count the current element
    
    if (element.children) {
      for (const child of element.children) {
        count += this.countComponents(child);
      }
    }
    
    return count;
  }

  /**
   * Measure component re-render performance
   */
  measureReRenderPerformance(
    component: React.ReactElement,
    triggerReRender: () => void,
    options: PerformanceTestOptions = {}
  ): PerformanceMetrics {
    const { iterations = 5 } = options;
    
    const { rerender } = renderWithProviders(component);
    
    const results: PerformanceMetrics[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      triggerReRender();
      rerender(component);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      results.push({
        renderTime,
        memoryUsage: 0,
        componentCount: 0,
        reRenderCount: i + 1,
      });
    }
    
    const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
    
    return {
      renderTime: avgRenderTime,
      memoryUsage: 0,
      componentCount: 0,
      reRenderCount: iterations,
    };
  }

  /**
   * Measure component mount/unmount performance
   */
  async measureMountUnmountPerformance(
    component: React.ReactElement,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceMetrics> {
    const { iterations = 10 } = options;
    
    const results: PerformanceMetrics[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = process.memoryUsage();
      
      const { unmount } = renderWithProviders(component);
      unmount();
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      const renderTime = endTime - startTime;
      const memoryUsage = endMemory.heapUsed - startMemory.heapUsed;
      
      results.push({
        renderTime,
        memoryUsage,
        componentCount: 0,
        reRenderCount: 0,
      });
    }
    
    const avgRenderTime = results.reduce((sum, r) => sum + r.renderTime, 0) / results.length;
    const avgMemoryUsage = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;
    
    return {
      renderTime: avgRenderTime,
      memoryUsage: avgMemoryUsage,
      componentCount: 0,
      reRenderCount: 0,
    };
  }

  /**
   * Measure component interaction performance
   */
  async measureInteractionPerformance(
    component: React.ReactElement,
    interactions: Array<{
      name: string;
      action: () => void;
    }>,
    options: PerformanceTestOptions = {}
  ): Promise<Record<string, PerformanceMetrics>> {
    const { iterations = 5 } = options;
    const results: Record<string, PerformanceMetrics> = {};
    
    for (const interaction of interactions) {
      const interactionResults: PerformanceMetrics[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const { getByTestId } = renderWithProviders(component);
        
        const startTime = performance.now();
        interaction.action();
        const endTime = performance.now();
        
        const renderTime = endTime - startTime;
        
        interactionResults.push({
          renderTime,
          memoryUsage: 0,
          componentCount: 0,
          reRenderCount: 0,
        });
      }
      
      const avgRenderTime = interactionResults.reduce((sum, r) => sum + r.renderTime, 0) / iterations;
      
      results[interaction.name] = {
        renderTime: avgRenderTime,
        memoryUsage: 0,
        componentCount: 0,
        reRenderCount: 0,
      };
    }
    
    return results;
  }

  /**
   * Compare performance between two components
   */
  async comparePerformance(
    componentA: React.ReactElement,
    componentB: React.ReactElement,
    options: PerformanceTestOptions = {}
  ): Promise<{
    componentA: PerformanceMetrics;
    componentB: PerformanceMetrics;
    comparison: {
      renderTimeImprovement: number;
      memoryImprovement: number;
      winner: 'A' | 'B' | 'tie';
    };
  }> {
    const metricsA = await this.measureRenderPerformance(componentA, options);
    const metricsB = await this.measureRenderPerformance(componentB, options);
    
    const renderTimeImprovement = ((metricsA.renderTime - metricsB.renderTime) / metricsA.renderTime) * 100;
    const memoryImprovement = ((metricsA.memoryUsage - metricsB.memoryUsage) / metricsA.memoryUsage) * 100;
    
    let winner: 'A' | 'B' | 'tie' = 'tie';
    if (renderTimeImprovement > 5 && memoryImprovement > 5) {
      winner = 'B';
    } else if (renderTimeImprovement < -5 && memoryImprovement < -5) {
      winner = 'A';
    }
    
    return {
      componentA: metricsA,
      componentB: metricsB,
      comparison: {
        renderTimeImprovement,
        memoryImprovement,
        winner,
      },
    };
  }

  /**
   * Generate performance report
   */
  generateReport(
    componentName: string,
    metrics: PerformanceMetrics,
    thresholds: {
      renderTime?: number;
      memoryUsage?: number;
      componentCount?: number;
    } = {}
  ): {
    componentName: string;
    metrics: PerformanceMetrics;
    status: 'pass' | 'warning' | 'fail';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check render time
    if (thresholds.renderTime && metrics.renderTime > thresholds.renderTime) {
      issues.push(`Render time ${metrics.renderTime.toFixed(2)}ms exceeds threshold ${thresholds.renderTime}ms`);
      recommendations.push('Consider using React.memo or optimizing component structure');
    }
    
    // Check memory usage
    if (thresholds.memoryUsage && metrics.memoryUsage > thresholds.memoryUsage) {
      issues.push(`Memory usage ${metrics.memoryUsage} exceeds threshold ${thresholds.memoryUsage}`);
      recommendations.push('Consider reducing component complexity or implementing cleanup');
    }
    
    // Check component count
    if (thresholds.componentCount && metrics.componentCount > thresholds.componentCount) {
      issues.push(`Component count ${metrics.componentCount} exceeds threshold ${thresholds.componentCount}`);
      recommendations.push('Consider reducing component nesting or splitting into smaller components');
    }
    
    let status: 'pass' | 'warning' | 'fail' = 'pass';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'fail' : 'warning';
    }
    
    return {
      componentName,
      metrics,
      status,
      issues,
      recommendations,
    };
  }
}

// Utility functions for common performance tests
export const measureFlatListPerformance = async (
  data: any[],
  renderItem: (item: any) => React.ReactElement,
  options: PerformanceTestOptions = {}
): Promise<PerformanceMetrics> => {
  const tester = new ComponentPerformanceTester();
  
  const component = (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      testID="performance-test-flatlist"
    />
  );
  
  return tester.measureRenderPerformance(component, options);
};

export const measureImagePerformance = async (
  imageUrl: string,
  options: PerformanceTestOptions = {}
): Promise<PerformanceMetrics> => {
  const tester = new ComponentPerformanceTester();
  
  const component = (
    <Image
      source={{ uri: imageUrl }}
      style={{ width: 100, height: 100 }}
      testID="performance-test-image"
    />
  );
  
  return tester.measureRenderPerformance(component, options);
};

export const measureNavigationPerformance = async (
  screens: Array<{ name: string; component: React.ComponentType }>,
  initialRouteName: string,
  options: PerformanceTestOptions = {}
): Promise<PerformanceMetrics> => {
  const tester = new ComponentPerformanceTester();
  
  const Stack = createStackNavigator();
  
  const component = (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        {screens.map((screen) => (
          <Stack.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component}
          />
        ))}
      </Stack.Navigator>
    </NavigationContainer>
  );
  
  return tester.measureRenderPerformance(component, options);
};

// Performance test assertions
export const expectPerformanceToMeetThresholds = (
  metrics: PerformanceMetrics,
  thresholds: {
    renderTime?: number;
    memoryUsage?: number;
    componentCount?: number;
  }
): void => {
  if (thresholds.renderTime) {
    expect(metrics.renderTime).toBeLessThanOrEqual(thresholds.renderTime);
  }
  
  if (thresholds.memoryUsage) {
    expect(metrics.memoryUsage).toBeLessThanOrEqual(thresholds.memoryUsage);
  }
  
  if (thresholds.componentCount) {
    expect(metrics.componentCount).toBeLessThanOrEqual(thresholds.componentCount);
  }
};

export const expectPerformanceImprovement = (
  before: PerformanceMetrics,
  after: PerformanceMetrics,
  improvementThreshold: number = 10
): void => {
  const renderTimeImprovement = ((before.renderTime - after.renderTime) / before.renderTime) * 100;
  const memoryImprovement = ((before.memoryUsage - after.memoryUsage) / before.memoryUsage) * 100;
  
  expect(renderTimeImprovement).toBeGreaterThanOrEqual(improvementThreshold);
  expect(memoryImprovement).toBeGreaterThanOrEqual(improvementThreshold);
};

// Export the tester class
export default ComponentPerformanceTester;
