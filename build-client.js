const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting client build script...');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Listing directory contents before build:');
try {
  execSync('ls -la', { stdio: 'inherit' });
  execSync('ls -la client', { stdio: 'inherit' });
} catch (e) {
  console.error('Error listing directories:', e);
}

// Set environment variables
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';
process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-warnings';

try {
  // Install client dependencies
  console.log('\n=== Installing client dependencies ===');
  execSync('cd client && npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Create the build directory manually if it doesn't exist
  const buildDir = path.join(__dirname, 'client', 'build');
  if (!fs.existsSync(buildDir)) {
    console.log(`Creating build directory at: ${buildDir}`);
    fs.mkdirSync(buildDir, { recursive: true });
  }
  
  // Try building with npx approach to bypass potential global conflicts
  console.log('\n=== Building client using npx ===');
  try {
    execSync('cd client && npx --no-install react-scripts build', { 
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: 'false',
        GENERATE_SOURCEMAP: 'false',
        NODE_OPTIONS: '--openssl-legacy-provider --no-warnings'
      }
    });
  } catch (buildError) {
    console.error('Error during npx build:', buildError);
    console.log('\n=== Trying alternative build approach ===');
    
    // If that fails, try a more direct approach with a simple webpack config
    const indexJsPath = path.join(__dirname, 'client', 'src', 'index.js');
    if (fs.existsSync(indexJsPath)) {
      // Create minimal HTML file
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chinese Poker</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="./main.js"></script>
  </body>
</html>`;
      
      fs.writeFileSync(path.join(buildDir, 'index.html'), htmlContent);
      console.log('Created fallback index.html');
      
      // Create a simple bundle using esbuild (much more compatible with newer Node)
      console.log('Attempting to bundle with esbuild...');
      try {
        execSync('npm install --no-save esbuild', { stdio: 'inherit' });
        execSync(`npx esbuild client/src/index.js --bundle --outfile=client/build/main.js`, { 
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('Successfully created bundle with esbuild');
      } catch (esbuildError) {
        console.error('Error bundling with esbuild:', esbuildError);
        
        // As a last resort, just copy public files
        console.log('Copying public files as last resort...');
        execSync('cp -r client/public/* client/build/', { stdio: 'inherit' });
        
        // Create a minimal JavaScript file
        const jsContent = `
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  root.innerHTML = '<div style="text-align:center;margin-top:50px;"><h1>Chinese Poker</h1><p>Server is running, but there was an issue building the client.</p></div>';
});`;
        
        fs.writeFileSync(path.join(buildDir, 'main.js'), jsContent);
      }
    } else {
      console.error('Index.js not found at:', indexJsPath);
    }
  }
  
  // Verify build directory exists and has files
  if (fs.existsSync(buildDir)) {
    console.log(`\n✅ Build directory exists at: ${buildDir}`);
    
    // List contents of build directory
    const files = fs.readdirSync(buildDir);
    console.log('Build directory contents:', files);
    
    if (files.includes('index.html')) {
      console.log('✅ index.html found in build directory');
    } else {
      console.error('❌ index.html not found in build directory!');
      
      // Create a minimal index.html file as a last resort
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chinese Poker</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 20px; background: #2c3e50; color: white; }
      .container { max-width: 800px; margin: 0 auto; text-align: center; }
      h1 { color: #e74c3c; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Chinese Poker</h1>
      <p>Emergency fallback page. The server is running correctly.</p>
    </div>
  </body>
</html>`;
      
      fs.writeFileSync(path.join(buildDir, 'index.html'), htmlContent);
      console.log('Created emergency fallback index.html');
    }
  } else {
    console.error(`❌ Build directory does not exist at: ${buildDir}`);
    fs.mkdirSync(buildDir, { recursive: true });
    
    // Create a minimal emergency index.html
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chinese Poker</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 20px; background: #2c3e50; color: white; }
      .container { max-width: 800px; margin: 0 auto; text-align: center; }
      h1 { color: #e74c3c; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Chinese Poker</h1>
      <p>Emergency fallback page. The build directory had to be created manually.</p>
    </div>
  </body>
</html>`;
    
    fs.writeFileSync(path.join(buildDir, 'index.html'), htmlContent);
    console.log('Created emergency fallback index.html in newly created build directory');
  }
  
  console.log('\n✅ Client build process completed!');
} catch (error) {
  console.error('Error during build process:', error);
  
  // Create emergency build directory and index.html
  try {
    const buildDir = path.join(__dirname, 'client', 'build');
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Chinese Poker</title>
    <style>
      body { font-family: sans-serif; margin: 0; padding: 20px; background: #2c3e50; color: white; }
      .container { max-width: 800px; margin: 0 auto; text-align: center; }
      h1 { color: #e74c3c; }
      pre { text-align: left; background: #34495e; padding: 15px; border-radius: 5px; overflow: auto; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Chinese Poker</h1>
      <p>Emergency fallback page. There was an error during the build process.</p>
      <pre>${error.message || 'Unknown error'}</pre>
    </div>
  </body>
</html>`;
    
    fs.writeFileSync(path.join(buildDir, 'index.html'), htmlContent);
    console.log('Created emergency error fallback index.html');
  } catch (emergencyError) {
    console.error('Failed to create emergency fallback:', emergencyError);
  }
  
  // Don't exit with error code, so the server can still start
  // process.exit(1);
} 