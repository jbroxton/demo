#!/usr/bin/env node

/**
 * Simple script to clear Next.js, NextAuth, and app-specific cookies
 * Run with: node clear-cookies.js
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// HTML content with instructions and a button to clear cookies
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Clear App Cookies</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { color: #333; }
    .success { color: green; }
    .error { color: red; }
    .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
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
    button:hover {
      background-color: #0051b3;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 4px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>Clear App Cookies</h1>
  <p>This page will clear all cookies for your application:</p>
  <ul>
    <li>Next.js cookies</li>
    <li>NextAuth session cookies</li>
    <li>Application-specific cookies</li>
  </ul>
  
  <div id="result"></div>
  
  <button id="clearCookies">Clear All Cookies</button>
  
  <script>
    document.getElementById('clearCookies').addEventListener('click', function() {
      const cookies = document.cookie.split(";");
      let count = 0;
      let clearedCookies = [];
      
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i];
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          
          if (name) {
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              count++;
              clearedCookies.push(name);
          }
      }
      
      // Also clear local storage
      localStorage.clear();
      
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<div class="message success"><strong>' + count + ' cookies cleared!</strong>';
      
      if (clearedCookies.length > 0) {
        resultDiv.innerHTML += '<p>Cleared cookies: ' + clearedCookies.join(', ') + '</p>';
      }
      
      resultDiv.innerHTML += '<p>Local storage has also been cleared.</p>' +
          '<p>You should now <a href="/">reload the app</a> and log in again.</p></div>';
    });
  </script>
</body>
</html>
`;

// Create a server to serve the cookie clearing page
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Only respond to the root path
  if (parsedUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Find an available port, starting with 3001 (to avoid conflicts with app on 3000)
function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🍪 Cookie clearing server started at http://localhost:${port}`);
    console.log('Open this URL in your browser to clear app cookies\n');
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