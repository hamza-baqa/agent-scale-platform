#!/usr/bin/env node

// Test script to verify frontend files are collected
const glob = require('glob');
const path = require('path');

// Test with the platform frontend directory
const repoPath = path.join(__dirname, 'platform/frontend/src');

console.log('🔍 Testing file collection for:', repoPath);
console.log('='.repeat(80));

// Backend files
const javaFiles = glob.sync(`${repoPath}/**/*.java`, { ignore: '**/node_modules/**' });
const csFiles = glob.sync(`${repoPath}/**/*.cs`, { ignore: '**/node_modules/**' });

// Frontend files
const tsFiles = glob.sync(`${repoPath}/**/*.ts`, { ignore: ['**/node_modules/**', '**/*.spec.ts', '**/*.d.ts'] });
const tsxFiles = glob.sync(`${repoPath}/**/*.tsx`, { ignore: '**/node_modules/**' });
const jsFiles = glob.sync(`${repoPath}/**/*.js`, { ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'] });
const jsxFiles = glob.sync(`${repoPath}/**/*.jsx`, { ignore: '**/node_modules/**' });
const vueFiles = glob.sync(`${repoPath}/**/*.vue`, { ignore: '**/node_modules/**' });
const razorFiles = glob.sync(`${repoPath}/**/*.razor`, { ignore: '**/node_modules/**' });

const allFiles = [
  ...javaFiles,
  ...csFiles,
  ...tsFiles,
  ...tsxFiles,
  ...jsFiles,
  ...jsxFiles,
  ...vueFiles,
  ...razorFiles
];

console.log('\n📊 File Collection Results:');
console.log('-'.repeat(80));
console.log(`Backend Files:`);
console.log(`  Java:    ${javaFiles.length}`);
console.log(`  C#:      ${csFiles.length}`);
console.log(`  Subtotal: ${javaFiles.length + csFiles.length}`);

console.log(`\nFrontend Files:`);
console.log(`  TypeScript (.ts):  ${tsFiles.length}`);
console.log(`  TSX (.tsx):        ${tsxFiles.length}`);
console.log(`  JavaScript (.js):  ${jsFiles.length}`);
console.log(`  JSX (.jsx):        ${jsxFiles.length}`);
console.log(`  Vue (.vue):        ${vueFiles.length}`);
console.log(`  Razor (.razor):    ${razorFiles.length}`);
console.log(`  Subtotal: ${tsFiles.length + tsxFiles.length + jsFiles.length + jsxFiles.length + vueFiles.length + razorFiles.length}`);

console.log(`\n📦 Total Files: ${allFiles.length}`);
console.log('='.repeat(80));

// Show sample frontend files
console.log('\n📝 Sample Frontend Files (first 10):');
console.log('-'.repeat(80));
const frontendFiles = [...tsFiles, ...tsxFiles, ...jsFiles, ...jsxFiles, ...vueFiles];
frontendFiles.slice(0, 10).forEach((file, idx) => {
  const relative = path.relative(repoPath, file);
  const ext = path.extname(file);
  console.log(`${idx + 1}. ${relative} ${ext}`);
});

// Verify specific component types
const componentFiles = allFiles.filter(f => f.includes('.component.'));
const serviceFiles = allFiles.filter(f => f.includes('.service.'));
const pageFiles = allFiles.filter(f => f.includes('page.'));

console.log('\n🎯 Angular-specific Files:');
console.log('-'.repeat(80));
console.log(`  Components: ${componentFiles.length}`);
console.log(`  Services:   ${serviceFiles.length}`);
console.log(`  Pages:      ${pageFiles.length}`);

if (frontendFiles.length === 0) {
  console.log('\n❌ ERROR: No frontend files collected!');
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: Frontend files are being collected!');
  process.exit(0);
}
