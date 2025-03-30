export interface Employee {
  id: string;
  name: string;
  position: string;
  fields: {
    [key: string]: number | string;
  };
  assignedFlows?: {
    id: string;
    name: string;
    assignedAt: Date;
  }[];
  linkedFlows?: {
    [key: string]: string | string[]; // Can be fieldName -> flowId or _flows -> flowId[]
  };
}

export const sampleEmployees: Employee[] = [
  {
    id: "emp001",
    name: "John Doe",
    position: "Software Engineer",
    fields: {
      baseSalary: 5000,
      hourlyRate: 30,
      hoursWorked: 160,
      taxRate: 0.25,
      benefits: 500,
      bonus: 1000,
      yearsOfService: 3
    }
  },
  {
    id: "emp002",
    name: "Jane Smith",
    position: "Project Manager",
    fields: {
      baseSalary: 6500,
      hourlyRate: 40,
      hoursWorked: 150,
      taxRate: 0.28,
      benefits: 700,
      bonus: 1500,
      yearsOfService: 5
    }
  },
  {
    id: "emp003",
    name: "Robert Johnson",
    position: "HR Specialist",
    fields: {
      baseSalary: 4200,
      hourlyRate: 25,
      hoursWorked: 170,
      taxRate: 0.22,
      benefits: 450,
      bonus: 800,
      yearsOfService: 2
    }
  },
  {
    id: "emp004",
    name: "Emily Chen",
    position: "Data Analyst",
    fields: {
      baseSalary: 4800,
      hourlyRate: 28,
      hoursWorked: 160,
      taxRate: 0.24,
      benefits: 500,
      bonus: 900,
      yearsOfService: 1
    }
  }
];
