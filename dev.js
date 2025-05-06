/**
 * Custom development server starter script
 * This ensures environment variables are properly loaded
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  console.log('Loading environment from:', envPath);
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Parse the file and set environment variables
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      
      process.env[key] = value;
      console.log(`Set environment variable: ${key}`);
    }
  });
  
  console.log('Environment variables loaded successfully!');
} catch (err) {
  console.error('Could not load .env.local file:', err.message);
  console.error('Authentication will likely fail without proper environment variables.');
}

// Start Next.js dev server
console.log('\nStarting Next.js development server...');
const nextDev = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
  }
});

// Handle process exit
nextDev.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`);
  process.exit(code);
});

// Forward signals to the child process
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    if (!nextDev.killed) {
      nextDev.kill(signal);
    }
  });
}); 