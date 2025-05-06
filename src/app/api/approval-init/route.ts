import { NextRequest, NextResponse } from 'next/server';
import { initializeApprovalSystem } from '@/services/approval-init';
import { getDb } from '@/services/db.server';
import { nanoid } from 'nanoid';

/**
 * API route to initialize the approval system
 */
export async function GET(req: NextRequest) {
  try {
    // First try the regular initialization
    const result = await initializeApprovalSystem();
    
    // If it fails, try direct DB initialization
    if (!result.success) {
      console.log('Regular initialization failed, attempting direct DB initialization...');
      const directResult = await initializeDirectly();
      
      if (directResult.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Approval system initialized directly',
          method: 'direct',
          details: directResult
        });
      } else {
        return NextResponse.json(
          { 
            success: false, 
            regularError: result.error,
            directError: directResult.error 
          },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Approval system initialized successfully',
      method: 'regular',
      details: result
    });
  } catch (error) {
    console.error('Error initializing approval system:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Direct DB initialization as a fallback
 */
async function initializeDirectly() {
  try {
    const db = getDb();
    const now = new Date().toISOString();
    
    console.log('Creating approval_stages table directly...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS approval_stages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        order_num INTEGER NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    console.log('Creating approval_statuses table directly...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS approval_statuses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    console.log('Creating entity_approvals table directly...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS entity_approvals (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        status_id TEXT NOT NULL,
        approver TEXT,
        comments TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (stage_id) REFERENCES approval_stages(id),
        FOREIGN KEY (status_id) REFERENCES approval_statuses(id)
      )
    `);
    
    console.log('Creating indexes for entity_approvals...');
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_entity_approvals_entity
      ON entity_approvals(entity_id, entity_type)
    `);
    
    // Check if stages already exist
    const existingStages = db.prepare(`
      SELECT COUNT(*) as count FROM approval_stages
    `).get();
    
    if (existingStages.count === 0) {
      console.log('Inserting default stages...');
      
      // Main stages
      const mainStages = [
        { name: 'Product Definition', description: 'Initial product requirements and scope', type: 'main', order: 10 },
        { name: 'UX Design', description: 'User experience design and wireframes', type: 'main', order: 20 },
        { name: 'Research', description: 'User research, data analysis, and validation', type: 'main', order: 30 },
        { name: 'Engineering', description: 'Technical implementation and development', type: 'main', order: 40 },
        { name: 'QA', description: 'Quality assurance and testing', type: 'main', order: 50 }
      ];
      
      // Launch phases
      const launchStages = [
        { name: 'Internal Testing', description: 'Testing with internal users', type: 'launch', order: 10 },
        { name: 'Limited Release', description: 'Limited availability to select users', type: 'launch', order: 20 },
        { name: 'Partial Launch', description: 'Availability to specific market segments', type: 'launch', order: 30 },
        { name: 'Full Launch', description: 'Complete availability to all users', type: 'launch', order: 40 }
      ];
      
      const stageStmt = db.prepare(`
        INSERT INTO approval_stages 
        (id, name, description, order_num, type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      [...mainStages, ...launchStages].forEach(stage => {
        stageStmt.run(
          nanoid(),
          stage.name,
          stage.description,
          stage.order,
          stage.type,
          now,
          now
        );
      });
    }
    
    // Check if statuses already exist
    const existingStatuses = db.prepare(`
      SELECT COUNT(*) as count FROM approval_statuses
    `).get();
    
    if (existingStatuses.count === 0) {
      console.log('Inserting default statuses...');
      
      const defaultStatuses = [
        { name: 'Not Started', color: '#6c757d', description: 'Work has not yet begun' },
        { name: 'In Progress', color: '#007bff', description: 'Work is currently underway' },
        { name: 'Pending Approval', color: '#ffc107', description: 'Waiting for approval' },
        { name: 'Approved', color: '#28a745', description: 'Formally approved' },
        { name: 'Completed', color: '#20c997', description: 'Work is finished' },
        { name: 'Rejected', color: '#dc3545', description: 'Approval was denied' },
        { name: 'Blocked', color: '#fd7e14', description: 'Progress is blocked' },
        { name: 'Not Needed', color: '#6c757d', description: 'This stage is not required' }
      ];
      
      const statusStmt = db.prepare(`
        INSERT INTO approval_statuses 
        (id, name, color, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      defaultStatuses.forEach(status => {
        statusStmt.run(
          nanoid(),
          status.name,
          status.color,
          status.description,
          now,
          now
        );
      });
    }
    
    console.log('Direct initialization completed successfully');
    
    return {
      success: true,
      stagesCount: db.prepare('SELECT COUNT(*) as count FROM approval_stages').get().count,
      statusesCount: db.prepare('SELECT COUNT(*) as count FROM approval_statuses').get().count
    };
  } catch (error) {
    console.error('Error in direct initialization:', error);
    return {
      success: false,
      error: String(error)
    };
  }
}