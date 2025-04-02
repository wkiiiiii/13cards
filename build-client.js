const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting client build script...');

// Set environment variables
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';

try {
  console.log('Current directory:', process.cwd());
  console.log('Node version:', process.version);
  
  // Install client dependencies
  console.log('\n=== Installing client dependencies ===');
  execSync('cd client && npm install', { stdio: 'inherit' });
  
  // Build client
  console.log('\n=== Building client ===');
  execSync('cd client && npm run build', { stdio: 'inherit' });
  
  // Verify build directory exists
  const buildDir = path.join(__dirname, 'client', 'build');
  if (fs.existsSync(buildDir)) {
    console.log(`\n✅ Build directory created successfully at: ${buildDir}`);
    
    // List contents of build directory
    const files = fs.readdirSync(buildDir);
    console.log('Build directory contents:', files);
    
    if (files.includes('index.html')) {
      console.log('✅ index.html found in build directory');
    } else {
      console.error('❌ index.html not found in build directory!');
      process.exit(1);
    }
  } else {
    console.error(`❌ Build directory does not exist at: ${buildDir}`);
    process.exit(1);
  }
  
  console.log('\n✅ Client build completed successfully!');
} catch (error) {
  console.error('Error during build process:', error);
  process.exit(1);
} 