import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/services/db.server';

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    const storeName = request.nextUrl.searchParams.get('store');
    
    if (!key || !storeName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = getDb();
    
    // Create the table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${storeName}_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    const stmt = db.prepare(`SELECT value FROM ${storeName}_state WHERE key = ?`);
    const result = stmt.get(key) as { value: string } | undefined;
    
    return NextResponse.json({ value: result ? result.value : null });
  } catch (error) {
    console.error(`Error retrieving data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, store } = body;
    
    if (!key || !value || !store) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = getDb();
    
    // Create the table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${store}_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    const stmt = db.prepare(`
      INSERT INTO ${store}_state (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error saving data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');
    const storeName = request.nextUrl.searchParams.get('store');
    
    if (!key || !storeName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = getDb();
    
    const stmt = db.prepare(`DELETE FROM ${storeName}_state WHERE key = ?`);
    stmt.run(key);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error removing data:`, error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
} 