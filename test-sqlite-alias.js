const Database = require('better-sqlite3');
const path = require('path');

// Use the existing database
const db = new Database(path.join(process.cwd(), 'specky.db'));

console.log('Testing stage queries with different aliasing...');

// Test 1: Original query with unquoted alias
try {
  console.log('\nTesting unquoted alias:');
  const unquotedQuery = db.prepare(`
    SELECT 
      id, 
      name,
      description, 
      order_num as order, 
      type,
      created_at,
      updated_at 
    FROM approval_stages 
    LIMIT 3
  `);
  
  const unquotedResults = unquotedQuery.all();
  console.log('Results count:', unquotedResults.length);
  console.log('First result:', unquotedResults[0] || 'No results');
  console.log('Has order property:', unquotedResults[0] && 'order' in unquotedResults[0]);
} catch (err) {
  console.error('Error with unquoted query:', err.message);
}

// Test 2: Fixed query with quoted alias
try {
  console.log('\nTesting quoted alias:');
  const quotedQuery = db.prepare(`
    SELECT 
      id, 
      name,
      description, 
      order_num as "order", 
      type,
      created_at,
      updated_at 
    FROM approval_stages 
    LIMIT 3
  `);
  
  const quotedResults = quotedQuery.all();
  console.log('Results count:', quotedResults.length);
  console.log('First result:', quotedResults[0] || 'No results');
  console.log('Has order property:', quotedResults[0] && 'order' in quotedResults[0]);
} catch (err) {
  console.error('Error with quoted query:', err.message);
}

// Test 3: Direct column access
try {
  console.log('\nTesting direct column access without alias:');
  const directQuery = db.prepare(`
    SELECT 
      id, 
      name,
      description, 
      order_num, 
      type,
      created_at,
      updated_at 
    FROM approval_stages 
    LIMIT 3
  `);
  
  const directResults = directQuery.all();
  console.log('Results count:', directResults.length);
  console.log('First result:', directResults[0] || 'No results');
  console.log('Has order_num property:', directResults[0] && 'order_num' in directResults[0]);
} catch (err) {
  console.error('Error with direct query:', err.message);
}

// Test 4: Simple count query to verify table has data
try {
  console.log('\nChecking if table has rows:');
  const countQuery = db.prepare('SELECT COUNT(*) as count FROM approval_stages');
  const count = countQuery.get();
  console.log('Row count:', count?.count || 0);
} catch (err) {
  console.error('Error with count query:', err.message);
}