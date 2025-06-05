/**
 * Direct test of the AI chat API to verify it uses pages instead of legacy features
 */

async function testAIChatAPI() {
  console.log('🧪 Testing AI Chat API Direct - Features Query');
  console.log('='.repeat(50));
  
  try {
    // Test the AI chat API directly
    const response = await fetch('http://localhost:3001/api/ai-chat-fully-managed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add a test session cookie or auth header if needed
      },
      body: JSON.stringify({
        message: 'How many features do I have?',
        mode: 'agent',
        threadId: null
      })
    });
    
    const result = await response.text();
    console.log('📡 API Response Status:', response.status);
    console.log('📄 API Response Body:', result);
    
    if (response.status === 200) {
      console.log('✅ AI Chat API is responding');
      
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.message) {
          console.log('🤖 AI Response:', jsonResult.message);
          
          // Check if the response mentions a number that would indicate pages (>100) vs legacy features (8)
          const numbers = jsonResult.message.match(/\d+/g);
          if (numbers) {
            console.log('📊 Numbers found in response:', numbers);
            const largestNumber = Math.max(...numbers.map(n => parseInt(n)));
            
            if (largestNumber > 50) {
              console.log('🎉 SUCCESS: AI returned high feature count (' + largestNumber + '), likely using pages API!');
            } else if (largestNumber < 20) {
              console.log('⚠️  Warning: Low feature count (' + largestNumber + '), may still be using legacy API');
            }
          }
        }
      } catch (parseError) {
        console.log('📄 Response is not JSON, raw response:', result);
      }
      
    } else {
      console.log('❌ API request failed');
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testAIChatAPI();