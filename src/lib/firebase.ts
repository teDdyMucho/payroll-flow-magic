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
import { Employee } from '@/types/employee';
import { Flow, GlobalVariable } from '@/types/database';
import { EmployeeAttendance, TimeRecord } from '@/types/attendance';

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
export const eventsRef = collection(db, 'events');
export const attendanceRef = collection(db, 'attendance');

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
    name: data.name,
    type: data.type,
    value: data.value,
    description: data.description,
    isSystemVariable: data.isSystemVariable,
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
      name: data.name,
      type: data.type,
      value: data.value,
      description: data.description,
      isSystemVariable: data.isSystemVariable,
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

// Events operations
export const addEvent = async (eventData: Omit<any, 'id'>) => {
  const eventId = doc(eventsRef).id; // Generate a new document ID
  const timestamp = serverTimestamp();
  
  // Convert date to Firestore timestamp
  const firestoreData = {
    ...eventData,
    date: Timestamp.fromDate(eventData.date),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  // Remove icon as it's a React component and can't be stored in Firestore
  const { icon, ...dataToStore } = firestoreData;
  
  await setDoc(doc(eventsRef, eventId), dataToStore);
  return eventId;
};

export const getAllEvents = async () => {
  const snapshot = await getDocs(eventsRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  });
};

export const updateEvent = async (eventId: string, data: Partial<any>) => {
  const timestamp = serverTimestamp();
  
  // Convert date to Firestore timestamp if present
  const firestoreData = { ...data };
  if (firestoreData.date) {
    firestoreData.date = Timestamp.fromDate(firestoreData.date);
  }
  
  // Remove icon if present
  const { icon, ...dataToStore } = firestoreData;
  
  await updateDoc(doc(eventsRef, eventId), {
    ...dataToStore,
    updatedAt: timestamp
  });
};

export const deleteEvent = async (eventId: string) => {
  await deleteDoc(doc(eventsRef, eventId));
};

// Attendance operations
export const addAttendanceRecord = async (data: Omit<EmployeeAttendance, 'id' | 'createdAt' | 'updatedAt'>) => {
  const recordId = doc(attendanceRef).id;
  const timestamp = serverTimestamp();
  
  await setDoc(doc(attendanceRef, recordId), {
    ...data,
    id: recordId,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  
  return recordId;
};

export const getAttendanceRecord = async (recordId: string): Promise<EmployeeAttendance | null> => {
  const docSnap = await getDoc(doc(attendanceRef, recordId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    date: data.date?.toDate(),
    timeRecords: data.timeRecords.map((record: any) => ({
      clockIn: record.clockIn?.toDate(),
      clockOut: record.clockOut?.toDate()
    })),
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate()
  } as EmployeeAttendance;
};

export const getAttendanceByDate = async (date: Date): Promise<EmployeeAttendance[]> => {
  // Convert date to start and end of day for comparison
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  const snapshot = await getDocs(attendanceRef);
  return snapshot.docs
    .map(doc => {
      const data = doc.data();
      const recordDate = data.date?.toDate();
      
      // Only include records for the specified date
      if (recordDate >= startDate && recordDate <= endDate) {
        return {
          id: doc.id,
          ...data,
          date: recordDate,
          timeRecords: data.timeRecords.map((record: any) => ({
            clockIn: record.clockIn?.toDate(),
            clockOut: record.clockOut?.toDate()
          })),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        } as EmployeeAttendance;
      }
      return null;
    })
    .filter(Boolean) as EmployeeAttendance[];
};

export const getAllAttendanceRecords = async (): Promise<EmployeeAttendance[]> => {
  const snapshot = await getDocs(attendanceRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate(),
      timeRecords: data.timeRecords.map((record: any) => ({
        clockIn: record.clockIn?.toDate(),
        clockOut: record.clockOut?.toDate()
      })),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    } as EmployeeAttendance;
  });
};

export const updateAttendanceRecord = async (recordId: string, data: Partial<EmployeeAttendance>) => {
  const timestamp = serverTimestamp();
  
  // Handle timeRecords conversion for Firestore
  const updateData = { ...data, updatedAt: timestamp };
  
  await updateDoc(doc(attendanceRef, recordId), updateData);
};

export const deleteAttendanceRecord = async (recordId: string) => {
  await deleteDoc(doc(attendanceRef, recordId));
};

export const updateAttendanceStatus = async (recordId: string, status: 'Paid' | 'Unpaid') => {
  const timestamp = serverTimestamp();
  
  console.log(`Updating attendance status for record ${recordId} to ${status}`);
  
  try {
    // First verify the document exists
    const docRef = doc(attendanceRef, recordId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Attendance record with ID ${recordId} does not exist`);
    }
    
    // Perform the update
    await updateDoc(docRef, {
      status,
      updatedAt: timestamp
    });
    
    // Verify the update was successful
    const updatedSnap = await getDoc(docRef);
    const updatedData = updatedSnap.data();
    
    if (updatedData?.status !== status) {
      console.error('Status update verification failed', {
        expected: status,
        actual: updatedData?.status
      });
      throw new Error('Status update verification failed');
    }
    
    console.log(`Successfully updated attendance status for record ${recordId} to ${status}`);
    return true;
  } catch (error) {
    console.error(`Error updating attendance status for record ${recordId}:`, error);
    throw error;
  }
};

export const addTimeRecord = async (attendanceId: string, timeRecord: TimeRecord) => {
  const attendanceDoc = await getDoc(doc(attendanceRef, attendanceId));
  if (!attendanceDoc.exists()) {
    throw new Error(`Attendance record with ID ${attendanceId} does not exist`);
  }
  
  const data = attendanceDoc.data();
  const timeRecords = [...(data.timeRecords || []), timeRecord];
  
  await updateAttendanceRecord(attendanceId, { timeRecords });
};

export const updateTimeRecord = async (
  attendanceId: string, 
  index: number, 
  timeRecord: Partial<TimeRecord>
) => {
  const attendanceDoc = await getDoc(doc(attendanceRef, attendanceId));
  if (!attendanceDoc.exists()) {
    throw new Error(`Attendance record with ID ${attendanceId} does not exist`);
  }
  
  const data = attendanceDoc.data();
  const timeRecords = [...(data.timeRecords || [])];
  
  if (index >= 0 && index < timeRecords.length) {
    timeRecords[index] = { ...timeRecords[index], ...timeRecord };
    await updateAttendanceRecord(attendanceId, { timeRecords });
  } else {
    throw new Error(`Time record at index ${index} does not exist`);
  }
};
