async function debugImports() {
  console.log('🔍 Debugging imports...');
  
  try {
    const module = await import('./src/services/agent-operations.ts');
    console.log('Available exports:', Object.keys(module));
    
    if (module.agentOperationsService) {
      console.log('agentOperationsService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(module.agentOperationsService)));
    }
    
    if (module.AgentOperationsService) {
      console.log('AgentOperationsService is available as class');
      const instance = new module.AgentOperationsService();
      console.log('Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
    }
    
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

debugImports();