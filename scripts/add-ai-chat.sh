#!/bin/bash

# Script to add AI Chat feature to the existing Speqq project
echo "Adding AI Chat feature to Speqq..."

# 1. Install dependencies
echo "Installing AI Chat dependencies..."
npm install ai @ai-sdk/openai uuid sqlite-vec drizzle-orm drizzle-zod
npm install -D drizzle-kit

# 2. Update middleware (manual step)
echo "
Next manual step:
Add the following code to src/middleware.ts after line 60 (before the final return):

  // Handle AI Chat API routes - add tenant headers
  if (pathname.startsWith('/api/ai-chat')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', token.currentTenant || 'default');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
"

# 3. Setup environment
echo "
Add the following to your .env.local file:
OPENAI_API_KEY=your-openai-api-key-here
"

echo "AI Chat setup script complete!"
echo "Follow the manual steps above to complete the integration."