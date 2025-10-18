/**
 * JSDoc Configuration for Spred Mobile App
 * Generates comprehensive API documentation from JSDoc comments
 */

module.exports = {
  source: {
    include: ['./src/', './README.md', './TESTING.md', './docs/'],
    include: './src',
    includePattern: '\\.(js|jsx|ts|tsx)$',
    exclude: [
      './src/**/*.test.{js,jsx,ts,tsx}',
      './src/**/__tests__/**',
      './node_modules/',
      './src(template)/',
    ],
    excludePattern: '(test|spec)\\.(js|jsx|ts|tsx)$',
  },
  opts: {
    destination: './docs/generated/',
    recurse: true,
  },
  plugins: [
    'plugins/markdown',
    'node_modules/better-docs/typescript',
    'node_modules/better-docs/category',
  ],
  templates: {
    cleverLinks: false,
    monospaceLinks: false,
    better: {
      name: 'Spred Mobile App Documentation',
      logo: './assets/logo.png',
      title: 'Spred Mobile App - API Documentation',
      css: './docs/styles/custom.css',
      hideGenerator: true,
      navigation: [
        {
          label: 'GitHub',
          href: 'https://github.com/your-repo/spred-mobile',
        },
        {
          label: 'Testing Guide',
          href: './TESTING.html',
        },
      ],
      component: {
        wrapper: './docs/components/wrapper.jsx',
      },
    },
  },
  tags: {
    allowUnknownTags: true,
    dictionaries: ['jsdoc', 'closure'],
  },
  markdown: {
    parser: 'gfm',
  },
};
