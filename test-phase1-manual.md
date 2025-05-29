# Phase 1 Manual Testing Guide

## Prerequisites
1. Make sure the dev server is running on port 3001
2. Make sure Supabase is running locally

## Step 1: Authenticate
1. Open browser to http://localhost:3001
2. Sign in with credentials:
   - Email: `pm1@test.com`
   - Password: `password`
3. Once signed in, open browser dev tools (F12)
4. Go to Application > Cookies (Chrome) or Storage > Cookies (Firefox)
5. Find the `next-auth.session-token` cookie
6. Copy the entire cookie value

## Step 2: Test the Pages API

### Test 1: Create a Project Page
```bash
curl -X POST "http://localhost:3001/api/pages-db" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_COOKIE_VALUE_HERE" \
  -d '{
    "type": "project",
    "title": "Authentication Platform",
    "properties": {
      "status": { "type": "select", "select": { "name": "Active", "color": "green" } },
      "priority": { "type": "select", "select": { "name": "High", "color": "red" } }
    },
    "blocks": [
      {
        "type": "document",
        "content": {
          "tiptap_content": {
            "type": "doc",
            "content": [
              {
                "type": "paragraph",
                "content": [
                  { "type": "text", "text": "Core authentication platform for the company." }
                ]
              }
            ]
          },
          "word_count": 8
        }
      }
    ]
  }'
```

### Test 2: Get All Pages
```bash
curl -X GET "http://localhost:3001/api/pages-db" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_COOKIE_VALUE_HERE"
```

### Test 3: Create a Feature Page (Child of Project)
Replace `PROJECT_ID` with the ID from Test 1:
```bash
curl -X POST "http://localhost:3001/api/pages-db" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_COOKIE_VALUE_HERE" \
  -d '{
    "type": "feature",
    "title": "User Authentication",
    "parent_id": "PROJECT_ID",
    "properties": {
      "priority": { "type": "select", "select": { "name": "High", "color": "red" } },
      "status": { "type": "select", "select": { "name": "In Progress", "color": "blue" } }
    },
    "blocks": [
      {
        "type": "requirement",
        "content": {
          "name": "Secure Login Flow",
          "priority": "High",
          "owner": "PM User",
          "cuj": "As a user, I want to securely log into the platform using my email and password",
          "status": "In Progress"
        }
      }
    ]
  }'
```

### Test 4: Query Child Pages
Replace `PROJECT_ID` with the ID from Test 1:
```bash
curl -X GET "http://localhost:3001/api/pages-db?parent_id=PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_COOKIE_VALUE_HERE"
```

## Expected Results

### Test 1 Success Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "type": "project", 
    "title": "Authentication Platform",
    "tenant_id": "22222222-2222-2222-2222-222222222222",
    "properties": { ... },
    "blocks": [ ... ],
    "block_count": 1,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### Test 2 Success Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "type": "project",
      "title": "Authentication Platform",
      "tenant_id": "22222222-2222-2222-2222-222222222222",
      "block_count": 1,
      ...
    }
  ]
}
```

## Validation Checklist

- [ ] Test 1: Project page created successfully with correct tenant_id
- [ ] Test 2: Can retrieve pages for authenticated user  
- [ ] Test 3: Feature page created as child of project
- [ ] Test 4: Can query child pages by parent_id
- [ ] Blocks are stored in JSONB array with proper structure
- [ ] Properties follow Notion property value format
- [ ] Tenant isolation is working (only see your own pages)
- [ ] Block count is automatically calculated
- [ ] Timestamps are properly set

## Troubleshooting

### 401/302 Response
- Cookie expired or invalid
- Re-authenticate and get fresh cookie

### 400 Error
- Check request body JSON format
- Ensure required fields (type, title) are present
- Verify property value structures

### 500 Error  
- Check server logs
- Ensure Supabase is running
- Verify database migration was applied

## Next Steps
Once all tests pass, we're ready for **Phase 2: Complete CRUD Operations**