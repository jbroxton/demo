-- Migration script to convert existing entities to pages/blocks model
-- This preserves all existing data while transitioning to Notion-style architecture

-- First, let's check if we have existing tables to migrate
DO $$
BEGIN
    -- Migrate Products to Project Pages
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
        INSERT INTO pages (id, type, title, workspace_id, properties, created_at, updated_at)
        SELECT 
            id,
            'project'::VARCHAR(20) as type,
            name as title,
            tenant_id as workspace_id,
            jsonb_build_object(
                'status', jsonb_build_object(
                    'type', 'select',
                    'select', jsonb_build_object(
                        'name', CASE 
                            WHEN is_saved THEN 'Active'
                            ELSE 'Planning'
                        END,
                        'color', CASE 
                            WHEN is_saved THEN 'green'
                            ELSE 'gray'
                        END
                    )
                ),
                'description', jsonb_build_object(
                    'type', 'text',
                    'rich_text', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'text',
                            'text', jsonb_build_object(
                                'content', COALESCE(description, '')
                            )
                        )
                    )
                )
            ) as properties,
            created_at,
            updated_at
        FROM products
        WHERE id NOT IN (SELECT id FROM pages WHERE type = 'project');
        
        RAISE NOTICE 'Migrated % products to project pages', 
            (SELECT COUNT(*) FROM products);
    END IF;

    -- Migrate Features to Feature Pages
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'features') THEN
        INSERT INTO pages (id, type, title, parent_id, workspace_id, properties, created_at, updated_at)
        SELECT 
            f.id,
            'feature'::VARCHAR(20) as type,
            f.name as title,
            f.interface_id as parent_id, -- Features are children of interfaces (now projects)
            f.tenant_id as workspace_id,
            jsonb_build_object(
                'priority', jsonb_build_object(
                    'type', 'select',
                    'select', jsonb_build_object(
                        'name', COALESCE(f.priority, 'Medium'),
                        'color', CASE 
                            WHEN f.priority = 'High' THEN 'red'
                            WHEN f.priority = 'Low' THEN 'green'
                            ELSE 'yellow'
                        END
                    )
                ),
                'status', jsonb_build_object(
                    'type', 'select',
                    'select', jsonb_build_object(
                        'name', CASE 
                            WHEN f.is_saved THEN 'Active'
                            ELSE 'Planning'
                        END,
                        'color', CASE 
                            WHEN f.is_saved THEN 'green'
                            ELSE 'gray'
                        END
                    )
                ),
                'description', jsonb_build_object(
                    'type', 'text',
                    'rich_text', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'text',
                            'text', jsonb_build_object(
                                'content', COALESCE(f.description, '')
                            )
                        )
                    )
                )
            ) as properties,
            f.created_at,
            f.updated_at
        FROM features f
        WHERE f.id NOT IN (SELECT id FROM pages WHERE type = 'feature');
        
        RAISE NOTICE 'Migrated % features to feature pages', 
            (SELECT COUNT(*) FROM features);
    END IF;

    -- Migrate Roadmaps to Roadmap Pages
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roadmaps') THEN
        INSERT INTO pages (id, type, title, workspace_id, properties, created_at, updated_at)
        SELECT 
            id,
            'roadmap'::VARCHAR(20) as type,
            name as title,
            tenant_id as workspace_id,
            jsonb_build_object(
                'description', jsonb_build_object(
                    'type', 'text',
                    'rich_text', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'text',
                            'text', jsonb_build_object(
                                'content', COALESCE(description, '')
                            )
                        )
                    )
                ),
                'is_default', jsonb_build_object(
                    'type', 'select',
                    'select', jsonb_build_object(
                        'name', CASE 
                            WHEN is_default THEN 'Default'
                            ELSE 'Custom'
                        END,
                        'color', CASE 
                            WHEN is_default THEN 'blue'
                            ELSE 'gray'
                        END
                    )
                )
            ) as properties,
            created_at,
            updated_at
        FROM roadmaps
        WHERE id NOT IN (SELECT id FROM pages WHERE type = 'roadmap');
        
        RAISE NOTICE 'Migrated % roadmaps to roadmap pages', 
            (SELECT COUNT(*) FROM roadmaps);
    END IF;

    -- Migrate Releases to Release Pages
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'releases') THEN
        INSERT INTO pages (id, type, title, parent_id, workspace_id, properties, created_at, updated_at)
        SELECT 
            r.id,
            'release'::VARCHAR(20) as type,
            r.name as title,
            r.feature_id as parent_id, -- Releases are children of features
            COALESCE(f.tenant_id, '00000000-0000-0000-0000-000000000001') as workspace_id,
            jsonb_build_object(
                'priority', jsonb_build_object(
                    'type', 'select',
                    'select', jsonb_build_object(
                        'name', COALESCE(r.priority, 'Medium'),
                        'color', CASE 
                            WHEN r.priority = 'High' THEN 'red'
                            WHEN r.priority = 'Low' THEN 'green'
                            ELSE 'yellow'
                        END
                    )
                ),
                'release_date', jsonb_build_object(
                    'type', 'date',
                    'date', CASE 
                        WHEN r.release_date IS NOT NULL THEN 
                            jsonb_build_object(
                                'start', r.release_date::text,
                                'end', null
                            )
                        ELSE null
                    END
                ),
                'description', jsonb_build_object(
                    'type', 'text',
                    'rich_text', jsonb_build_array(
                        jsonb_build_object(
                            'type', 'text',
                            'text', jsonb_build_object(
                                'content', COALESCE(r.description, '')
                            )
                        )
                    )
                )
            ) as properties,
            r.created_at,
            r.updated_at
        FROM releases r
        LEFT JOIN features f ON f.id = r.feature_id
        WHERE r.id NOT IN (SELECT id FROM pages WHERE type = 'release');
        
        RAISE NOTICE 'Migrated % releases to release pages', 
            (SELECT COUNT(*) FROM releases);
    END IF;

    -- Migrate Requirements to Requirement Blocks
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'requirements') THEN
        INSERT INTO blocks (type, parent_id, parent_type, position, content, created_at, updated_at)
        SELECT 
            'requirement'::VARCHAR(50) as type,
            feature_id as parent_id,
            'page'::VARCHAR(10) as parent_type,
            ROW_NUMBER() OVER (PARTITION BY feature_id ORDER BY created_at) as position,
            jsonb_build_object(
                'name', name,
                'priority', COALESCE(priority, 'Medium'),
                'owner', COALESCE(owner, ''),
                'cuj', COALESCE(cuj, ''),
                'status', CASE 
                    WHEN is_saved THEN 'Complete'
                    ELSE 'Draft'
                END,
                'description', COALESCE(description, '')
            ) as content,
            created_at,
            updated_at
        FROM requirements
        WHERE feature_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM blocks 
            WHERE type = 'requirement' 
            AND content->>'name' = requirements.name 
            AND parent_id = requirements.feature_id
        );
        
        RAISE NOTICE 'Migrated % requirements to requirement blocks', 
            (SELECT COUNT(*) FROM requirements WHERE feature_id IS NOT NULL);
    END IF;

    -- Migrate Documents to Content Blocks
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        -- Convert documents to paragraph blocks within their parent pages
        INSERT INTO blocks (type, parent_id, parent_type, position, content, created_at, updated_at)
        SELECT 
            'paragraph'::VARCHAR(50) as type,
            COALESCE(d.feature_id, d.requirement_id) as parent_id,
            'page'::VARCHAR(10) as parent_type,
            COALESCE(
                (SELECT MAX(position) FROM blocks WHERE parent_id = COALESCE(d.feature_id, d.requirement_id)),
                0
            ) + ROW_NUMBER() OVER (PARTITION BY COALESCE(d.feature_id, d.requirement_id) ORDER BY d.created_at) as position,
            jsonb_build_object(
                'rich_text', jsonb_build_array(
                    jsonb_build_object(
                        'type', 'text',
                        'text', jsonb_build_object(
                            'content', COALESCE(d.title, 'Document Content')
                        )
                    )
                ),
                'document_content', d.content,
                'migrated_from_document', true
            ) as content,
            d.created_at,
            d.updated_at
        FROM documents d
        WHERE (d.feature_id IS NOT NULL OR d.requirement_id IS NOT NULL)
        AND NOT EXISTS (
            SELECT 1 FROM blocks 
            WHERE content->>'migrated_from_document' = 'true'
            AND parent_id = COALESCE(d.feature_id, d.requirement_id)
            AND content->'rich_text'->0->'text'->>'content' = COALESCE(d.title, 'Document Content')
        );
        
        RAISE NOTICE 'Migrated % documents to content blocks', 
            (SELECT COUNT(*) FROM documents WHERE feature_id IS NOT NULL OR requirement_id IS NOT NULL);
    END IF;

    -- Update page relations based on existing relationships
    -- Link features to roadmaps if we have roadmap_features table
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'roadmap_features') THEN
        UPDATE pages 
        SET properties = properties || jsonb_build_object(
            'roadmap', jsonb_build_object(
                'type', 'relation',
                'relation', jsonb_build_array(
                    jsonb_build_object('id', rf.roadmap_id)
                )
            )
        )
        FROM roadmap_features rf
        WHERE pages.id = rf.feature_id 
        AND pages.type = 'feature'
        AND NOT (properties ? 'roadmap');
        
        RAISE NOTICE 'Updated feature-roadmap relations';
    END IF;

END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_pages_migrated_type ON pages(type) WHERE type IN ('project', 'feature', 'roadmap', 'release');
CREATE INDEX IF NOT EXISTS idx_blocks_migrated_requirement ON blocks(type) WHERE type = 'requirement';

-- Add comments for tracking
COMMENT ON TABLE pages IS 'Unified page storage following Notion model - includes migrated data from products, features, roadmaps, releases';
COMMENT ON TABLE blocks IS 'Content blocks within pages - includes migrated requirements and documents';

-- Summary query to show migration results
DO $$
DECLARE
    project_count INTEGER;
    feature_count INTEGER;
    roadmap_count INTEGER;
    release_count INTEGER;
    requirement_count INTEGER;
    document_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO project_count FROM pages WHERE type = 'project';
    SELECT COUNT(*) INTO feature_count FROM pages WHERE type = 'feature';
    SELECT COUNT(*) INTO roadmap_count FROM pages WHERE type = 'roadmap';
    SELECT COUNT(*) INTO release_count FROM pages WHERE type = 'release';
    SELECT COUNT(*) INTO requirement_count FROM blocks WHERE type = 'requirement';
    SELECT COUNT(*) INTO document_count FROM blocks WHERE content ? 'migrated_from_document';
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '- Project pages: %', project_count;
    RAISE NOTICE '- Feature pages: %', feature_count;
    RAISE NOTICE '- Roadmap pages: %', roadmap_count;
    RAISE NOTICE '- Release pages: %', release_count;
    RAISE NOTICE '- Requirement blocks: %', requirement_count;
    RAISE NOTICE '- Document blocks: %', document_count;
END $$;