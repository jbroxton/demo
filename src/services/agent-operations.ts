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
import type { Product, Feature, Requirement, Release, Roadmap, Interface, Page } from '@/types/models';
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

// Import legacy services for entities not yet migrated to pages
import { 
  getRequirementsFromDb, 
  createRequirementInDb, 
  updateRequirementNameInDb,
  updateRequirementDescriptionInDb,
  deleteRequirementFromDb 
} from './requirements-db';
import { getInterfacesFromDb } from './interfaces-db';

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
  ): Promise<AgentOperationResult<Product>> {
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

        // Convert page to product format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          isSaved: true,
          savedAt: page.updated_at
        } as unknown as Product;
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
  ): Promise<AgentOperationResult<Product>> {
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

        // Convert page to product format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          isSaved: true,
          savedAt: page.updated_at
        } as unknown as Product;
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
  ): Promise<AgentOperationResult<Product>> {
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

        // Convert page to product format for compatibility
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          isSaved: true,
          savedAt: page.updated_at
        } as unknown as Product;
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
  ): Promise<AgentOperationResult<Feature>> {
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

        // Convert page to feature format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          interfaceId: getTextContent(page.properties?.interfaceId),
          priority: getTextContent(page.properties?.priority),
          isSaved: true,
          createdAt: page.created_at,
          updatedAt: page.updated_at
        } as unknown as Feature;
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
  ): Promise<AgentOperationResult<Feature>> {
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

        // Convert page to feature format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          interfaceId: getTextContent(page.properties?.interfaceId),
          priority: getTextContent(page.properties?.priority),
          roadmapId: getTextContent(page.properties?.roadmapId),
          isSaved: true,
          createdAt: page.created_at,
          updatedAt: page.updated_at
        } as unknown as Feature;
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
   * Requirement Operations
   */
  async createRequirement(
    params: CreateRequirementParams,
    tenantId: string
  ): Promise<AgentOperationResult<Requirement>> {
    return safeAgentOperation(
      async () => {
        const result = await createRequirementInDb({
          name: params.name,
          description: params.description || '',
          featureId: params.featureId,
          priority: params.priority,
          owner: params.owner,
          isSaved: false
        }, tenantId);

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

  async updateRequirement(
    requirementId: string,
    params: UpdateRequirementParams,
    tenantId: string
  ): Promise<AgentOperationResult<Requirement>> {
    return safeAgentOperation(
      async () => {
        // Update fields individually since there's no single update function
        let lastResult: { success: boolean; error?: string; data?: unknown } = { success: true };
        
        if (params.name !== undefined) {
          lastResult = await updateRequirementNameInDb(requirementId, params.name, tenantId);
          if (!lastResult.success) throw new Error(lastResult.error || 'Failed to update requirement name');
        }
        
        if (params.description !== undefined) {
          lastResult = await updateRequirementDescriptionInDb(requirementId, params.description, tenantId);
          if (!lastResult.success) throw new Error(lastResult.error || 'Failed to update requirement description');
        }
        
        // Get the updated requirement to return
        const result = await getRequirementsFromDb(tenantId);
        if (!result.success) throw new Error('Failed to get updated requirement');
        
        const updatedRequirement = result.data?.find((r: { id: string }) => r.id === requirementId);
        if (!updatedRequirement) throw new Error('Requirement not found after update');
        
        return updatedRequirement;
      },
      {
        operationName: 'updateRequirement',
        entityType: 'requirement'
      }
    );
  }

  async deleteRequirement(
    requirementId: string,
    tenantId: string
  ): Promise<AgentOperationResult<boolean>> {
    return safeAgentOperation(
      async () => {
        const result = await deleteRequirementFromDb(requirementId, tenantId);

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

  /**
   * Release Operations
   */
  async createRelease(
    params: CreateReleaseParams,
    tenantId: string
  ): Promise<AgentOperationResult<Release>> {
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

        // Convert page to release format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          releaseDate: getTextContent(page.properties?.releaseDate),
          priority: getTextContent(page.properties?.priority) as 'High' | 'Med' | 'Low',
          featureId: getTextContent(page.properties?.featureId),
          tenantId: tenantId,
          isSaved: true
        } as Release;
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
  ): Promise<AgentOperationResult<Release>> {
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

        // Convert page to release format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          releaseDate: getTextContent(page.properties?.releaseDate),
          priority: getTextContent(page.properties?.priority) as 'High' | 'Med' | 'Low',
          featureId: getTextContent(page.properties?.featureId),
          tenantId: tenantId,
          isSaved: true
        } as Release;
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
  ): Promise<AgentOperationResult<Roadmap>> {
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

        // Convert page to roadmap format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          is_default: 0,
          tenantId: tenantId,
          created_at: page.created_at,
          updated_at: page.updated_at,
          isSaved: true
        } as Roadmap;
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
  ): Promise<AgentOperationResult<Roadmap>> {
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

        // Convert page to roadmap format for compatibility
        const page = result.data!;
        return {
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          is_default: 0,
          tenantId: tenantId,
          created_at: page.created_at,
          updated_at: page.updated_at,
          isSaved: true
        } as Roadmap;
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
  async listProducts(tenantId: string): Promise<AgentOperationResult<Product[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'project' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list products');
        }

        // Convert pages to product format for compatibility
        const products = (result.data || []).map(page => ({
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          isSaved: true,
          savedAt: page.updated_at
        } as Product));

        return products;
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

  async listRequirements(tenantId: string, featureId?: string): Promise<AgentOperationResult<Requirement[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getRequirementsFromDb(tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to list requirements');
        }

        return result.data || [];
      },
      {
        operationName: 'listRequirements',
        entityType: 'requirement'
      }
    );
  }

  async listReleases(tenantId: string, featureId?: string): Promise<AgentOperationResult<Release[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'release' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list releases');
        }

        let releases = (result.data || []).map(page => ({
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          releaseDate: getTextContent(page.properties?.releaseDate),
          priority: getTextContent(page.properties?.priority) as 'High' | 'Med' | 'Low',
          featureId: getTextContent(page.properties?.featureId),
          tenantId: tenantId,
          isSaved: true
        } as Release));

        // Filter by featureId if provided
        if (featureId) {
          releases = releases.filter(release => release.featureId === featureId);
        }

        return releases;
      },
      {
        operationName: 'listReleases',
        entityType: 'release'
      }
    );
  }

  async listRoadmaps(tenantId: string, productId?: string): Promise<AgentOperationResult<Roadmap[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getPages({ tenantId, type: 'roadmap' });

        if (!result.success) {
          throw new Error(result.error || 'Failed to list roadmaps');
        }

        // Convert pages to roadmap format for compatibility
        const roadmaps = (result.data || []).map(page => ({
          id: page.id,
          name: page.title,
          description: getTextContent(page.properties?.description),
          is_default: 0,
          tenantId: tenantId,
          created_at: page.created_at,
          updated_at: page.updated_at,
          isSaved: true
        } as Roadmap));

        return roadmaps;
      },
      {
        operationName: 'listRoadmaps',
        entityType: 'roadmap'
      }
    );
  }

  async listInterfaces(tenantId: string): Promise<AgentOperationResult<Interface[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getInterfacesFromDb(tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to list interfaces');
        }

        return result.data || [];
      },
      {
        operationName: 'listInterfaces',
        entityType: 'interface'
      }
    );
  }
}

/**
 * Default service instance
 */
export const agentOperationsService = new AgentOperationsService();