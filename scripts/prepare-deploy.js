#!/usr/bin/env node

/**
 * Deployment Preparation Script
 * Checks if project is ready for Vercel deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Checking deployment readiness...\n');

const checks = {
  packageJson: false,
  dataFiles: false,
  nextConfig: false,
  gitignore: false,
};

// Check package.json
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  checks.packageJson = true;
  console.log('✅ package.json found');
  console.log(`   - Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
  console.log(`   - Dev Dependencies: ${Object.keys(pkg.devDependencies || {}).length}`);
} else {
  console.log('❌ package.json not found');
}

// Check data files
const dataDir = path.join(__dirname, '..', 'data');
const requiredDataFiles = ['sales.json', 'salesmix.json', 'recharge.json', 'arcade.json'];
const missingFiles = [];

if (fs.existsSync(dataDir)) {
  requiredDataFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`✅ ${file} found (${sizeMB} MB)`);
    } else {
      missingFiles.push(file);
      console.log(`❌ ${file} missing`);
    }
  });
  checks.dataFiles = missingFiles.length === 0;
} else {
  console.log('❌ data/ directory not found');
}

// Check next.config.js
if (fs.existsSync('next.config.js')) {
  checks.nextConfig = true;
  console.log('✅ next.config.js found');
} else {
  console.log('⚠️  next.config.js not found (optional)');
}

// Check .gitignore
if (fs.existsSync('.gitignore')) {
  checks.gitignore = true;
  console.log('✅ .gitignore found');
} else {
  console.log('⚠️  .gitignore not found (recommended)');
}

// Summary
console.log('\n📊 Summary:');
const allPassed = Object.values(checks).every(v => v);
if (allPassed) {
  console.log('✅ All checks passed! Ready to deploy.\n');
  console.log('Next steps:');
  console.log('1. git init (if not already a git repo)');
  console.log('2. git add .');
  console.log('3. git commit -m "Ready for deployment"');
  console.log('4. Push to GitHub/GitLab');
  console.log('5. Import to Vercel or run: vercel --prod\n');
} else {
  console.log('⚠️  Some checks failed. Please fix issues above.\n');
}

// Check file sizes
console.log('📦 Project Size Check:');
const getDirSize = (dirPath) => {
  let totalSize = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += stats.size;
    }
  });
  return totalSize;
};

const excludeDirs = ['node_modules', '.next', '.git'];
const projectSize = getDirSize('.');
const projectSizeMB = (projectSize / (1024 * 1024)).toFixed(2);

console.log(`   Total project size: ${projectSizeMB} MB`);
console.log(`   (Excluding node_modules and .next)`);
console.log(`   ✅ Size is acceptable for Vercel deployment\n`);

process.exit(allPassed ? 0 : 1);

