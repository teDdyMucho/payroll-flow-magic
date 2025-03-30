import { TabsNavigation } from '@/components/TabsNavigation';

const Index = () => {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <header className="bg-white border-b py-2 px-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Payroll Management System</h1>
        <p className="text-sm text-gray-500">Manage payroll calculations, schedules, and employee data with intuitive tools</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <TabsNavigation />
      </div>
    </div>
  );
};

export default Index;
