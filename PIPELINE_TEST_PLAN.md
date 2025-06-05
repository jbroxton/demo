# 🧪 OpenAI Pipeline Test Plan

## Test the Updated Implementation with Best Practices

### 📋 **Pre-Test Status**
- ✅ Database cleared (no assistant record)
- ✅ Implementation updated with best practices:
  - Uses `openai.beta.vectorStores.create()`
  - Uses `openai.beta.vectorStores.fileBatches.uploadAndPoll()`
  - Creates assistant with vector store attached
  - Proper cleanup and error handling

### 🚀 **Test Steps**

#### Step 1: Start Development Server
```bash
npm run dev
```

#### Step 2: Login to Application
Navigate to: http://localhost:3000/signin
- **Email**: pm1@test.com
- **Password**: password

#### Step 3: Go to AI Chat
- Click on AI Chat in the navigation
- This should load the AI chat interface

#### Step 4: Trigger Pipeline
Ask this exact question:
```
How many features do I have?
```

**Alternative: Use Test Page**
- Open `test-ai-chat-authenticated.html` in browser
- Follow instructions to login first
- Click "Test Pipeline" button

#### Step 5: Watch for Pipeline Execution
The following should happen automatically:
1. `getOrCreateAssistant()` called
2. No assistant found → triggers `ensureTenantDataSynced()`
3. Pipeline executes:
   - Export pages data (126 features)
   - Upload file to OpenAI
   - Create vector store
   - Add file to vector store with polling
   - Create assistant with vector store attached
   - Update database

#### Step 6: Verify Response
Expected AI response should mention:
- **~126 features** (from pages API)
- NOT 8 features (legacy API)
- May reference finding information in uploaded files

### 🔍 **Verification Commands**

#### Check Pipeline Results
```bash
OPENAI_API_KEY=$OPENAI_API_KEY node verify-pipeline-results.js
```

#### Check Database
```bash
node check-current-openai-state.js
```

### ✅ **Success Criteria**

1. **Database Record Created**
   - New assistant ID stored
   - Recent `last_synced` timestamp
   - File IDs populated

2. **OpenAI Resources Created**
   - Assistant exists with correct name
   - Assistant has `file_search` tool
   - Vector store attached to assistant
   - Files uploaded and processed in vector store

3. **AI Response Quality**
   - Returns ~126 features (not 8)
   - May mention finding data in uploaded files
   - Demonstrates both function calling AND file search working

### 🎯 **Expected Results**

```
✅ PIPELINE VERIFICATION COMPLETE!

✅ SUCCESS INDICATORS:
   • Assistant created with best practices ✅
   • Vector store attached to assistant ✅
   • Files uploaded and processed ✅
   • Database properly updated ✅

🧪 TEST RESULT:
   🎯 FRESH PIPELINE RUN - Implementation working!
```

### 🔧 **Troubleshooting**

If the test fails:

1. **Check Console Logs**
   - Look for pipeline execution logs
   - Check for OpenAI API errors

2. **Verify Environment**
   - Ensure `OPENAI_API_KEY` is valid
   - Supabase should be running (`supabase start`)

3. **Check Database**
   - Verify tenant_id exists: `22222222-2222-2222-2222-222222222222`
   - Check pages data is available

4. **API Rate Limits**
   - OpenAI may have rate limits
   - Wait a few minutes and retry

### 📊 **Key Metrics to Verify**

- **Feature Count**: 126 (pages) vs 8 (legacy)
- **Pipeline Components**: File → Vector Store → Assistant
- **Attachment Method**: Best practices (SDK methods)
- **Processing**: Automatic polling and completion
- **Cleanup**: Old resources properly removed

---

## 🎉 Ready to Test!

The implementation has been updated with OpenAI's 2024 best practices. 
Run the test and verify that the new pipeline creates everything correctly!