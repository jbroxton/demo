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
    
    // Special handling for releases to ensure fresh feature names
    if (storeName === 'releases' && result && result.value) {
      try {
        // Parse the state to get releases array
        const stateObj = JSON.parse(result.value);
        
        if (stateObj?.state?.releases && Array.isArray(stateObj.state.releases)) {
          // For each release, get the current feature name from the database
          const enhancedReleases = stateObj.state.releases.map((release: any) => {
            if (release.featureId) {
              // Use database query to get current feature name
              const feature = db.prepare('SELECT name FROM features WHERE id = ?')
                .get(release.featureId) as { name: string } | undefined;
              
              // Return release with fresh feature name
              return {
                ...release,
                _currentFeatureName: feature && feature.name ? feature.name : 'Unknown Feature'
              };
            }
            return release;
          });
          
          // Replace the releases in the state with enhanced data
          stateObj.state.releases = enhancedReleases;
          
          // Return the enhanced state
          return NextResponse.json({ value: JSON.stringify(stateObj) });
        }
      } catch (error) {
        console.error('Error enhancing releases with feature names:', error);
        // Continue with default behavior if enhancement fails
      }
    }
    
    // Special handling for requirements to ensure fresh feature and release names
    if (storeName === 'requirements' && result && result.value) {
      try {
        // Parse the state to get requirements array
        const stateObj = JSON.parse(result.value);
        
        if (stateObj?.state?.requirements && Array.isArray(stateObj.state.requirements)) {
          // For each requirement, get the current feature and release names from the database
          const enhancedRequirements = stateObj.state.requirements.map((requirement: any) => {
            const enhanced = { ...requirement };
            
            if (requirement.featureId) {
              // Get current feature name
              const feature = db.prepare('SELECT name FROM features WHERE id = ?')
                .get(requirement.featureId) as { name: string } | undefined;
              
              enhanced._currentFeatureName = feature && feature.name ? feature.name : 'Unknown Feature';
            }
            
            if (requirement.releaseId) {
              // Get current release name
              const release = db.prepare('SELECT name FROM releases WHERE id = ?')
                .get(requirement.releaseId) as { name: string } | undefined;
              
              enhanced._currentReleaseName = release && release.name ? release.name : 'Unknown Release';
            }
            
            return enhanced;
          });
          
          // Replace the requirements in the state with enhanced data
          stateObj.state.requirements = enhancedRequirements;
          
          // Return the enhanced state
          return NextResponse.json({ value: JSON.stringify(stateObj) });
        }
      } catch (error) {
        console.error('Error enhancing requirements with feature and release names:', error);
        // Continue with default behavior if enhancement fails
      }
    }
    
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