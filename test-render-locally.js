const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting Render environment simulation test...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Simulate the Render environment
process.env.NODE_ENV = 'production';
process.env.IS_RENDER = 'true';

// Clean up build directory to simulate a fresh Render environment
const buildDir = path.join(__dirname, 'client', 'build');
console.log(`\n=== Cleaning up build directory at: ${buildDir} ===`);
if (fs.existsSync(buildDir)) {
  try {
    // Only remove the contents, not the directory itself
    const files = fs.readdirSync(buildDir);
    for (const file of files) {
      const filePath = path.join(buildDir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        execSync(`rm -rf "${filePath}"`, { stdio: 'inherit' });
      } else {
        fs.unlinkSync(filePath);
      }
    }
    console.log('✅ Build directory cleaned');
  } catch (err) {
    console.error('Error cleaning build directory:', err);
  }
} else {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Build directory created');
}

// Run the Render build process
console.log('\n=== Running Render build process ===');
try {
  execSync('node build-client.js', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      IS_RENDER: 'true',
      NODE_OPTIONS: '--openssl-legacy-provider'
    }
  });
  console.log('✅ Render build process completed');
} catch (error) {
  console.error('Error during Render build process:', error);
}

// Check the build result
console.log('\n=== Checking build result ===');
if (fs.existsSync(buildDir)) {
  const files = fs.readdirSync(buildDir);
  console.log('Build directory contents:', files);
  
  if (files.includes('index.html')) {
    console.log('✅ index.html found in build directory');
    // Read the index.html file to determine if it's the fallback or the actual React app
    const indexHtml = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
    if (indexHtml.includes('This page is being served by the Render deployment fallback')) {
      console.log('⚠️ Fallback index.html is being used');
    } else if (indexHtml.includes('<div id="root"></div>')) {
      console.log('✅ Actual React app index.html is being used');
    }
  } else {
    console.error('❌ index.html not found in build directory!');
  }
} else {
  console.error('❌ Build directory does not exist!');
}

// Start the server in Render mode
console.log('\n=== Starting server in Render mode ===');
console.log('Server will start at http://localhost:3002');
console.log('Press Ctrl+C to stop the server');

// Use a different port to avoid conflicts with the local test
const PORT = 3002;
try {
  execSync(`PORT=${PORT} NODE_ENV=production IS_RENDER=true node server.js`, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: 'production',
      IS_RENDER: 'true'
    }
  });
} catch (error) {
  // This will be reached when the user terminates the server
  console.log('Server stopped');
} 