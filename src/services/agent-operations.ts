import type { 
  AgentOperationResult
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

// Page-specific parameter interfaces (replacing legacy entity params)
export interface CreateProductPageParams {
  name: string;
  description?: string;
}

export interface UpdateProductPageParams {
  id?: string;
  name?: string;
  description?: string;
}

export interface CreateFeaturePageParams {
  name: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  parentPageId?: string;
}

export interface UpdateFeaturePageParams {
  id?: string;
  name?: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  parentPageId?: string;
}

export interface CreateRequirementPageParams {
  name: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  owner?: string;
  parentPageId?: string;
}

export interface UpdateRequirementPageParams {
  id?: string;
  name?: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  owner?: string;
  parentPageId?: string;
}

export interface CreateReleasePageParams {
  name: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  parentPageId?: string;
  releaseDate?: string;
}

export interface UpdateReleasePageParams {
  id?: string;
  name?: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
  parentPageId?: string;
  releaseDate?: string;
}

export interface CreateRoadmapPageParams {
  name: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
}

export interface UpdateRoadmapPageParams {
  id?: string;
  name?: string;
  description?: string;
  priority?: 'High' | 'Med' | 'Low';
}

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
   * Product Page Operations (stored as pages with type='project')
   */
  async createProductPage(
    params: CreateProductPageParams,
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

  async updateProductPage(
    productId: string,
    params: UpdateProductPageParams,
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

  async deleteProductPage(
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

  async getProductPage(
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
   * Feature Page Operations (stored as pages with type='feature')
   */
  async createFeaturePage(
    params: CreateFeaturePageParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'feature',
          properties: {
            description: createTextProperty(params.description || ''),
            parentPageId: createTextProperty(params.parentPageId || ''),
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

  async updateFeaturePage(
    featureId: string,
    params: UpdateFeaturePageParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        
        const properties: Record<string, TextPropertyValue> = {};
        if (params.description !== undefined) properties.description = createTextProperty(params.description);
        if (params.priority !== undefined) properties.priority = createTextProperty(params.priority);
        if (params.parentPageId !== undefined) properties.parentPageId = createTextProperty(params.parentPageId);
        
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

  async deleteFeaturePage(
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
   * Requirements Page Operations (stored as pages with type='requirement')
   */
  async createRequirementsPage(
    params: CreateRequirementPageParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const result = await createPage({
          title: params.name,
          type: 'requirement',
          properties: {
            description: createTextProperty(params.description || ''),
            priority: createTextProperty(params.priority || ''),
            owner: createTextProperty(params.owner || ''),
            parentPageId: createTextProperty(params.parentPageId || '')
          },
          blocks: [],
          tenant_id: tenantId
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create requirement');
        }

        return result.data!;
      },
      {
        operationName: 'createRequirement',
        entityType: 'requirement'
      }
    );
  }

  async updateRequirementsPage(
    requirementId: string,
    params: UpdateRequirementPageParams,
    tenantId: string
  ): Promise<AgentOperationResult<Page>> {
    return safeAgentOperation(
      async () => {
        const updateData: { title?: string; properties?: Record<string, TextPropertyValue> } = {};
        if (params.name !== undefined) updateData.title = params.name;
        
        const properties: Record<string, TextPropertyValue> = {};
        if (params.description !== undefined) properties.description = createTextProperty(params.description);
        if (params.priority !== undefined) properties.priority = createTextProperty(params.priority);
        if (params.owner !== undefined) properties.owner = createTextProperty(params.owner);
        
        if (Object.keys(properties).length > 0) {
          updateData.properties = properties;
        }

        const result = await updatePage(requirementId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update requirement');
        }

        return result.data!;
      },
      {
        operationName: 'updateRequirement',
        entityType: 'requirement'
      }
    );
  }

  async deleteRequirementsPage(
    requirementId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deletePage(requirementId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to delete requirement');
        }

        return true;
      },
      {
        operationName: 'deleteRequirement',
        entityType: 'requirement'
      }
    );
  }

  async listRequirementsPages(tenantId: string, featureId?: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'requirement' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list requirements');
        }

        let requirements = result.data || [];

        // Filter by featureId if provided (check properties for parentPageId)
        if (featureId) {
          requirements = requirements.filter(page => 
            getTextContent(page.properties?.parentPageId) === featureId
          );
        }

        return requirements;
      },
      {
        operationName: 'listRequirements',
        entityType: 'requirement'
      }
    );
  }

  /**
   * Release Page Operations (stored as pages with type='release')
   */
  async createReleasePage(
    params: CreateReleasePageParams,
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
            parentPageId: createTextProperty(params.parentPageId || '')
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

  async updateReleasePage(
    releaseId: string,
    params: UpdateReleasePageParams,
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

  async deleteReleasePage(
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
   * Roadmap Page Operations (stored as pages with type='roadmap')
   */
  async createRoadmapPage(
    params: CreateRoadmapPageParams,
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

  async updateRoadmapPage(
    roadmapId: string,
    params: UpdateRoadmapPageParams,
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

  async deleteRoadmapPage(
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
  async listProductPages(tenantId: string): Promise<AgentOperationResult<Page[]>> {
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

  async listFeaturePages(tenantId: string, productId?: string): Promise<AgentOperationResult<Page[]>> {
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
        entityType: 'Pages'
      }
    );
  }


  async listReleasePages(tenantId: string, featureId?: string): Promise<AgentOperationResult<Page[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'release' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list releases');
        }

        let releases = result.data || [];

        // Filter by featureId if provided (check properties for parentPageId)
        if (featureId) {
          releases = releases.filter(page => 
            getTextContent(page.properties?.parentPageId) === featureId
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

  async listRoadmapPages(tenantId: string, productId?: string): Promise<AgentOperationResult<Page[]>> {
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