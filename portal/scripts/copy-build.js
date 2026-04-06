const fs = require('fs-extra');
const path = require('path');

const buildDir = path.join(__dirname, '..', 'build');
const publicDir = path.join(__dirname, '..', '..', 'public', 'portal');

console.log('📦 Copying build files...');
console.log('   From:', buildDir);
console.log('   To:', publicDir);

try {
  // Remove old portal build
  if (fs.existsSync(publicDir)) {
    fs.removeSync(publicDir);
    console.log('🗑️  Removed old portal build');
  }

  // Copy new build
  fs.copySync(buildDir, publicDir);
  console.log('✅ Portal build copied successfully!');
} catch (error) {
  console.error('❌ Error copying build:', error);
  process.exit(1);
}