#!/usr/bin/env node

/**
 * Script to clear all browser storage for debugging
 * 
 * This script creates a simple HTML page that:
 * 1. Displays and then clears all localStorage
 * 2. Displays and then clears all sessionStorage
 * 3. Displays and then clears all cookies
 * 
 * Run with: node clear-storage.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// HTML content with script to display and clear storage
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Clear Browser Storage</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.5;
    }
    h1, h2 { margin-top: 2rem; }
    pre {
      background-color: #f1f1f1;
      padding: 15px;
      border-radius: 5px;
      overflow: auto;
      max-height: 300px;
    }
    button {
      background-color: #0070f3;
      color: white;
      border: none;
      padding: 10px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      margin: 20px 0;
    }
    button:hover { background-color: #0051c3; }
    .warning { color: red; font-weight: bold; }
    .success { color: green; font-weight: bold; }
    .storage-item { 
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .key { font-weight: bold; color: #0070f3; }
    .no-data { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <h1>Storage Inspector & Cleaner</h1>
  <p>This tool will help you identify what's stored in your browser storage and clear it all.</p>
  <p class="warning">Note: This will clear all localStorage, sessionStorage, and cookies for this domain!</p>
  
  <div id="results">
    <h2>Local Storage Items</h2>
    <div id="localStorage"></div>
    
    <h2>Session Storage Items</h2>
    <div id="sessionStorage"></div>
    
    <h2>Cookies</h2>
    <div id="cookies"></div>
  </div>
  
  <button id="clearAll">Clear All Storage & Cookies</button>
  <div id="clearResult"></div>
  
  <script>
    // Function to display storage contents
    function displayStorage() {
      // Display localStorage
      const localStorageDiv = document.getElementById('localStorage');
      if (localStorage.length === 0) {
        localStorageDiv.innerHTML = '<p class="no-data">No localStorage items found</p>';
      } else {
        let html = '';
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          let value = localStorage.getItem(key);
          
          // Try to pretty-print JSON
          try {
            const parsedValue = JSON.parse(value);
            value = JSON.stringify(parsedValue, null, 2);
          } catch (e) {
            // Not JSON, leave as is
          }
          
          html += \`
            <div class="storage-item">
              <div class="key">\${key}</div>
              <pre>\${value}</pre>
            </div>
          \`;
        }
        localStorageDiv.innerHTML = html;
      }
      
      // Display sessionStorage
      const sessionStorageDiv = document.getElementById('sessionStorage');
      if (sessionStorage.length === 0) {
        sessionStorageDiv.innerHTML = '<p class="no-data">No sessionStorage items found</p>';
      } else {
        let html = '';
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          let value = sessionStorage.getItem(key);
          
          // Try to pretty-print JSON
          try {
            const parsedValue = JSON.parse(value);
            value = JSON.stringify(parsedValue, null, 2);
          } catch (e) {
            // Not JSON, leave as is
          }
          
          html += \`
            <div class="storage-item">
              <div class="key">\${key}</div>
              <pre>\${value}</pre>
            </div>
          \`;
        }
        sessionStorageDiv.innerHTML = html;
      }
      
      // Display cookies
      const cookiesDiv = document.getElementById('cookies');
      const cookies = document.cookie.split(';');
      
      if (cookies.length === 0 || (cookies.length === 1 && cookies[0].trim() === '')) {
        cookiesDiv.innerHTML = '<p class="no-data">No cookies found</p>';
      } else {
        let html = '';
        cookies.forEach(cookie => {
          if (cookie.trim()) {
            const parts = cookie.trim().split('=');
            const key = parts[0];
            const value = parts.slice(1).join('=');
            
            html += \`
              <div class="storage-item">
                <div class="key">\${key}</div>
                <pre>\${value}</pre>
              </div>
            \`;
          }
        });
        cookiesDiv.innerHTML = html;
      }
    }
    
    // Clear all storage
    document.getElementById('clearAll').addEventListener('click', function() {
      const resultDiv = document.getElementById('clearResult');
      let cleared = {
        localStorage: 0,
        sessionStorage: 0,
        cookies: 0
      };
      
      // Clear localStorage
      cleared.localStorage = localStorage.length;
      localStorage.clear();
      
      // Clear sessionStorage
      cleared.sessionStorage = sessionStorage.length;
      sessionStorage.clear();
      
      // Clear cookies
      const cookies = document.cookie.split(";");
      cleared.cookies = cookies.length;
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        
        if (name) {
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }
      }
      
      // Update the page
      resultDiv.innerHTML = \`
        <div class="success">
          <p>All storage cleared!</p>
          <ul>
            <li>LocalStorage: \${cleared.localStorage} items removed</li>
            <li>SessionStorage: \${cleared.sessionStorage} items removed</li>
            <li>Cookies: \${cleared.cookies} cookies removed</li>
          </ul>
          <p>Reload the page to see empty storage or <a href="/">return to the app</a>.</p>
        </div>
      \`;
      
      // Update the display
      displayStorage();
    });
    
    // Initialize the display when page loads
    window.onload = displayStorage;
  </script>
</body>
</html>
`;

// Create a server to serve the HTML page
const server = http.createServer((req, res) => {
  // Only respond to the root path
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Find an available port, starting with 3001
function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🧹 Storage cleaning server started at http://localhost:${port}`);
    console.log('Open this URL in your browser to view and clear storage\n');
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

// Start the server
startServer(3001);