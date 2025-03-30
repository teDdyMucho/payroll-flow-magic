import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { Employee, Flow, GlobalVariable } from '@/types/database';

const firebaseConfig = {
  apiKey: "AIzaSyBbFw1pqI-7phZa9w65LuaEa91WiFsIGuM",
  authDomain: "employeepayroll-6d654.firebaseapp.com",
  projectId: "employeepayroll-6d654",
  storageBucket: "employeepayroll-6d654.firebasestorage.app",
  messagingSenderId: "1057232255518",
  appId: "1:1057232255518:web:0620370cd259ff25d04c0f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection references
export const employeesRef = collection(db, 'employees');
export const flowsRef = collection(db, 'flows');
export const globalVariablesRef = collection(db, 'globalVariables');

// Employee operations
export const addEmployee = async (employeeId: string, data: Omit<Employee, 'id'>) => {
  const timestamp = serverTimestamp();
  await setDoc(doc(employeesRef, employeeId), {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  });
};

export const getEmployee = async (employeeId: string): Promise<Employee | null> => {
  const docSnap = await getDoc(doc(employeesRef, employeeId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as Employee;
};

export const getAllEmployees = async (): Promise<Employee[]> => {
  const snapshot = await getDocs(employeesRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Employee;
  });
};

export const updateEmployee = async (employeeId: string, data: Partial<Employee>) => {
  const timestamp = serverTimestamp();
  await updateDoc(doc(employeesRef, employeeId), {
    ...data,
    updatedAt: timestamp
  });
};

export const deleteEmployee = async (employeeId: string) => {
  await deleteDoc(doc(employeesRef, employeeId));
};

// Employee-Flow linking operations
export const linkFlowToEmployee = async (employeeId: string, flowId: string, fieldName?: string) => {
  console.log('Linking flow to employee:', { employeeId, flowId, fieldName });
  const timestamp = serverTimestamp();
  
  // Get the employee document
  const employeeDoc = await getDoc(doc(employeesRef, employeeId));
  if (!employeeDoc.exists()) {
    throw new Error(`Employee with ID ${employeeId} does not exist`);
  }
  
  // Update the employee document with the linked flow
  const linkedFlows = employeeDoc.data().linkedFlows || {};
  
  if (fieldName) {
    // Link to a specific field
    linkedFlows[fieldName] = flowId;
  } else {
    // For general employee flows, store as an array under _flows key
    const generalFlows = linkedFlows._flows || [];
    if (!generalFlows.includes(flowId)) {
      generalFlows.push(flowId);
    }
    linkedFlows._flows = generalFlows;
  }
  
  await updateDoc(doc(employeesRef, employeeId), {
    linkedFlows,
    updatedAt: timestamp
  });
};

export const unlinkFlowFromEmployee = async (employeeId: string, flowId?: string, fieldName?: string) => {
  console.log('Unlinking flow from employee:', { employeeId, flowId, fieldName });
  const timestamp = serverTimestamp();
  
  // Get the employee document
  const employeeDoc = await getDoc(doc(employeesRef, employeeId));
  if (!employeeDoc.exists()) {
    throw new Error(`Employee with ID ${employeeId} does not exist`);
  }
  
  // Update the employee document to remove the linked flow
  const linkedFlows = employeeDoc.data().linkedFlows || {};
  
  if (fieldName) {
    // Unlink from a specific field
    delete linkedFlows[fieldName];
  } else if (flowId) {
    // Unlink specific flow from general employee flows
    const generalFlows = linkedFlows._flows || [];
    linkedFlows._flows = generalFlows.filter(id => id !== flowId);
  } else {
    // Unlink all general flows
    delete linkedFlows._flows;
  }
  
  await updateDoc(doc(employeesRef, employeeId), {
    linkedFlows,
    updatedAt: timestamp
  });
};

export const bulkLinkFlowToEmployees = async (employeeIds: string[], flowId: string, fieldName?: string) => {
  console.log('Bulk linking flow to employees:', { employeeIds, flowId, fieldName });
  
  const operations = employeeIds.map(employeeId => 
    linkFlowToEmployee(employeeId, flowId, fieldName)
  );
  
  await Promise.all(operations);
};

// Flow operations
export const addFlow = async (flowId: string, data: Omit<Flow, 'id' | 'createdAt' | 'updatedAt'>) => {
  console.log('Adding flow:', { flowId, data });
  const timestamp = serverTimestamp();
  await setDoc(doc(flowsRef, flowId), {
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  });
};

export const getFlow = async (flowId: string): Promise<Flow | null> => {
  const docSnap = await getDoc(doc(flowsRef, flowId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as Flow;
};

export const getFlowById = async (flowId: string): Promise<Flow | null> => {
  try {
    const docSnap = await getDoc(doc(flowsRef, flowId));
    if (!docSnap.exists()) return null;
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as Flow;
  } catch (error) {
    console.error('Error getting flow:', error);
    return null;
  }
};

export const getAllFlows = async (): Promise<Flow[]> => {
  const querySnapshot = await getDocs(flowsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Flow[];
};

export const updateFlow = async (flowId: string, data: Partial<Flow>) => {
  console.log('Updating flow:', { flowId, data });
  const timestamp = serverTimestamp();
  await updateDoc(doc(flowsRef, flowId), {
    ...data,
    updatedAt: timestamp
  });
};

export const deleteFlow = async (flowId: string) => {
  console.log('Deleting flow:', flowId);
  await deleteDoc(doc(flowsRef, flowId));
};

// Global variables operations
export const addGlobalVariable = async (varId: string, data: Omit<GlobalVariable, 'id' | 'createdAt' | 'updatedAt'>) => {
  console.log('Adding global variable:', { varId, data });
  const timestamp = serverTimestamp();
  try {
    await setDoc(doc(globalVariablesRef, varId), {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    console.log('Successfully added global variable');
  } catch (error) {
    console.error('Error adding global variable:', error);
    throw error;
  }
};

export const getGlobalVariable = async (varId: string): Promise<GlobalVariable | null> => {
  const docSnap = await getDoc(doc(globalVariablesRef, varId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as GlobalVariable;
};

export const getAllGlobalVariables = async (): Promise<GlobalVariable[]> => {
  const snapshot = await getDocs(globalVariablesRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as GlobalVariable;
  });
};

export const updateGlobalVariable = async (varId: string, data: Partial<GlobalVariable>) => {
  const timestamp = serverTimestamp();
  await updateDoc(doc(globalVariablesRef, varId), {
    ...data,
    updatedAt: timestamp
  });
};

export const deleteGlobalVariable = async (varId: string) => {
  await deleteDoc(doc(globalVariablesRef, varId));
};
