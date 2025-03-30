import { addGlobalVariable, getAllGlobalVariables } from './firebase';
import { initialGlobalVariables } from '@/data/globalVariables';

export const initializeGlobalVariables = async () => {
  // Check if global variables already exist
  const existingVariables = await getAllGlobalVariables();
  
  if (existingVariables.length === 0) {
    // Initialize global variables only if none exist
    const initializationPromises = initialGlobalVariables.map(variable => 
      addGlobalVariable(variable.id, {
        name: variable.name,
        value: variable.value,
        type: variable.type,
        description: variable.description
      })
    );
    
    await Promise.all(initializationPromises);
    console.log('Global variables initialized successfully');
  }
};
