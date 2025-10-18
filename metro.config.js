const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const process = require('process');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const isProduction = process.env.NODE_ENV === 'production';
const config = {
  // Watch .yalc directories for changes
  watchFolders: ['.yalc'],
  // Suppress deprecation warnings
  resolver: {
    useWatchman: false,
    unstable_enablePackageExports: false,
    // Suppress ViewPropTypes warnings
    alias: {
      'react-native-vector-icons': require.resolve('react-native-vector-icons'),
    },
    // Optimize resolver for better performance
    blacklistRE: /node_modules\/.*\/node_modules\/react-native\/.*/,
  },
  transformer: {
    minifierConfig: {
      compress: {
        drop_console: isProduction ? true : false,
        drop_debugger: isProduction ? true : false,
        unused: true,
        dead_code: true,
        warnings: false,
      },
      mangle: {
        toplevel: false,
      },
      format: {
        comments: false,
      },
    },
    // Suppress ViewPropTypes deprecation warnings
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
      minifyConfig: {
        keep_fnames: false,
        keep_classnames: false,
      },
    }),
  },
  // Optimize for smaller bundles
  serializer: {
    getModulesRunBeforeMainModule: () => ['react-native'],
    getPolyfills: () => require('react-native/rn-get-polyfills')(),
  },
  // Optimize for development
  maxWorkers: 2,
  resetCache: false,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
