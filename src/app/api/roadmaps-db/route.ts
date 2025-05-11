/**
 * @file src/app/api/roadmaps-db/route.ts
 * API route for roadmap operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import {
  getRoadmaps,
  getRoadmapById,
  createRoadmap,
  updateRoadmap,
  deleteRoadmap,
  getFeaturesForRoadmap,
  getFeaturesForRoadmapWithStatus,
  addFeatureToRoadmap,
  removeFeatureFromRoadmap
} from '@/services/roadmaps-db';
import { z } from 'zod';

// GET handler for roadmaps
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const tenantId = session?.user?.currentTenant || 'org1';
    const searchParams = request.nextUrl.searchParams;

    // Handle different GET operations based on query params
    const id = searchParams.get('id');
    const roadmapId = searchParams.get('roadmapId');
    const includeFeatures = searchParams.get('includeFeatures') === 'true';
    const status = searchParams.get('status');

    // Get specific roadmap by ID
    if (id) {
      const result = await getRoadmapById(id, tenantId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        );
      }

      return NextResponse.json(result.data);
    }

    // Get features for a specific roadmap
    if (roadmapId && includeFeatures) {
      // Get features with optional status filtering
      const featuresResult = status
        ? await getFeaturesForRoadmapWithStatus(roadmapId, tenantId, status)
        : await getFeaturesForRoadmapWithStatus(roadmapId, tenantId);

      if (!featuresResult.success) {
        return NextResponse.json(
          { error: featuresResult.error },
          { status: 500 }
        );
      }

      return NextResponse.json(featuresResult.data);
    }

    // Default: get all roadmaps
    const result = await getRoadmaps(tenantId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error handling GET request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler for creating roadmaps
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const tenantId = session?.user?.currentTenant || 'org1';

    const body = await request.json();

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
      return NextResponse.json(
        { error: result.error.format() },
        { status: 400 }
      );
    }

    const createResult = await createRoadmap(result.data, tenantId);

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 500 }
      );
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

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH handler for updating roadmaps or roadmap features
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    const tenantId = session?.user?.currentTenant || 'org1';

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Handle feature-roadmap relationship actions
    if (body.action) {
      // Add feature to roadmap
      if (body.action === 'add' && body.roadmapId) {
        const result = await addFeatureToRoadmap(body.id, body.roadmapId, tenantId);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      // Remove feature from roadmap
      if (body.action === 'remove') {
        const result = await removeFeatureFromRoadmap(body.id, tenantId);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle roadmap updates
    const updateData: Record<string, any> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_default !== undefined) updateData.is_default = body.is_default;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }

    const updateResult = await updateRoadmap(body.id, updateData, tenantId);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: updateResult.error === 'Roadmap not found' ? 404 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling PATCH request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing roadmaps
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    const tenantId = session?.user?.currentTenant || 'org1';

    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Roadmap ID is required' },
        { status: 400 }
      );
    }

    const deleteResult = await deleteRoadmap(id, tenantId);

    if (!deleteResult.success) {
      return NextResponse.json(
        { error: deleteResult.error },
        { status: deleteResult.error === 'Roadmap not found' ? 404 : 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling DELETE request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}