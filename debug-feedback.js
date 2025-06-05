#!/usr/bin/env node

// Simple test to check if feedback creation works via API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testFeedbackCreation() {
  try {
    console.log('Testing feedback creation via API...');
    
    // Test creating a feedback page
    const response = await fetch('http://localhost:3000/api/pages-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=test' // This won't work without proper auth
      },
      body: JSON.stringify({
        type: 'feedback',
        title: 'Debug Test Feedback',
        properties: {
          status: {
            type: 'select',
            select: { name: 'new', color: 'blue' }
          },
          priority: {
            type: 'select',
            select: { name: 'medium', color: 'yellow' }
          }
        }
      })
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', result);
    
  } catch (error) {
    console.error('Error testing feedback creation:', error);
  }
}

testFeedbackCreation();