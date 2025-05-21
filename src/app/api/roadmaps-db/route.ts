import { NextRequest } from 'next/server';
import {
  getRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getFeaturesForRoadmap,
  getFeaturesForRoadmapWithStatus,
  addFeatureToRoadmap,
  removeFeatureFromRoadmap,
  markRoadmapAsSavedInDb
} from '@/services/roadmaps-db';
import { z } from 'zod';
import { apiResponse } from '@/utils/api-response';
import { validateRequired } from '@/utils/api-validate';
import { authenticatedHandler } from '@/utils/api-authenticated-handler';

// GET handler
export const GET = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  console.log('[ROADMAPS API] GET request with tenantId:', tenantId);
  
  const id = searchParams.get('id');
  const roadmapId = searchParams.get('roadmapId');
  const includeFeatures = searchParams.get('includeFeatures') === 'true';
  const status = searchParams.get('status');

  // Get specific roadmap by ID
  if (id) {
    const result = await getRoadmapById(id, tenantId);

    if (!result.success) {
      return apiResponse.error(result.error!, 404);
    }

    return apiResponse.success(result.data);
  }

  // Get features for a specific roadmap
  if (roadmapId && includeFeatures) {
    // Get features with optional status filtering
    const featuresResult = status
      ? await getFeaturesForRoadmapWithStatus(roadmapId, tenantId, status)
      : await getFeaturesForRoadmapWithStatus(roadmapId, tenantId);

    if (!featuresResult.success) {
      return apiResponse.error(featuresResult.error!);
    }

    return apiResponse.success(featuresResult.data);
  }

  // Default: get all roadmaps
  console.log('[ROADMAPS API] Fetching all roadmaps for tenant:', tenantId);
  const result = await getRoadmaps(tenantId);
  
  console.log('[ROADMAPS API] Got roadmaps result:', {
    success: result.success,
    count: result.data ? result.data.length : 0,
    error: result.error
  });

  if (!result.success) {
    return apiResponse.error(result.error!);
  }

  return apiResponse.success(result.data);
});

// POST handler
export const POST = authenticatedHandler(async (request, { tenantId, body }) => {
  console.log('Received roadmap creation request:', JSON.stringify(body, null, 2));

  // Validate input - more permissive schema with precoerce
  const schema = z.preprocess(
    (data: unknown) => {
      // Type-safe access to possibly unknown data
      const inputData = data as Record<string, unknown>;
      return {
        name: typeof inputData.name === 'string' ? inputData.name : '',
        description: typeof inputData.description === 'string' ? inputData.description : '',
        is_default: typeof inputData.is_default === 'boolean' ? inputData.is_default : false
      };
    },
    z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      is_default: z.boolean().optional()
    })
  );

  const result = schema.safeParse(body);

  if (!result.success) {
    console.error('Validation error for roadmap creation:', result.error.format());
    return apiResponse.error(JSON.stringify(result.error.format()), 400);
  }

  const createResult = await createRoadmap(result.data, tenantId);

  if (!createResult.success) {
    return apiResponse.error(createResult.error!);
  }

  // Ensure the data has the right format for the client
  const responseData = {
    id: createResult.id,
    name: result.data.name,
    description: result.data.description || '',
    is_default: result.data.is_default ? 1 : 0,
    tenantId: tenantId,
    created_at: createResult.data?.created_at || new Date().toISOString(),
    updated_at: createResult.data?.updated_at || new Date().toISOString()
  };

  return apiResponse.success(responseData, 201);
});

// PATCH handler
export const PATCH = authenticatedHandler(async (request, { tenantId, body }) => {
  const validationError = validateRequired(body, ['id']);
  if (validationError) {
    return apiResponse.error(validationError, 400);
  }

  // Handle marking as saved
  if (body.markAsSaved === true) {
    const result = await markRoadmapAsSavedInDb(body.id, tenantId);
    
    if (!result.success) {
      return apiResponse.error(result.error || 'Failed to mark roadmap as saved', 500);
    }
    
    return apiResponse.success({ 
      success: true, 
      id: body.id,
      savedAt: new Date().toISOString()
    });
  }

  // Handle feature-roadmap relationship actions
  if (body.action) {
    // Add feature to roadmap
    if (body.action === 'add' && body.roadmapId) {
      const result = await addFeatureToRoadmap(body.id, body.roadmapId, tenantId);

      if (!result.success) {
        return apiResponse.error(result.error!);
      }

      return apiResponse.success({ success: true });
    }

    // Remove feature from roadmap
    if (body.action === 'remove') {
      const result = await removeFeatureFromRoadmap(body.id, tenantId);

      if (!result.success) {
        return apiResponse.error(result.error!);
      }

      return apiResponse.success({ success: true });
    }

    return apiResponse.error('Invalid action', 400);
  }

  // Handle roadmap updates
  const updateData: Record<string, any> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.is_default !== undefined) updateData.is_default = body.is_default;

  if (Object.keys(updateData).length === 0) {
    return apiResponse.error('No update data provided', 400);
  }

  const updateResult = await updateRoadmap(body.id, updateData, tenantId);

  if (!updateResult.success) {
    const status = updateResult.error === 'Roadmap not found' ? 404 : 500;
    return apiResponse.error(updateResult.error!, status);
  }

  return apiResponse.success({ success: true });
});

// DELETE handler
export const DELETE = authenticatedHandler(async (request, { tenantId, searchParams }) => {
  const id = searchParams.get('id');

  if (!id) {
    return apiResponse.error('Roadmap ID is required', 400);
  }

  const deleteResult = await deleteRoadmap(id, tenantId);

  if (!deleteResult.success) {
    const status = deleteResult.error === 'Roadmap not found' ? 404 : 400;
    return apiResponse.error(deleteResult.error!, status);
  }

  return apiResponse.success({ success: true });
});