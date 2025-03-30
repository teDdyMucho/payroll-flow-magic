export interface TimeRecord {
  clockIn: Date;
  clockOut: Date | null;
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: Date;
  timeRecords: TimeRecord[];
  status: 'Unpaid' | 'Paid';
  createdAt?: Date;
  updatedAt?: Date;
}

export type AttendanceStatus = 'Unpaid' | 'Paid';
