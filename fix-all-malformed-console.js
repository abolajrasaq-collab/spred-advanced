const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  'src',
  'screens',
  'DownloadItems',
  'DownloadItems.tsx',
);

console.log(
  '🔧 Fixing all malformed console.log statements in DownloadItems.tsx...',
);

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix all malformed console.log patterns
  const patterns = [
    // Pattern 1: // DISABLED FOR PERFORMANCE - console.( followed by uncommented parameters
    {
      regex:
        /\/\/ DISABLED FOR PERFORMANCE - console\.\(\s*\n\s*[^)]+\s*\n\s*\);/g,
      replacement: match => {
        const lines = match.split('\n');
        const contentLines = lines.slice(1, -1); // Remove first and last lines

        const result = [
          '        // DISABLED FOR PERFORMANCE',
          '        // console.log(',
          ...contentLines.map(line => '        //   ' + line.trim()),
          '        // );',
        ].join('\n');

        return result;
      },
    },
  ];

  let totalFixed = 0;

  patterns.forEach((pattern, index) => {
    const matches = content.match(pattern.regex);
    if (matches) {
      console.log(`📝 Pattern ${index + 1}: ${matches.length} matches found`);
      content = content.replace(pattern.regex, pattern.replacement);
      totalFixed += matches.length;
    }
  });

  // Write the fixed content back
  fs.writeFileSync(filePath, content, 'utf8');

  console.log(
    `✅ Fixed ${totalFixed} malformed console.log statements in DownloadItems.tsx`,
  );
  console.log('📁 File saved successfully');
} catch (error) {
  console.error(
    '❌ Error fixing malformed console.log statements:',
    error.message,
  );
  process.exit(1);
}
