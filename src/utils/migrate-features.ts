import { useFeaturesStore } from '@/stores/features';

/**
 * Migration utility to handle existing features with content
 * This migrates content field data to description field
 */
export function migrateFeatures() {
  // Client-side check to prevent server execution
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    const { features, updateFeatureDescription } = useFeaturesStore.getState();
    
    // Process each feature that has content
    features.forEach(feature => {
      if (feature.content && feature.content.trim()) {
        // If description is empty, just move content to description
        if (!feature.description || feature.description.trim() === '') {
          updateFeatureDescription(feature.id, feature.content);
        } else {
          // If both exist, append content to description with a separator
          const updatedDescription = `${feature.description}<hr /><div class="mt-4">${feature.content}</div>`;
          updateFeatureDescription(feature.id, updatedDescription);
        }
      }
    });
    
    console.log('Feature migration complete');
  } catch (error) {
    console.error('Error during feature migration:', error);
  }
} 