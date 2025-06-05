import type { 
  AgentOperationResult,
  CreateProductParams,
  UpdateProductParams,
  CreateFeatureParams,
  UpdateFeatureParams,
  CreateRequirementParams,
  UpdateRequirementParams,
  CreateReleaseParams,
  UpdateReleaseParams,
  CreateRoadmapParams,
  UpdateRoadmapParams
} from '@/types/models/ai-chat';
import type { Page } from '@/types/models';
import { 
  createAgentError, 
  AgentErrorType, 
  AgentErrorSeverity,
  safeAgentOperation 
} from '@/lib/agent-error-handling';

// Import pages service for modern entity management
import { 
  getPages,
  createPage,
  updatePage,
  deletePage
} from './pages-db';
import type { TextPropertyValue } from '@/types/models/Page';

// Helper function to create text property values
function createTextProperty(content: string): TextPropertyValue {
  return {
    type: 'text',
    rich_text: [{
      type: 'text',
      text: {
        content: content || ''
      }
    }]
  };
}

// Helper function to extract text content from property values
function getTextContent(property: unknown): string {
  if (property && typeof property === 'object' && property !== null) {
    const textProp = property as { type?: string; rich_text?: Array<{ text?: { content?: string } }> };
    if (textProp.type === 'text' && textProp.rich_text && textProp.rich_text[0]) {
      return textProp.rich_text[0].text?.content || '';
    }
  }
  return '';
}


/**
 * Agent operations service that handles actual CRUD operations
 * with proper error handling and validation
 */
export class AgentOperationsService {
  /**
   * Product Operations
   */
  async createProduct(
    params: CreateProductParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'project',
          properties: {
            description: createTextProperty(params.description || '')
          },
          blocks: [],
          tenant_id: tenantId
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create product');
        }

        return result.data!;
      },
      {
        operationName: 'createProduct',
        entityType: 'product'
      }
    );
  }

  async updateProduct(
    productId: string,
    params: UpdateProductParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        if (params.description !== undefined) {
          updateData.properties = {
            description: createTextProperty(params.description)
          };
        }

        const result = await updatePage(productId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update product');
        }

        return result.data!;
      },
      {
        operationName: 'updateProduct',
        entityType: 'product'
      }
    );
  }

  async deleteProduct(
    productId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deletePage(productId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete product');
        }

        return true;
      },
      {
        operationName: 'deleteProduct',
        entityType: 'product'
      }
    );
  }

  async getProduct(
    productId: string,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'project' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to get product');
        }

        const page = result.data?.find(p => p.id === productId);
        if (!page) {
          throw new Error('Product not found');
        }

        return page;
      },
      {
        operationName: 'getProduct',
        entityType: 'product'
      }
    );
  }

  /**
   * Feature Operations
   */
  async createFeature(
    params: CreateFeatureParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'feature',
          properties: {
            description: createTextProperty(params.description || ''),
            interfaceId: createTextProperty(params.interfaceId || ''),
            priority: createTextProperty(params.priority || '')
          },
          blocks: [],
          tenant_id: tenantId
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create feature');
        }

        return result.data!;
      },
      {
        operationName: 'createFeature',
        entityType: 'feature'
      }
    );
  }

  async updateFeature(
    featureId: string,
    params: UpdateFeatureParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        
        const properties: Record<string, TextPropertyValue> = {};
        if (params.description !== undefined) properties.description = createTextProperty(params.description);
        if (params.priority !== undefined) properties.priority = createTextProperty(params.priority);
        if (params.roadmapId !== undefined) properties.roadmapId = createTextProperty(params.roadmapId);
        
        if (Object.keys(properties).length > 0) {
          updateData.properties = properties;
        }

        const result = await updatePage(featureId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update feature');
        }

        return result.data!;
      },
      {
        operationName: 'updateFeature',
        entityType: 'feature'
      }
    );
  }

  async deleteFeature(
    featureId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deletePage(featureId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete feature');
        }

        return true;
      },
      {
        operationName: 'deleteFeature',
        entityType: 'feature'
      }
    );
  }


  /**
   * Release Operations
   */
  async createRelease(
    params: CreateReleaseParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'release',
          properties: {
            description: createTextProperty(params.description || ''),
            releaseDate: createTextProperty(params.releaseDate || ''),
            priority: createTextProperty(params.priority || ''),
            featureId: createTextProperty(params.featureId || '')
          },
          blocks: [],
          tenant_id: tenantId
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create release');
        }

        return result.data!;
      },
      {
        operationName: 'createRelease',
        entityType: 'release'
      }
    );
  }

  async updateRelease(
    releaseId: string,
    params: UpdateReleaseParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        
        const properties: Record<string, TextPropertyValue> = {};
        if (params.description !== undefined) properties.description = createTextProperty(params.description);
        if (params.releaseDate !== undefined) properties.releaseDate = createTextProperty(params.releaseDate);
        if (params.priority !== undefined) properties.priority = createTextProperty(params.priority);
        
        if (Object.keys(properties).length > 0) {
          updateData.properties = properties;
        }

        const result = await updatePage(releaseId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update release');
        }

        return result.data!;
      },
      {
        operationName: 'updateRelease',
        entityType: 'release'
      }
    );
  }

  async deleteRelease(
    releaseId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deletePage(releaseId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete release');
        }

        return true;
      },
      {
        operationName: 'deleteRelease',
        entityType: 'release'
      }
    );
  }

  /**
   * Roadmap Operations
   */
  async createRoadmap(
    params: CreateRoadmapParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'roadmap',
          properties: {
            description: createTextProperty(params.description || '')
          },
          blocks: [],
          tenant_id: tenantId
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create roadmap');
        }

        return result.data!;
      },
      {
        operationName: 'createRoadmap',
        entityType: 'roadmap'
      }
    );
  }

  async updateRoadmap(
    roadmapId: string,
    params: UpdateRoadmapParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        
        const properties: Record<string, TextPropertyValue> = {};
        if (params.description !== undefined) properties.description = createTextProperty(params.description);
        if (params.priority !== undefined) properties.priority = createTextProperty(params.priority);
        
        if (Object.keys(properties).length > 0) {
          updateData.properties = properties;
        }

        const result = await updatePage(roadmapId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update roadmap');
        }

        return result.data!;
      },
      {
        operationName: 'updateRoadmap',
        entityType: 'roadmap'
      }
    );
  }

  async deleteRoadmap(
    roadmapId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deletePage(roadmapId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete roadmap');
        }

        return true;
      },
      {
        operationName: 'deleteRoadmap',
        entityType: 'roadmap'
      }
    );
  }

  /**
   * List Operations for context gathering
   */
  async listProducts(tenantId: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'project' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list products');
        }

        return result.data || [];
      },
      {
        operationName: 'listProducts',
        entityType: 'product'
      }
    );
  }

  async listFeatures(tenantId: string, productId?: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({
          tenantId,
          type: 'feature'
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list features');
        }

        return result.data || [];
      },
      {
        operationName: 'listFeatures',
        entityType: 'feature'
      }
    );
  }


  async listReleases(tenantId: string, featureId?: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'release' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list releases');
        }

        let releases = result.data || [];

        // Filter by featureId if provided (check properties for featureId)
        if (featureId) {
          releases = releases.filter(page => 
            getTextContent(page.properties?.featureId) === featureId
          );
        }

        return releases;
      },
      {
        operationName: 'listReleases',
        entityType: 'release'
      }
    );
  }

  async listRoadmaps(tenantId: string, productId?: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'roadmap' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list roadmaps');
        }

        return result.data || [];
      },
      {
        operationName: 'listRoadmaps',
        entityType: 'roadmap'
      }
    );
  }

}

/**
 * Default service instance
 */
export const agentOperationsService = new AgentOperationsService();