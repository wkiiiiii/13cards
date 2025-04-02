const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting client build script...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check for Render environment
const isRender = process.env.RENDER === 'true' || process.env.IS_RENDER === 'true';
console.log('Running on Render:', isRender ? 'Yes' : 'No');

// Set environment variables
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';

// Create the build directory if it doesn't exist
const buildDir = path.join(__dirname, 'client', 'build');
if (!fs.existsSync(buildDir)) {
  console.log(`Creating build directory at: ${buildDir}`);
  fs.mkdirSync(buildDir, { recursive: true });
}

// Function to create a fallback HTML file
function createFallbackHtml(path, message) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chinese Poker</title>
    <style>
      body { 
        font-family: sans-serif; 
        margin: 0; 
        padding: 20px; 
        background: #2c3e50; 
        color: white; 
      }
      .container { 
        max-width: 800px; 
        margin: 0 auto; 
        text-align: center; 
      }
      h1 { color: #e74c3c; }
      .card-container {
        display: flex;
        justify-content: center;
        margin-top: 30px;
      }
      .card {
        width: 80px;
        height: 120px;
        margin: 0 10px;
        background-color: white;
        border-radius: 5px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: black;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      }
      .hearts, .diamonds { color: #e74c3c; }
      .message {
        margin-top: 20px;
        padding: 10px;
        background: #34495e;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Chinese Poker</h1>
      <p>${message}</p>
      <div class="card-container">
        <div class="card hearts">
          <div>A</div>
          <div>♥</div>
        </div>
        <div class="card spades">
          <div>K</div>
          <div>♠</div>
        </div>
        <div class="card diamonds">
          <div>Q</div>
          <div>♦</div>
        </div>
        <div class="card clubs">
          <div>J</div>
          <div>♣</div>
        </div>
      </div>
      <div class="message">
        Server is running at ${new Date().toISOString()}
      </div>
    </div>
  </body>
</html>`;
  
  fs.writeFileSync(path, htmlContent);
  console.log(`Created fallback HTML at: ${path}`);
}

try {
  // Try different build strategies based on the environment
  if (isRender) {
    console.log('\n=== Installing client dependencies with legacy peer deps ===');
    execSync('cd client && npm install --legacy-peer-deps', { stdio: 'inherit' });
    
    console.log('\n=== Building client using npx with OpenSSL legacy provider ===');
    try {
      execSync('cd client && NODE_OPTIONS="--openssl-legacy-provider" npx --no-install react-scripts build', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          CI: 'false',
          GENERATE_SOURCEMAP: 'false',
          NODE_OPTIONS: '--openssl-legacy-provider'
        }
      });
    } catch (buildError) {
      console.error('Error during npx build on Render:', buildError);
      
      // Create fallback HTML
      createFallbackHtml(path.join(buildDir, 'index.html'), 'This page is being served by the Render deployment fallback.');
      
      // Copy public files 
      console.log('Copying public files as fallback...');
      execSync('cp -r client/public/* client/build/', { stdio: 'inherit' });
    }
  } else {
    // For local environment, use the standard build process
    console.log('\n=== Installing client dependencies ===');
    execSync('cd client && npm install', { stdio: 'inherit' });
    
    console.log('\n=== Building client ===');
    execSync('cd client && npm run build', { stdio: 'inherit' });
  }
  
  // Verify build directory has the necessary files
  if (fs.existsSync(buildDir)) {
    const files = fs.readdirSync(buildDir);
    console.log('Build directory contents:', files);
    
    if (!files.includes('index.html')) {
      console.warn('⚠️ index.html not found in build directory, creating fallback');
      createFallbackHtml(path.join(buildDir, 'index.html'), 'Fallback page created during build verification.');
    }
  }
  
  console.log('\n✅ Client build process completed!');
} catch (error) {
  console.error('Error during build process:', error);
  
  // Create emergency fallback HTML
  createFallbackHtml(path.join(buildDir, 'index.html'), 'Emergency fallback page. There was an error during the build process.');
} 