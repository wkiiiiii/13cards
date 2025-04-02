const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting local build and test script...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Build client
console.log('\n=== Building client for local testing ===');
try {
  execSync('cd client && npm run build', { stdio: 'inherit' });
  console.log('✅ Client build completed successfully');
} catch (error) {
  console.error('Error building client:', error);
}

// Check build directory
const buildDir = path.join(__dirname, 'client', 'build');
if (fs.existsSync(buildDir)) {
  console.log(`\n✅ Build directory exists at: ${buildDir}`);
  
  // List contents of build directory
  try {
    const files = fs.readdirSync(buildDir);
    console.log('Build directory contents:', files);
    
    if (files.includes('index.html')) {
      console.log('✅ index.html found in build directory');
      
      // Create a copy of the build directory for Render
      const renderBuildDir = path.join(__dirname, 'render-build');
      if (!fs.existsSync(renderBuildDir)) {
        fs.mkdirSync(renderBuildDir, { recursive: true });
      }
      
      console.log(`\n=== Copying build files to ${renderBuildDir} for Render deployment ===`);
      execSync(`cp -r ${buildDir}/* ${renderBuildDir}/`, { stdio: 'inherit' });
      console.log('✅ Build files copied for Render deployment');
    } else {
      console.error('❌ index.html not found in build directory!');
    }
  } catch (err) {
    console.error('Error listing build directory:', err);
  }
} else {
  console.error(`❌ Build directory does not exist at: ${buildDir}`);
}

console.log('\n=== Starting local test server ===');
console.log('Server will start at http://localhost:3001');
console.log('Press Ctrl+C to stop the server');

// Start the server in a way that it serves the client build files
process.env.NODE_ENV = 'production';
try {
  execSync('node server.js', { stdio: 'inherit' });
} catch (error) {
  // This will be reached when the user terminates the server
  console.log('Server stopped');
} 