import { getDb } from '../src/services/db.server';

async function testVectorWithMainDb() {
  try {
    console.log('Testing vector operations with main database...');
    
    // Get the shared database connection
    const db = getDb();
    
    // Load sqlite-vec
    const sqliteVec = require('sqlite-vec');
    sqliteVec.load(db);
    
    // Create a test embedding
    const embedding = new Float32Array(1536);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.random();
    }
    
    // Insert vector
    const stmt = db.prepare(`INSERT INTO ai_vectors (embedding) VALUES (?)`);
    const result = stmt.run(Buffer.from(embedding.buffer));
    const vectorRowId = result.lastInsertRowid;
    console.log('✓ Vector inserted with rowid:', vectorRowId);
    
    // Insert metadata (with FK disabled for virtual table)
    db.exec('PRAGMA foreign_keys = OFF;');
    const metaStmt = db.prepare(`INSERT INTO ai_vectors_metadata (rowid, tenant_id) VALUES (?, ?)`);
    metaStmt.run(vectorRowId, 'test-tenant');
    db.exec('PRAGMA foreign_keys = ON;');
    console.log('✓ Vector metadata inserted');
    
    // Test vector similarity search
    const queryEmbed = new Float32Array(1536);
    queryEmbed.fill(0.5);
    
    const results = db.prepare(`
      SELECT vm.rowid, vm.tenant_id, vec_distance_l2(v.embedding, ?) as distance
      FROM ai_vectors v
      JOIN ai_vectors_metadata vm ON v.rowid = vm.rowid
      WHERE vm.tenant_id = ?
      LIMIT 1
    `).all(Buffer.from(queryEmbed.buffer), 'test-tenant');
    
    console.log('✓ Vector query successful, found:', results.length, 'results');
    if (results.length > 0) {
      console.log('  Distance:', (results[0] as any).distance);
    }
    
    // Test AI document insertion
    const docStmt = db.prepare(`
      INSERT INTO ai_documents (id, content, metadata, tenant_id)
      VALUES (?, ?, ?, ?)
    `);
    docStmt.run('test-doc-1', 'Test document content', '{"type": "test"}', 'test-tenant');
    console.log('✓ AI document inserted');
    
    // Verify AI document
    const docs = db.prepare(`SELECT * FROM ai_documents WHERE tenant_id = ?`).all('test-tenant');
    console.log('✓ AI documents found:', docs.length);
    
    console.log('\nVector operations with main DB test complete!');
  } catch (error) {
    console.error('Vector test failed:', error);
    process.exit(1);
  }
}

testVectorWithMainDb();