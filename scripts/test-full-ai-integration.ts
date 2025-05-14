import { initializeAITables, initializeVectorDatabase } from '../src/services/ai-db';
import { getDb } from '../src/services/db.server';

async function testFullIntegration() {
  try {
    console.log('Testing full AI integration...\n');
    
    // 1. Initialize AI tables using the service
    console.log('1. Initializing AI tables...');
    initializeAITables();
    console.log('✓ AI tables initialized');
    
    // 2. Initialize vector database
    console.log('\n2. Initializing vector database...');
    initializeVectorDatabase();
    console.log('✓ Vector database initialized');
    
    // 3. Get the shared database connection
    const db = getDb();
    
    // 4. Test complete workflow: document -> embedding -> search
    console.log('\n3. Testing complete AI workflow...');
    
    // Insert a product-like document
    const productId = 'prod-' + Date.now();
    const productContent = 'Advanced Project Management Tool with AI capabilities';
    const productEmbed = new Float32Array(1536);
    productEmbed.fill(0.8); // Simulated embedding
    
    // Store document
    db.prepare(`
      INSERT INTO ai_documents (id, content, metadata, tenant_id)
      VALUES (?, ?, ?, ?)
    `).run(productId, productContent, JSON.stringify({type: 'product', id: productId}), 'default');
    console.log('✓ Product document stored');
    
    // Store embedding
    const vectorResult = db.prepare(`INSERT INTO ai_vectors (embedding) VALUES (?)`).run(Buffer.from(productEmbed.buffer));
    const vectorId = vectorResult.lastInsertRowid;
    
    // Store metadata
    db.exec('PRAGMA foreign_keys = OFF;');
    db.prepare(`INSERT INTO ai_vectors_metadata (rowid, tenant_id) VALUES (?, ?)`).run(vectorId, 'default');
    db.exec('PRAGMA foreign_keys = ON;');
    console.log('✓ Product embedding stored');
    
    // Create a query embedding (similar to product)
    const queryEmbed = new Float32Array(1536);
    queryEmbed.fill(0.75); // Similar to product embedding
    
    // Search for similar items
    const searchResults = db.prepare(`
      SELECT 
        d.content,
        d.metadata,
        vec_distance_l2(v.embedding, ?) as distance
      FROM ai_vectors v
      JOIN ai_vectors_metadata vm ON v.rowid = vm.rowid
      JOIN ai_documents d ON v.rowid = CAST(SUBSTR(d.id, 6) AS INTEGER)
      WHERE vm.tenant_id = ?
      ORDER BY distance
      LIMIT 3
    `).all(Buffer.from(queryEmbed.buffer), 'default');
    
    console.log('✓ Search completed, found:', searchResults.length, 'results');
    
    // Test session tracking
    const sessionId = 'session-' + Date.now();
    db.prepare(`
      INSERT INTO ai_sessions (id, user_id, tenant_id)
      VALUES (?, ?, ?)
    `).run(sessionId, 'test-user', 'default');
    console.log('✓ Session tracked');
    
    // Verify all tables are working
    const aiDocCount = db.prepare('SELECT COUNT(*) as count FROM ai_documents').get() as { count: number };
    const aiSessionCount = db.prepare('SELECT COUNT(*) as count FROM ai_sessions').get() as { count: number };
    const vectorCount = db.prepare('SELECT COUNT(*) as count FROM ai_vectors').get() as { count: number };
    
    console.log('\n4. Final verification:');
    console.log(`   AI Documents: ${aiDocCount.count}`);
    console.log(`   AI Sessions: ${aiSessionCount.count}`);
    console.log(`   Vectors: ${vectorCount.count}`);
    
    console.log('\nFull AI integration test complete! ✅');
  } catch (error) {
    console.error('Full integration test failed:', error);
    process.exit(1);
  }
}

testFullIntegration();