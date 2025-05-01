import { useProductsStore } from '@/stores/products';
import { useInterfacesStore } from '@/stores/interfaces';
import { useFeaturesStore } from '@/stores/features';
import { useReleasesStore } from '@/stores/releases';
import { produce } from 'immer';

/**
 * Synchronizes all data relationships in the application using immer:
 * - Products -> Interfaces
 * - Interfaces -> Features
 * - Features -> Releases
 * 
 * This function cleans up orphaned references between entities.
 */
export function syncData() {
  // Get all store data
  const productsStore = useProductsStore.getState();
  const interfacesStore = useInterfacesStore.getState();
  const featuresStore = useFeaturesStore.getState();
  const releasesStore = useReleasesStore.getState();
  
  // Get all entities
  const products = productsStore.getProducts();
  const interfaces = interfacesStore.getInterfaces();
  const features = featuresStore.getFeatures();
  const releases = releasesStore.getReleases();
  
  // Create Sets for efficient lookups
  const validInterfaceIds = new Set(interfaces.map(i => i.id));
  const validFeatureIds = new Set(features.map(f => f.id));
  const validReleaseIds = new Set(releases.map(r => r.id));
  
  // Track changes
  let changes = {
    products: false,
    interfaces: false,
    features: false
  };
  
  // 1. Synchronize products with interfaces
  useProductsStore.setState(produce(state => {
    for (const product of state.products) {
      if (!product.interfaces || product.interfaces.length === 0) continue;
      
      const oldLength = product.interfaces.length;
      product.interfaces = product.interfaces.filter((id: string) => validInterfaceIds.has(id));
      
      if (product.interfaces.length !== oldLength) {
        changes.products = true;
      }
    }
  }));
  
  // 2. Synchronize interfaces with features
  useInterfacesStore.setState(produce(state => {
    for (const interface_ of state.interfaces) {
      if (!interface_.features || interface_.features.length === 0) continue;
      
      const oldLength = interface_.features.length;
      interface_.features = interface_.features.filter((id: string) => validFeatureIds.has(id));
      
      if (interface_.features.length !== oldLength) {
        changes.interfaces = true;
      }
    }
  }));
  
  // 3. Synchronize features with releases
  useFeaturesStore.setState(produce(state => {
    for (const feature of state.features) {
      if (!feature.releases || feature.releases.length === 0) continue;
      
      const oldLength = feature.releases.length;
      feature.releases = feature.releases.filter((id: string) => validReleaseIds.has(id));
      
      if (feature.releases.length !== oldLength) {
        changes.features = true;
      }
    }
  }));
  
  return {
    productsChanged: changes.products,
    interfacesChanged: changes.interfaces,
    featuresChanged: changes.features,
    anyChanged: changes.products || changes.interfaces || changes.features
  };
} 