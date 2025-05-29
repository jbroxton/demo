/**
 * @file Agent Function Tools Library
 * @description Utilities for creating and validating OpenAI function tools for agent operations
 */

import { z } from 'zod';
import type { 
  OpenAIFunctionTool, 
  AgentEntityType,
  CreateProductParams,
  UpdateProductParams,
  CreateFeatureParams,
  UpdateFeatureParams,
  CreateRequirementParams,
  UpdateRequirementParams,
  CreateReleaseParams,
  UpdateReleaseParams,
  CreateRoadmapParams,
  UpdateRoadmapParams,
  DeleteEntityParams
} from '@/types/models';

/**
 * Zod schemas for validating agent operation parameters
 */

/** Schema for product creation parameters */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Product description is required'),
  interfaces: z.array(z.string()).optional(),
});

/** Schema for product update parameters */
export const updateProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  interfaces: z.array(z.string()).optional(),
});

/** Schema for feature creation parameters */
export const createFeatureSchema = z.object({
  name: z.string().min(1, 'Feature name is required'),
  priority: z.enum(['High', 'Med', 'Low']),
  description: z.string().min(1, 'Feature description is required'),
  interfaceId: z.string().min(1, 'Interface ID is required'),
  roadmapId: z.string().optional(),
  okr: z.string().optional(),
});

/** Schema for feature update parameters */
export const updateFeatureSchema = z.object({
  id: z.string().min(1, 'Feature ID is required'),
  name: z.string().min(1).optional(),
  priority: z.enum(['High', 'Med', 'Low']).optional(),
  description: z.string().min(1).optional(),
  roadmapId: z.string().optional(),
  okr: z.string().optional(),
});

/** Schema for requirement creation parameters */
export const createRequirementSchema = z.object({
  name: z.string().min(1, 'Requirement name is required'),
  priority: z.enum(['High', 'Med', 'Low']),
  description: z.string().min(1, 'Requirement description is required'),
  owner: z.string().optional(),
  featureId: z.string().min(1, 'Feature ID is required'),
});

/** Schema for requirement update parameters */
export const updateRequirementSchema = z.object({
  id: z.string().min(1, 'Requirement ID is required'),
  name: z.string().min(1).optional(),
  priority: z.enum(['High', 'Med', 'Low']).optional(),
  description: z.string().min(1).optional(),
  owner: z.string().optional(),
});

/** Schema for release creation parameters */
export const createReleaseSchema = z.object({
  name: z.string().min(1, 'Release name is required'),
  description: z.string().optional(),
  targetDate: z.string().min(1, 'Target date is required'),
  priority: z.enum(['High', 'Med', 'Low']).optional(),
  featureId: z.string().min(1, 'Feature ID is required'),
});

/** Schema for release update parameters */
export const updateReleaseSchema = z.object({
  id: z.string().min(1, 'Release ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  priority: z.enum(['High', 'Med', 'Low']).optional(),
  featureId: z.string().optional(),
});

/** Schema for roadmap creation parameters */
export const createRoadmapSchema = z.object({
  name: z.string().min(1, 'Roadmap name is required'),
  description: z.string().min(1, 'Roadmap description is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  productId: z.string().min(1, 'Product ID is required'),
});

/** Schema for roadmap update parameters */
export const updateRoadmapSchema = z.object({
  id: z.string().min(1, 'Roadmap ID is required'),
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  priority: z.enum(['High', 'Med', 'Low']).optional(),
});

/** Schema for entity deletion parameters */
export const deleteEntitySchema = z.object({
  id: z.string().min(1, 'Entity ID is required'),
  entityType: z.enum(['product', 'feature', 'requirement', 'release', 'roadmap']),
});

/** Schema for product deletion parameters */
export const deleteProductSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

/** Schema for feature deletion parameters */
export const deleteFeatureSchema = z.object({
  id: z.string().min(1, 'Feature ID is required'),
});

/** Schema for requirement deletion parameters */
export const deleteRequirementSchema = z.object({
  id: z.string().min(1, 'Requirement ID is required'),
});

/** Schema for release deletion parameters */
export const deleteReleaseSchema = z.object({
  id: z.string().min(1, 'Release ID is required'),
});

/** Schema for roadmap deletion parameters */
export const deleteRoadmapSchema = z.object({
  id: z.string().min(1, 'Roadmap ID is required'),
});

/** Schema for list operations (no parameters required) */
export const listSchema = z.object({});

/**
 * Map of schemas by function name for validation
 */
export const functionSchemas = {
  createProduct: createProductSchema,
  updateProduct: updateProductSchema,
  createFeature: createFeatureSchema,
  updateFeature: updateFeatureSchema,
  createRequirement: createRequirementSchema,
  updateRequirement: updateRequirementSchema,
  createRelease: createReleaseSchema,
  updateRelease: updateReleaseSchema,
  createRoadmap: createRoadmapSchema,
  updateRoadmap: updateRoadmapSchema,
  deleteEntity: deleteEntitySchema,
  deleteProduct: deleteProductSchema,
  deleteFeature: deleteFeatureSchema,
  deleteRequirement: deleteRequirementSchema,
  deleteRelease: deleteReleaseSchema,
  deleteRoadmap: deleteRoadmapSchema,
  listProduct: listSchema,
  listProducts: listSchema,
  listFeatures: listSchema,
  listRequirements: listSchema,
  listReleases: listSchema,
  listRoadmaps: listSchema,
} as const;

/**
 * Create OpenAI function tool definition for product creation
 */
export function createProductTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'createProduct',
      description: 'Create a new product with name and description',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the product'
          },
          description: {
            type: 'string',
            description: 'A description of the product'
          },
          interfaces: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional array of interface IDs associated with this product'
          }
        },
        required: ['name', 'description']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for product updates
 */
export function updateProductTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'updateProduct',
      description: 'Update an existing product\'s name, description, or interfaces',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the product to update'
          },
          name: {
            type: 'string',
            description: 'New name for the product (optional)'
          },
          description: {
            type: 'string',
            description: 'New description for the product (optional)'
          },
          interfaces: {
            type: 'array',
            items: { type: 'string' },
            description: 'New interface associations (optional)'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for feature creation
 */
export function createFeatureTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'createFeature',
      description: 'Create a new feature with name, priority, and description. If connecting to a roadmap, check if roadmaps exist first.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the feature'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'Priority level of the feature'
          },
          description: {
            type: 'string',
            description: 'A description of the feature'
          },
          interfaceId: {
            type: 'string',
            description: 'The ID of the interface this feature belongs to'
          },
          roadmapId: {
            type: 'string',
            description: 'Optional roadmap ID to associate with this feature'
          },
          okr: {
            type: 'string',
            description: 'Optional OKR associated with this feature'
          }
        },
        required: ['name', 'priority', 'description', 'interfaceId']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for feature updates
 */
export function updateFeatureTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'updateFeature',
      description: 'Update an existing feature\'s properties. When connecting to roadmaps, verify roadmap exists or offer to create one.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the feature to update'
          },
          name: {
            type: 'string',
            description: 'New name for the feature (optional)'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'New priority level (optional)'
          },
          description: {
            type: 'string',
            description: 'New description for the feature (optional)'
          },
          roadmapId: {
            type: 'string',
            description: 'New roadmap association (optional)'
          },
          okr: {
            type: 'string',
            description: 'New OKR association (optional)'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for requirement creation
 */
export function createRequirementTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'createRequirement',
      description: 'Create a new requirement with name, priority, description, and optional owner',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the requirement'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'Priority level of the requirement'
          },
          description: {
            type: 'string',
            description: 'A description of the requirement'
          },
          owner: {
            type: 'string',
            description: 'Optional owner of the requirement'
          },
          featureId: {
            type: 'string',
            description: 'The ID of the feature this requirement belongs to'
          }
        },
        required: ['name', 'priority', 'description', 'featureId']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for requirement updates
 */
export function updateRequirementTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'updateRequirement',
      description: 'Update an existing requirement\'s properties',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the requirement to update'
          },
          name: {
            type: 'string',
            description: 'New name for the requirement (optional)'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'New priority level (optional)'
          },
          description: {
            type: 'string',
            description: 'New description for the requirement (optional)'
          },
          owner: {
            type: 'string',
            description: 'New owner for the requirement (optional)'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for release creation
 */
export function createReleaseTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'createRelease',
      description: 'Create a new release with name, description, date, and priority',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the release'
          },
          description: {
            type: 'string',
            description: 'A description of the release'
          },
          targetDate: {
            type: 'string',
            description: 'The planned release date (ISO format or human readable)'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'Priority level of the release'
          },
          featureId: {
            type: 'string',
            description: 'Feature ID to associate with this release'
          }
        },
        required: ['name', 'targetDate', 'featureId']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for release updates
 */
export function updateReleaseTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'updateRelease',
      description: 'Update an existing release\'s properties',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the release to update'
          },
          name: {
            type: 'string',
            description: 'New name for the release (optional)'
          },
          description: {
            type: 'string',
            description: 'New description for the release (optional)'
          },
          targetDate: {
            type: 'string',
            description: 'New release date (optional)'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'New priority level (optional)'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for roadmap creation
 */
export function createRoadmapTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'createRoadmap',
      description: 'Create a new roadmap with name, description, and priority',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The name of the roadmap'
          },
          description: {
            type: 'string',
            description: 'A description of the roadmap'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'Priority level of the roadmap'
          }
        },
        required: ['name', 'description', 'priority']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for roadmap updates
 */
export function updateRoadmapTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'updateRoadmap',
      description: 'Update an existing roadmap\'s properties',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the roadmap to update'
          },
          name: {
            type: 'string',
            description: 'New name for the roadmap (optional)'
          },
          description: {
            type: 'string',
            description: 'New description for the roadmap (optional)'
          },
          priority: {
            type: 'string',
            enum: ['High', 'Med', 'Low'],
            description: 'New priority level (optional)'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for entity deletion
 */
export function deleteEntityTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteEntity',
      description: 'Delete an entity (product, feature, requirement, release, or roadmap). Check for dependencies before deletion.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the entity to delete'
          },
          entityType: {
            type: 'string',
            enum: ['product', 'feature', 'requirement', 'release', 'roadmap'],
            description: 'The type of entity to delete'
          }
        },
        required: ['id', 'entityType']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for product deletion
 */
export function deleteProductTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteProduct',
      description: 'Delete a product. Check for dependencies (features, interfaces) before deletion.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the product to delete'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for feature deletion
 */
export function deleteFeatureTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteFeature',
      description: 'Delete a feature. Check for dependencies (requirements) before deletion.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the feature to delete'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for requirement deletion
 */
export function deleteRequirementTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteRequirement',
      description: 'Delete a requirement.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the requirement to delete'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for release deletion
 */
export function deleteReleaseTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteRelease',
      description: 'Delete a release.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the release to delete'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for roadmap deletion
 */
export function deleteRoadmapTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'deleteRoadmap',
      description: 'Delete a roadmap. Check for dependencies (associated features) before deletion.',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the roadmap to delete'
          }
        },
        required: ['id']
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing products
 */
export function listProductTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listProduct',
      description: 'List all products for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing products (plural form)
 */
export function listProductsTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listProducts',
      description: 'List all products for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing features
 */
export function listFeaturesTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listFeatures',
      description: 'List all features for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing requirements
 */
export function listRequirementsTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listRequirements',
      description: 'List all requirements for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing releases
 */
export function listReleasesTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listReleases',
      description: 'List all releases for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Create OpenAI function tool definition for listing roadmaps
 */
export function listRoadmapsTool(): OpenAIFunctionTool {
  return {
    type: 'function',
    function: {
      name: 'listRoadmaps',
      description: 'List all roadmaps for the current tenant',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  };
}

/**
 * Get all available function tools for agent operations
 */
export function getAllAgentFunctionTools(): OpenAIFunctionTool[] {
  return [
    createProductTool(),
    updateProductTool(),
    deleteProductTool(),
    listProductTool(),
    listProductsTool(),
    createFeatureTool(),
    updateFeatureTool(),
    deleteFeatureTool(),
    listFeaturesTool(),
    createRequirementTool(),
    updateRequirementTool(),
    deleteRequirementTool(),
    listRequirementsTool(),
    createReleaseTool(),
    updateReleaseTool(),
    deleteReleaseTool(),
    listReleasesTool(),
    createRoadmapTool(),
    updateRoadmapTool(),
    deleteRoadmapTool(),
    listRoadmapsTool(),
    deleteEntityTool(),
  ];
}

/**
 * Get function tools for specific entity types
 */
export function getFunctionToolsForEntity(entityType: AgentEntityType): OpenAIFunctionTool[] {
  switch (entityType) {
    case 'product':
      return [createProductTool(), updateProductTool(), deleteProductTool(), listProductsTool()];
    case 'feature':
      return [createFeatureTool(), updateFeatureTool(), deleteFeatureTool(), listFeaturesTool()];
    case 'requirement':
      return [createRequirementTool(), updateRequirementTool(), deleteRequirementTool(), listRequirementsTool()];
    case 'release':
      return [createReleaseTool(), updateReleaseTool(), deleteReleaseTool(), listReleasesTool()];
    case 'roadmap':
      return [createRoadmapTool(), updateRoadmapTool(), deleteRoadmapTool(), listRoadmapsTool()];
    default:
      return [];
  }
}

/**
 * Alias for getFunctionToolsForEntity for backward compatibility
 */
export function getAgentFunctionToolsByEntity(entityType: string): OpenAIFunctionTool[] {
  return getFunctionToolsForEntity(entityType as AgentEntityType);
}

/**
 * Validate agent parameters - alias for validateFunctionParameters
 */
export function validateAgentParams(functionName: string, parameters: any): { success: boolean; data?: any; error?: { type: string; message: string; userMessage?: string; fieldErrors?: Record<string, string> } } {
  const result = validateFunctionParameters(functionName, parameters);
  
  if (!result.success && result.error) {
    // Parse validation errors for better user messages
    const isValidationError = result.error.includes('Validation failed:');
    const userMessage = isValidationError 
      ? 'Please check your input and try again' 
      : result.error;
    
    // Extract field errors from Zod validation messages
    let fieldErrors: Record<string, string> | undefined;
    if (isValidationError) {
      fieldErrors = {};
      const errorParts = result.error.replace('Validation failed: ', '').split(', ');
      errorParts.forEach(part => {
        const [field, ...messageParts] = part.split(': ');
        if (field && messageParts.length > 0) {
          fieldErrors![field] = messageParts.join(': ');
        }
      });
    }
    
    return {
      success: false,
      error: {
        type: 'validation',
        message: result.error,
        userMessage,
        fieldErrors
      }
    };
  }
  
  return { success: result.success, data: result.data };
}

/**
 * Validate function parameters using Zod schemas
 */
export function validateFunctionParameters(functionName: string, parameters: any): { success: boolean; error?: string; data?: any } {
  const schema = functionSchemas[functionName as keyof typeof functionSchemas];
  
  if (!schema) {
    return {
      success: false,
      error: `Unknown function: ${functionName}`
    };
  }

  try {
    const validatedData = schema.parse(parameters);
    return {
      success: true,
      data: validatedData
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMessage}`
      };
    }
    
    return {
      success: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Get human-readable description for a function call
 */
export function getFunctionDescription(functionName: string, parameters: any): string {
  switch (functionName) {
    case 'createProduct':
      return `Create product "${parameters.name}" with description: ${parameters.description}`;
    case 'updateProduct':
      return `Update product ${parameters.id}${parameters.name ? ` to name "${parameters.name}"` : ''}${parameters.description ? ` with new description` : ''}`;
    case 'deleteProduct':
      return `Delete product ${parameters.id}`;
    case 'createFeature':
      return `Create ${parameters.priority} priority feature "${parameters.name}" for interface ${parameters.interfaceId}`;
    case 'updateFeature':
      return `Update feature ${parameters.id}${parameters.name ? ` to name "${parameters.name}"` : ''}${parameters.priority ? ` with priority ${parameters.priority}` : ''}`;
    case 'deleteFeature':
      return `Delete feature ${parameters.id}`;
    case 'createRequirement':
      return `Create ${parameters.priority} priority requirement "${parameters.name}" for feature ${parameters.featureId}`;
    case 'updateRequirement':
      return `Update requirement ${parameters.id}${parameters.name ? ` to name "${parameters.name}"` : ''}${parameters.priority ? ` with priority ${parameters.priority}` : ''}`;
    case 'deleteRequirement':
      return `Delete requirement ${parameters.id}`;
    case 'createRelease':
      return `Create ${parameters.priority} priority release "${parameters.name}" for ${parameters.releaseDate}`;
    case 'updateRelease':
      return `Update release ${parameters.id}${parameters.name ? ` to name "${parameters.name}"` : ''}${parameters.releaseDate ? ` with date ${parameters.releaseDate}` : ''}`;
    case 'deleteRelease':
      return `Delete release ${parameters.id}`;
    case 'createRoadmap':
      return `Create ${parameters.priority} priority roadmap "${parameters.name}"`;
    case 'updateRoadmap':
      return `Update roadmap ${parameters.id}${parameters.name ? ` to name "${parameters.name}"` : ''}${parameters.priority ? ` with priority ${parameters.priority}` : ''}`;
    case 'deleteRoadmap':
      return `Delete roadmap ${parameters.id}`;
    case 'deleteEntity':
      return `Delete ${parameters.entityType} ${parameters.id}`;
    default:
      return `Execute ${functionName} with provided parameters`;
  }
}