
export interface Employee {
  id: string;
  name: string;
  position: string;
  department?: string;
  fields: Record<string, any>;
  imageUrl?: string;
}
