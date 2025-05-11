/**
 * API route for migrating roadmap feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { migrateRoadmapFeature } from '@/services/db-migration-roadmap';

// GET handler for running the roadmap migration
export async function GET(request: NextRequest) {
  try {
    const result = await migrateRoadmapFeature();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Roadmap feature migration completed successfully'
    });
  } catch (error) {
    console.error('Error during roadmap migration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}