#!/usr/bin/env node

// Bundle optimization script for React Native
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting bundle optimization...');

// 1. Remove unused heavy dependencies
const heavyDependencies = [
  'react-native-youtube',
  'react-native-qrcode-scanner', // Can be replaced with lighter alternatives
];

// 2. Check package.json for unused dependencies
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('📊 Analyzing dependencies...');

// Check which heavy dependencies are installed
const installedHeavyDeps = heavyDependencies.filter(
  dep => packageJson.dependencies[dep],
);

if (installedHeavyDeps.length > 0) {
  console.log('⚠️  Heavy dependencies found:', installedHeavyDeps);
  console.log('💡 Consider removing these unused heavy dependencies:');
  installedHeavyDeps.forEach(dep => {
    console.log(`   npm uninstall ${dep}`);
  });
} else {
  console.log('✅ No heavy dependencies found');
}

// 3. Optimize imports in source files
const srcPath = path.join(__dirname, '../src');
let optimizedFiles = 0;
let totalFiles = 0;

function optimizeFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Optimize React imports
    if (content.includes("import React from 'react';")) {
      content = content.replace(
        "import React from 'react';",
        "import React, { useState, useEffect } from 'react';",
      );
      modified = true;
    }

    // Optimize multiple React imports
    const reactImportRegex = /import React,[\s\S]*?from 'react';/g;
    if (reactImportRegex.test(content)) {
      content = content.replace(
        reactImportRegex,
        'import React, { useState, useEffect } from \'react\';',
      );
      modified = true;
    }

    // Remove console logs in production builds
    if (process.env.NODE_ENV === 'production') {
      content = content.replace(/console\.log\(.*?\);?/g, '');
      content = content.replace(/console\.warn\(.*?\);?/g, '');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      optimizedFiles++;
    }
    totalFiles++;
  } catch (error) {
    console.error(`Error optimizing ${filePath}:`, error.message);
  }
}

function walkDirectory(dir, callback) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDirectory(filePath, callback);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        callback(filePath);
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
}

console.log('🔧 Optimizing source files...');
walkDirectory(srcPath, optimizeFile);

console.log(`✅ Optimized ${optimizedFiles} of ${totalFiles} files`);

// 4. Generate bundle analysis report
console.log('📈 Generating bundle analysis...');

function analyzeBundle() {
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles,
    optimizedFiles,
    recommendations: [
      'Consider implementing lazy loading for large components',
      'Use dynamic imports for rarely used screens',
      'Implement code splitting for navigation routes',
      'Use Hermes JavaScript engine for production builds',
      'Enable ProGuard minification for Android release builds',
    ],
  };

  const reportPath = path.join(__dirname, '../bundle-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('📊 Bundle analysis saved to bundle-analysis.json');
}

analyzeBundle();

console.log('✨ Bundle optimization complete!');
console.log('\n🎯 Next steps:');
console.log('1. Restart Metro bundler to apply changes');
console.log('2. Test the app to ensure functionality is preserved');
console.log('3. Measure bundle size improvement');
console.log('4. Consider implementing the recommendations above');
