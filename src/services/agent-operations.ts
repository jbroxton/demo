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
import type { Product, Feature, Requirement, Release, Roadmap, Interface } from '@/types/models';
import { 
  createAgentError, 
  AgentErrorType, 
  AgentErrorSeverity,
  safeAgentOperation 
} from '@/lib/agent-error-handling';

// Import existing service functions
import { 
  getProductsFromDb, 
  getProductByIdFromDb,
  createProductInDb, 
  updateProductInDb, 
  deleteProductFromDb 
} from './products-db';
import { 
  getFeaturesFromDb, 
  createFeatureInDb, 
  updateFeatureInDb, 
  deleteFeatureFromDb 
} from './features-db';
import { 
  getRequirementsFromDb, 
  createRequirementInDb, 
  updateRequirementNameInDb,
  updateRequirementDescriptionInDb,
  deleteRequirementFromDb 
} from './requirements-db';
import { 
  getReleasesFromDb, 
  getReleasesByFeatureId,
  createReleaseInDb, 
  updateReleaseInDb, 
  deleteReleaseFromDb 
} from './releases-db';
import { 
  getRoadmaps as getRoadmapsFromDb, 
  getRoadmapById,
  createRoadmap as createRoadmapInDb, 
  updateRoadmap as updateRoadmapInDb, 
  deleteRoadmap as deleteRoadmapFromDb 
} from './roadmaps-db';
import { 
  getInterfacesFromDb 
} from './interfaces-db';

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
        const result = await createProductInDb({
          name: params.name,
          description: params.description || ''
        }, tenantId);

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
  ): Promise<AgentOperationResult<Product>> {
    return safeAgentOperation(
      async () => {
        const updateData: any = { id: productId };
        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;

        const result = await updateProductInDb(updateData, tenantId);

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
        const result = await deleteProductFromDb(productId, tenantId);

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
        const result = await getProductByIdFromDb(productId, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to get product');
        }

        if (!result.data) {
          throw new Error('Product not found');
        }

        return result.data;
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
        const result = await createFeatureInDb({
          name: params.name,
          description: params.description || '',
          interfaceId: params.interfaceId,
          priority: params.priority,
          isSaved: false
        }, tenantId);

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
  ): Promise<AgentOperationResult<Feature>> {
    return safeAgentOperation(
      async () => {
        const updateData: any = {};
        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.priority !== undefined) updateData.priority = params.priority;
        if (params.roadmapId !== undefined) updateData.roadmapId = params.roadmapId;

        const result = await updateFeatureInDb(featureId, updateData, tenantId);

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
        const result = await deleteFeatureFromDb(featureId, tenantId);

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
        let lastResult: any = { success: true };
        
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
        
        const updatedRequirement = result.data?.find((r: any) => r.id === requirementId);
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
        const result = await createReleaseInDb({
          name: params.name,
          description: params.description || '',
          releaseDate: params.releaseDate,
          priority: params.priority,
          featureId: params.featureId || '',
          isSaved: false
        }, tenantId);

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
  ): Promise<AgentOperationResult<Release>> {
    return safeAgentOperation(
      async () => {
        const updateData: any = { id: releaseId };
        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.releaseDate !== undefined) updateData.releaseDate = params.releaseDate;
        if (params.priority !== undefined) updateData.priority = params.priority;

        const result = await updateReleaseInDb(updateData, tenantId);

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
        const result = await deleteReleaseFromDb(releaseId, tenantId);

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
        const result = await createRoadmapInDb({
          name: params.name,
          description: params.description || ''
        }, tenantId);

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
  ): Promise<AgentOperationResult<Roadmap>> {
    return safeAgentOperation(
      async () => {
        const updateData: any = {};
        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.priority !== undefined) updateData.priority = params.priority;

        const result = await updateRoadmapInDb(roadmapId, updateData, tenantId);

        if (!result.success) {
          throw new Error(result.error || 'Failed to update roadmap');
        }

        // Fetch the updated roadmap
        const fetchResult = await getRoadmapById(roadmapId, tenantId);
        if (!fetchResult.success) {
          throw new Error(fetchResult.error || 'Failed to fetch updated roadmap');
        }

        return fetchResult.data!;
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
        const result = await deleteRoadmapFromDb(roadmapId, tenantId);

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
        const result = await getProductsFromDb(tenantId);

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

  async listFeatures(tenantId: string, productId?: string): Promise<AgentOperationResult<Feature[]>> {
    return safeAgentOperation(
      async () => {
        const result = await getFeaturesFromDb(tenantId);

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
        let result;
        if (featureId) {
          result = await getReleasesByFeatureId(featureId, tenantId);
        } else {
          result = await getReleasesFromDb(tenantId);
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to list releases');
        }

        return result.data || [];
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
        const result = await getRoadmapsFromDb(tenantId);

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