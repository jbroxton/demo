-- Simple Embedding Backfill Function
-- Uses existing trigger system by updating features that need embeddings

CREATE OR REPLACE FUNCTION public.backfill_embeddings_via_triggers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  features_updated INTEGER;
BEGIN
  -- Update all features that don't have embeddings
  -- This will trigger the existing embedding system
  UPDATE features 
  SET updated_at = NOW() 
  WHERE id NOT IN (
    SELECT entity_id 
    FROM ai_embeddings 
    WHERE entity_type = 'feature'
  );
  
  -- Get count of updated features
  GET DIAGNOSTICS features_updated = ROW_COUNT;
  
  RAISE LOG 'Triggered embedding backfill for % features', features_updated;
  
  RETURN features_updated;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.backfill_embeddings_via_triggers() TO authenticated;