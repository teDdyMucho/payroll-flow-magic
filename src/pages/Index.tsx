
import { TabsNavigation } from '@/components/TabsNavigation';

const Index = () => {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Management System</h1>
        <p className="text-gray-500">Manage payroll calculations, schedules, and employee data with intuitive tools</p>
      </header>
      <div className="flex-1 overflow-hidden p-4">
        <TabsNavigation />
      </div>
    </div>
  );
};

export default Index;
