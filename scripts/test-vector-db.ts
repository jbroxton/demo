import Database from 'better-sqlite3';
import * as path from 'path';

async function testVectorDatabase() {
  try {
    // Open the database
    const dbPath = path.join(process.cwd(), 'specky.db');
    const db = new Database(dbPath);
    
    // Disable foreign keys for this test
    db.exec('PRAGMA foreign_keys = OFF;');
    
    // Load sqlite-vec
    const sqliteVec = require('sqlite-vec');
    sqliteVec.load(db);
    
    console.log('Testing vector database operations...');
    
    // Create a test embedding (1536 dimensions)
    const embedding = new Float32Array(1536);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = Math.random();
    }
    
    // Insert vector - convert to Buffer (rowid is auto-generated)
    const stmt = db.prepare(`INSERT INTO ai_vectors (embedding) VALUES (?)`);
    const result = stmt.run(Buffer.from(embedding.buffer));
    const vectorRowId = result.lastInsertRowid;
    console.log('✓ Vector inserted successfully with rowid:', vectorRowId);
    
    // Insert metadata
    const metaStmt = db.prepare(`INSERT INTO ai_vectors_metadata (rowid, tenant_id) VALUES (?, ?)`);
    metaStmt.run(vectorRowId, 'default');
    console.log('✓ Vector metadata inserted successfully');
    
    // Query vector
    const queryEmbed = new Float32Array(1536);
    queryEmbed.fill(0.5);
    
    const results = db.prepare(`
      SELECT vm.rowid, vm.tenant_id, vec_distance_l2(v.embedding, ?) as distance
      FROM ai_vectors v
      JOIN ai_vectors_metadata vm ON v.rowid = vm.rowid
      WHERE vm.tenant_id = ?
      LIMIT 1
    `).all(Buffer.from(queryEmbed.buffer), 'default');
    
    console.log('✓ Vector query successful:', results);
    
    db.close();
    console.log('\nVector database test complete!');
  } catch (error) {
    console.error('Vector database test failed:', error);
    process.exit(1);
  }
}

testVectorDatabase();