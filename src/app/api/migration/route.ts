import { NextRequest, NextResponse } from 'next/server';
import { runMigrations } from '@/services/db-migration';

// POST handler for running migrations
export async function POST(request: NextRequest) {
  try {
    const result = await runMigrations();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling migration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET handler for checking migration status
export async function GET() {
  return NextResponse.json({ status: 'Migration endpoint is operational' });
} 