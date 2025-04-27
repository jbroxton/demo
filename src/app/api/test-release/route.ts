import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/services/db.server';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Query the releases table
    const releases = db.prepare('SELECT * FROM releases').all();
    
    // Query the releases_state table
    const releaseState = db.prepare('SELECT * FROM releases_state').all();
    
    // Check if index exists
    const indexInfo = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name='idx_releases_featureId'
    `).get();
    
    return NextResponse.json({ 
      success: true,
      data: {
        releases,
        releaseState,
        indexExists: Boolean(indexInfo)
      }
    });
  } catch (error) {
    console.error('Error testing releases:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, releaseDate, priority, featureId } = body;
    
    if (!name || !releaseDate || !priority || !featureId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const db = getDb();
    const id = Math.random().toString(36).substring(2, 9);
    
    // Insert directly into the releases table for testing
    const stmt = db.prepare(`
      INSERT INTO releases (id, name, description, releaseDate, priority, featureId)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, name, description || '', releaseDate, priority, featureId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test release created successfully',
      id
    });
  } catch (error) {
    console.error('Error creating test release:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 