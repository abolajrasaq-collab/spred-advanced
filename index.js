/**
 * @format
 */

// Suppress annoying warnings
console.warn = (() => {
  const originalWarn = console.warn;
  return (...args) => {
    const message = args.join(' ');

    // Suppress common React Native development warnings
    const suppressedWarnings = [
      'ViewPropTypes will be removed from React Native',
      'native module for Flipper',
      'react-native-flipper',
      'ReactlmageView: Image source',
      'logboximages_close',
      'assets_visible',
      '"assets_visible"',
      'Image source "assets_visible"',
      'doesn\'t exist',
      'React Native version mismatch',
      'Remote debugger is in use',
      'Each child in a list should have a unique "key" prop',
      'componentWillReceiveProps has been renamed',
      'componentWillUpdate has been renamed',
      'componentWillMount has been renamed',
      'ReactNativeFiberHostComponent',
      'Deprecation warning',
      'React Native requires a matching',
      'source.uri should not be an empty string',
      'Failed prop type',
    ];

    // Check if message contains any suppressed warnings
    const shouldSuppress = suppressedWarnings.some(warning =>
      message.includes(warning),
    );

    if (shouldSuppress) {
      return;
    }

    originalWarn.apply(console, args);
  };
})();

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
