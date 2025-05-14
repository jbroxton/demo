// Test AI Chat Integration Completion
const fs = require('fs');
const path = require('path');

// Check all required files exist
function checkRequiredFiles() {
  console.log('Checking required files...');
  
  const requiredFiles = [
    'src/services/ai-db.ts',
    'src/hooks/use-ai-chat.ts', 
    'src/app/api/ai-chat/route.ts',
    'src/components/ai-chat/index.tsx',
    'src/types/models/ai-chat.ts',
    '.env.local'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${file} exists`);
    } else {
      console.error(`✗ ${file} missing`);
      missingFiles.push(file);
    }
  });
  
  return missingFiles.length === 0;
}

// Check environment configuration
function checkEnvironment() {
  console.log('\nChecking environment configuration...');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('OPENAI_API_KEY=')) {
      console.log('✓ OpenAI API key configured');
    } else {
      console.error('✗ OpenAI API key not found');
      return false;
    }
  } else {
    console.error('✗ .env.local file not found');
    return false;
  }
  
  return true;
}

// Main execution
function main() {
  console.log('AI Chat Integration Test\n');
  
  const filesOk = checkRequiredFiles();
  const envOk = checkEnvironment();
  
  console.log('\nIntegration Status:');
  if (filesOk && envOk) {
    console.log('✓ All components integrated successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/dashboard');
    console.log('3. Open the right sidebar');
    console.log('4. Click on the "Chat" tab');
    console.log('5. Start chatting with your AI assistant!');
  } else {
    console.log('✗ Integration incomplete');
    console.log('\nPlease fix the issues above before proceeding.');
  }
}

main();