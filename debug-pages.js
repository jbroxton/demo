// Debug script to check pages hierarchy
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPages() {
  console.log('=== DEBUGGING PAGES HIERARCHY ===');
  
  try {
    // Get all pages
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching pages:', error);
      return;
    }
    
    console.log(`Found ${pages?.length || 0} pages total`);
    
    if (!pages || pages.length === 0) {
      console.log('No pages found in database');
      return;
    }
    
    // Show all pages with their hierarchy info
    pages.forEach(page => {
      console.log(`\nPage: "${page.title}"`);
      console.log(`  ID: ${page.id}`);
      console.log(`  Type: ${page.type}`);
      console.log(`  Parent ID: ${page.parent_id || 'null (root)'}`);
      console.log(`  Tenant ID: ${page.tenant_id}`);
    });
    
    // Find parent-child relationships
    console.log('\n=== PARENT-CHILD RELATIONSHIPS ===');
    const rootPages = pages.filter(p => !p.parent_id);
    console.log(`Root pages: ${rootPages.length}`);
    
    rootPages.forEach(rootPage => {
      console.log(`\nRoot: "${rootPage.title}" (${rootPage.type})`);
      const children = pages.filter(p => p.parent_id === rootPage.id);
      console.log(`  Children: ${children.length}`);
      children.forEach(child => {
        console.log(`    - "${child.title}" (${child.type})`);
      });
    });
    
    // Check for orphaned children
    const orphanedChildren = pages.filter(p => {
      if (!p.parent_id) return false;
      return !pages.some(parent => parent.id === p.parent_id);
    });
    
    if (orphanedChildren.length > 0) {
      console.log('\n=== ORPHANED CHILDREN ===');
      orphanedChildren.forEach(orphan => {
        console.log(`Orphan: "${orphan.title}" (parent_id: ${orphan.parent_id})`);
      });
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugPages();