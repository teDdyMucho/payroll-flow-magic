import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { User, Calculator, FileText, Variable, Code, GitBranch, Plus, Info, FileOutput } from 'lucide-react';
import { GlobalVariable } from '@/data/globalVariables';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
  globalVariables: GlobalVariable[];
}

const Sidebar: React.FC<SidebarProps> = ({
  onDragStart,
  globalVariables
}) => {
  const [activeTab, setActiveTab] = useState<string>("nodes");
  
  const nodeTypes = [{
    type: 'employeeNode',
    label: 'Employee Data',
    description: 'Source of employee information with custom fields',
    icon: <User className="h-4 w-4 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  }, {
    type: 'computationNode',
    label: 'Computation',
    description: 'Mathematical operations',
    icon: <Calculator className="h-4 w-4 text-green-500" />,
    color: 'bg-green-50 border-green-200 hover:bg-green-100'
  }, {
    type: 'elseIfNode',
    label: 'Condition',
    description: 'Branching logic based on condition',
    icon: <GitBranch className="h-4 w-4 text-orange-500" />,
    color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
  }, {
    type: 'codeNode',
    label: 'Custom Code',
    description: 'Run JavaScript code',
    icon: <Code className="h-4 w-4 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  }, {
    type: 'outputNode',
    label: 'Output',
    description: 'Update employee database with flow results',
    icon: <FileOutput className="h-4 w-4 text-purple-500" />,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
  }];
  
  return (
    <div className="bg-gray-50 h-full flex flex-col">
      <div className="p-2 pb-1 bg-gray-50">
        <h2 className="text-sm font-semibold">Payroll Flow</h2>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="flex-1 flex flex-col h-full"
      >
        <div className="px-2 pb-1">
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="nodes" className="text-xs py-1 px-0">
              <div className="flex flex-col items-center">
                <GitBranch className="h-3 w-3 mb-0.5" />
                <span className="text-[10px]">Nodes</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="variables" className="text-xs py-1 px-0">
              <div className="flex flex-col items-center">
                <Variable className="h-3 w-3 mb-0.5" />
                <span className="text-[10px]">Variables</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="tips" className="text-xs py-1 px-0">
              <div className="flex flex-col items-center">
                <Info className="h-3 w-3 mb-0.5" />
                <span className="text-[10px]">Tips</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="flex-1 overflow-auto scrollbar-visible">
          <TabsContent value="nodes" className="m-0 p-0 h-full overflow-y-auto scrollbar-visible">
            <div className="p-2 space-y-2">
              <p className="text-xs text-gray-500 mb-1">Drag nodes onto the canvas</p>
              {nodeTypes.map(node => (
                <Card 
                  key={node.type} 
                  className={`p-2 cursor-grab ${node.color} transition-all duration-200 border hover:shadow-md hover:-translate-y-0.5`} 
                  draggable 
                  onDragStart={event => onDragStart(event, node.type)}
                >
                  <div className="flex items-center space-x-2">
                    {node.icon}
                    <div>
                      <h3 className="font-medium text-xs">{node.label}</h3>
                      <p className="text-[10px] text-gray-500 line-clamp-1">{node.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="variables" className="m-0 p-0 h-full overflow-y-auto scrollbar-visible">
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-xs">Global Variables</h3>
                <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {globalVariables.length} {globalVariables.length === 1 ? 'var' : 'vars'}
                </span>
              </div>
              
              <div className="space-y-1.5">
                {globalVariables.map(variable => (
                  <TooltipProvider key={variable.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className={`px-2 py-1.5 rounded-md text-xs ${variable.type === 'constant' ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-xs">{variable.name}</span>
                            <span className={`text-[10px] px-1 py-0.5 rounded ${variable.type === 'constant' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                              {variable.type}
                            </span>
                          </div>
                          <div className="text-[10px] mt-0.5 text-gray-600 truncate">
                            {variable.value.toString()}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        <p>Value: {variable.value.toString()}</p>
                        <p className="text-[10px] text-gray-500">Type: {variable.type}</p>
                        {variable.description && <p className="text-[10px] text-gray-500">{variable.description}</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                
                {globalVariables.length === 0 && (
                  <div className="text-center py-2 border border-dashed rounded-md text-xs text-gray-400">
                    No global variables yet
                  </div>
                )}
              </div>
              
              <div className="text-[10px] text-gray-500 mt-2 p-1.5 bg-gray-100 rounded-md">
                <p className="mb-0.5">💡 <strong>Tip:</strong> Global variables are available to all nodes.</p>
                <p>Add variables from the toolbar button.</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tips" className="m-0 p-0 h-full overflow-y-auto scrollbar-visible">
            <div className="p-2 space-y-2">
              <h3 className="font-semibold text-xs">Payroll Flow Tips</h3>
              
              <div className="space-y-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-0.5">
                    <User className="h-3 w-3 text-blue-500" /> Employee Nodes
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4 list-disc">
                    <li>All employee fields are available as variables</li>
                    <li>Connect to computation nodes to process data</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-0.5">
                    <Calculator className="h-3 w-3 text-green-500" /> Computation Nodes
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4 list-disc">
                    <li>Use formulas to calculate values</li>
                    <li>Results are stored in flow variables</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-md p-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-0.5">
                    <GitBranch className="h-3 w-3 text-orange-500" /> Condition Nodes
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4 list-disc">
                    <li>Create branching logic with conditions</li>
                    <li>Use operators like &gt;, &lt;, ==, etc.</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-md p-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-0.5">
                    <FileOutput className="h-3 w-3 text-purple-500" /> Output Nodes
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4 list-disc">
                    <li>Display calculated results</li>
                    <li>Update employee database fields</li>
                    <li>Auto-detect connected employees</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-1.5">
                  <h4 className="text-xs font-medium flex items-center gap-1 mb-0.5">
                    <Code className="h-3 w-3 text-blue-500" /> Code Nodes
                  </h4>
                  <ul className="text-[10px] text-gray-600 space-y-0.5 ml-4 list-disc">
                    <li>Write custom JavaScript code</li>
                    <li>Access flow variables and modify them</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Sidebar;
