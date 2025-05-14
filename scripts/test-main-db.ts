import { getDb } from '../src/services/db.server';

console.log('Testing main database initialization...');

try {
  // Test getting the database connection
  const db = getDb();
  console.log('✓ Database connection established');
  
  // Test if migrations ran successfully
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('✓ Tables found:', tables.map((t: any) => t.name).join(', '));
  
  // Check if documents table has requirementId column
  const columns = db.prepare("PRAGMA table_info(documents)").all();
  const hasRequirementId = columns.some((col: any) => col.name === 'requirementId');
  console.log(`✓ Documents table has requirementId: ${hasRequirementId}`);
  
  // Check if AI tables exist
  const aiTables = tables.filter((t: any) => t.name.startsWith('ai_'));
  console.log('✓ AI tables:', aiTables.map((t: any) => t.name).join(', '));
  
  console.log('\nMain database initialization test complete!');
} catch (error) {
  console.error('Main database test failed:', error);
  process.exit(1);
}