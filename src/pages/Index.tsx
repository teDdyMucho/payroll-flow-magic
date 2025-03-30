
import PayrollFlowEditor from '@/components/PayrollFlow/PayrollFlowEditor';

const Index = () => {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">Payroll Flow Builder</h1>
        <p className="text-gray-500">Build visual payroll calculation flows with drag-and-drop nodes and manage employee data</p>
      </header>
      <div className="flex-1 overflow-hidden">
        <PayrollFlowEditor />
      </div>
    </div>
  );
};

export default Index;
