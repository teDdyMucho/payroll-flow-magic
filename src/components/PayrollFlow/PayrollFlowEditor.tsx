import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node, Panel, MarkerType, useReactFlow, EdgeProps, getBezierPath } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EmployeeNode from './CustomNodes/EmployeeNode';
import ComputationNode from './CustomNodes/ComputationNode';
import OutputNode from './CustomNodes/OutputNode';
import ElseIfNode from './CustomNodes/ElseIfNode';
import CodeNode from './CustomNodes/CodeNode';
import Sidebar from './Sidebar';
import EmployeeDatabase from './EmployeeDatabase';
import GlobalVariablesManager from './GlobalVariablesManager';
import FlowsManager from './FlowsManager';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DollarSign, Database, Share2, Trash2, Save, FileDown, FileText, Variable, Settings } from 'lucide-react';
import { sampleEmployees, Employee } from '@/data/employeeData';
import { GlobalVariable } from '@/types/database';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { globalVariablesRef, employeesRef, getAllEmployees, flowsRef, addFlow, updateFlow } from '@/lib/firebase';
import { onSnapshot } from 'firebase/firestore';

interface NodeData {
  label: string;
  sourceField: string;
  variableName: string;
  employeeId: string;
  employees: Employee[];
  customFields: any[];
  searchTerm?: string;
  onFieldChange: (nodeId: string, field: string) => void;
  onVariableNameChange: (nodeId: string, name: string) => void;
  onEmployeeChange: (nodeId: string, employeeId: string) => void;
  onCustomFieldsChange: (nodeId: string, customFields: any[]) => void;
  onSearchTermChange?: (nodeId: string, searchTerm: string) => void;
}

interface ComputationNodeData {
  label: string;
  operation: string;
  formula: string;
  resultVariable: string;
  variables: Record<string, any>;
  globalVariables: GlobalVariable[];
  onFormulaChange: (nodeId: string, formula: string) => void;
  onOperationChange: (nodeId: string, operation: string) => void;
  onResultVariableChange: (nodeId: string, variable: string) => void;
  updateVariable: (name: string, value: any) => void;
}

interface OutputNodeData {
  outputName: string;
  variables: Record<string, any>;
  employees: Employee[];
  setEmployees: (employees: Employee[]) => void;
  connectedEmployeeId: string | null;
  description: string;
  selectedVariable: string;
  selectedField: string;
  onOutputNameChange: (nodeId: string, name: string) => void;
  onDescriptionChange: (nodeId: string, description: string) => void;
  onSelectedVariableChange: (nodeId: string, variable: string) => void;
  onSelectedFieldChange: (nodeId: string, field: string) => void;
}

interface ElseIfNodeData {
  label: string;
  condition: string;
  truePath: string;
  falsePath: string;
  variables: Record<string, any>;
  globalVariables: GlobalVariable[];
  onConditionChange: (nodeId: string, condition: string) => void;
  onTruePathChange: (nodeId: string, truePath: string) => void;
  onFalsePathChange: (nodeId: string, falsePath: string) => void;
}

interface CodeNodeData {
  label: string;
  code: string;
  outputVariable: string;
  variables: Record<string, any>;
  globalVariables: GlobalVariable[];
  onCodeChange: (nodeId: string, code: string) => void;
  onOutputVariableChange: (nodeId: string, outputVariable: string) => void;
}

type AnyNodeData = NodeData | ComputationNodeData | OutputNodeData | ElseIfNodeData | CodeNodeData;

const nodeTypes = {
  employeeNode: EmployeeNode,
  computationNode: ComputationNode,
  outputNode: OutputNode,
  elseIfNode: ElseIfNode,
  codeNode: CodeNode
};

const CustomEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd
}: EdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })[0];
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const showButton = isHovered || isButtonHovered;
  const pathRef = useRef<SVGPathElement>(null);

  // Create a wider invisible path for better hover detection
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const hoverPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hoverPath.setAttribute('d', edgePath);
    hoverPath.setAttribute('stroke', 'transparent');
    hoverPath.setAttribute('stroke-width', '20');
    hoverPath.setAttribute('fill', 'none');
    hoverPath.style.pointerEvents = 'stroke';

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    hoverPath.addEventListener('mouseenter', handleMouseEnter);
    hoverPath.addEventListener('mouseleave', handleMouseLeave);
    path.parentNode?.insertBefore(hoverPath, path);

    return () => {
      hoverPath.removeEventListener('mouseenter', handleMouseEnter);
      hoverPath.removeEventListener('mouseleave', handleMouseLeave);
      hoverPath.parentNode?.removeChild(hoverPath);
    };
  }, [edgePath]);

  // Handle edge deletion
  const handleDeleteEdge = () => {
    const event = new CustomEvent('delete-edge', {
      detail: { id, source, target }
    });
    window.dispatchEvent(event);
  };

  return (
    <>
      <path 
        ref={pathRef} 
        id={id} 
        style={{
          ...style,
          strokeWidth: showButton ? 3 : 1.5
        }} 
        className={`react-flow__edge-path ${showButton ? 'stroke-red-400' : 'stroke-gray-400'}`} 
        d={edgePath} 
        markerEnd={markerEnd} 
      />
      {showButton && (
        <foreignObject 
          width={30} 
          height={30} 
          x={midX - 15} 
          y={midY - 15} 
          className="overflow-visible" 
          onMouseEnter={() => setIsButtonHovered(true)} 
          onMouseLeave={() => setIsButtonHovered(false)}
        >
          <div 
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-red-500 text-red-500 cursor-pointer hover:bg-red-500 hover:text-white shadow-md transition-colors" 
            title="Break connection" 
            onClick={handleDeleteEdge}
          >
            ✕
          </div>
        </foreignObject>
      )}
    </>
  );
};

const edgeTypes = {
  custom: CustomEdge
};

const PayrollFlowEditor: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const globalVariablesReference = useRef<GlobalVariable[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);
  const [currentFlowVariables, setCurrentFlowVariables] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState('editor');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [isGlobalVariableManagementOpen, setIsGlobalVariableManagementOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [flows, setFlows] = useState<any[]>([]);
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingFlowLoad, setPendingFlowLoad] = useState<{nodes: Node[], edges: Edge[], flowId?: string} | null>(null);
  
  // Keep a reference to the current global variables for use in callbacks
  useEffect(() => {
    globalVariablesReference.current = globalVariables;
  }, [globalVariables]);

  // Set up real-time sync with Firestore for global variables
  useEffect(() => {
    const unsubscribe = onSnapshot(globalVariablesRef, (snapshot) => {
      const globalVarsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GlobalVariable[];
      setGlobalVariables(globalVarsData);
    });

    return () => unsubscribe();
  }, []);

  // Load employee database from Firestore on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoading(true);
        const employeeData = await getAllEmployees();
        if (employeeData.length > 0) {
          setEmployees(employeeData);
        } else {
          // If no employees in database, use sample data
          setEmployees(sampleEmployees);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        toast({
          title: "Error loading employees",
          description: "Failed to load employee database. Using sample data instead.",
          variant: "destructive"
        });
        setEmployees(sampleEmployees);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployees();
  }, []);

  // Load flows from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(flowsRef, (snapshot) => {
      const flowsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFlows(flowsData);
    });

    return () => unsubscribe();
  }, []);

  const initialNodes: Node[] = [{
    id: 'employee-1',
    type: 'employeeNode',
    position: {
      x: 100,
      y: 100
    },
    data: {
      label: 'Employee Base Data',
      sourceField: 'baseSalary',
      variableName: 'salary',
      employeeId: employees.length > 0 ? employees[0].id : '',
      employees: employees,
      customFields: [],
      searchTerm: '',
      onFieldChange: () => {},
      onVariableNameChange: () => {},
      onEmployeeChange: () => {},
      onCustomFieldsChange: () => {},
      onSearchTermChange: () => {}
    }
  }, {
    id: 'computation-1',
    type: 'computationNode',
    position: {
      x: 450,
      y: 100
    },
    data: {
      label: 'Tax Calculation',
      operation: 'multiply',
      formula: 'salary * (1 - taxRate)',
      resultVariable: 'netSalary',
      variables: {},
      globalVariables: globalVariables,
      onFormulaChange: () => {},
      onOperationChange: () => {},
      onResultVariableChange: () => {},
      updateVariable: () => {}
    }
  }, {
    id: 'output-1',
    type: 'outputNode',
    position: {
      x: 800,
      y: 100
    },
    data: {
      outputName: 'Final Salary',
      variables: {},
      employees: employees,
      setEmployees: () => {},
      connectedEmployeeId: null,
      description: '',
      selectedVariable: '',
      selectedField: '',
      onOutputNameChange: () => {},
      onDescriptionChange: () => {},
      onSelectedVariableChange: () => {},
      onSelectedFieldChange: () => {}
    }
  }];

  const initialEdges: Edge[] = [{
    id: 'e1-2',
    source: 'employee-1',
    target: 'computation-1',
    animated: true,
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed
    }
  }, {
    id: 'e2-3',
    source: 'computation-1',
    target: 'output-1',
    animated: true,
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed
    }
  }];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    const variables: Record<string, any> = {};
    const employeeToOutputConnections: Record<string, string> = {};
    const computationResults: Record<string, any> = {};
    const nodeConnections: Record<string, Set<string>> = {};
    const nodeVariables: Record<string, Record<string, any>> = {};

    // Initialize node connections and variables
    nodes.forEach(node => {
      nodeConnections[node.id] = new Set<string>();
      nodeVariables[node.id] = {};
    });

    // Build connection graph
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode) {
        nodeConnections[targetNode.id].add(sourceNode.id);

        // Track employee to output connections
        if (sourceNode.type === 'employeeNode' && targetNode.type === 'outputNode') {
          const employeeId = (sourceNode.data as unknown as NodeData).employeeId;
          employeeToOutputConnections[targetNode.id] = employeeId;
        }
      }
    });

    // Process employee nodes first
    nodes.forEach(node => {
      if (node.type === 'employeeNode') {
        const employeeId = (node.data as unknown as NodeData).employeeId;
        const employee = employees.find(emp => emp.id === employeeId);
        
        if (employee) {
          // Make all employee fields available as variables
          Object.entries(employee.fields).forEach(([fieldName, value]) => {
            variables[fieldName] = value;
            nodeVariables[node.id][fieldName] = value;
          });
        }
      }
    });

    // Add global variables to the variables object using the ref
    // This way we don't need globalVariables in the dependency array
    globalVariablesReference.current.forEach(variable => {
      variables[variable.name] = variable.value;
    });

    // Process computation nodes
    nodes.forEach(node => {
      if (node.type === 'computationNode') {
        // Update node with current variables
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            variables
          }
        };
        setNodes(nodes => nodes.map(n => n.id === node.id ? updatedNode : n));

        // Store computation result if available
        const resultVariable = (node.data as unknown as ComputationNodeData).resultVariable;
        if (resultVariable && resultVariable in variables) {
          computationResults[node.id] = variables[resultVariable];
        }
      }
    });

    // Process code nodes
    nodes.forEach(node => {
      if (node.type === 'codeNode') {
        // Update node with current variables
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            variables
          }
        };
        setNodes(nodes => nodes.map(n => n.id === node.id ? updatedNode : n));
      }
    });

    // Process else-if nodes
    nodes.forEach(node => {
      if (node.type === 'elseIfNode') {
        // Update node with current variables
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            variables
          }
        };
        setNodes(nodes => nodes.map(n => n.id === node.id ? updatedNode : n));
      }
    });

    // Process output nodes
    nodes.forEach(node => {
      if (node.type === 'outputNode') {
        // Get connected employee ID if any
        const connectedEmployeeId = employeeToOutputConnections[node.id] || null;

        // Update node with current variables and connected employee
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            variables,
            connectedEmployeeId,
            employees,
            setEmployees: setEmployees
          }
        };
        setNodes(nodes => nodes.map(n => n.id === node.id ? updatedNode : n));
      }
    });

    // Update current flow variables
    setCurrentFlowVariables(variables);
  }, [nodes, edges, employees, setNodes, setCurrentFlowVariables, setEmployees]);

  useEffect(() => {
    // Initialize global variables
    // Removed initialGlobalVariables import which is no longer needed
  }, []); // Run once when component mounts

  useEffect(() => {
    if (currentFlowId && !isLoading) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, edges, currentFlowId, isLoading]);

  const updateVariable = useCallback((name: string, value: any) => {
    setCurrentFlowVariables(prev => {
      if (prev[name] === value) return prev;
      const updated = {
        ...prev,
        [name]: value
      };
      setTimeout(() => {
        setNodes(nodes => [...nodes]);
      }, 0);
      return updated;
    });
  }, [setNodes]);

  const onSelectionChange = useCallback(({
    nodes,
    edges
  }: {
    nodes: Node[];
    edges: Edge[];
  }) => {
    setSelectedNodes(nodes.map(node => node.id));
    setSelectedEdges(edges.map(edge => edge.id));
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) {
      toast({
        title: "No nodes selected",
        description: "Please select one or more nodes to delete"
      });
      return;
    }
    setNodes(nodes => nodes.filter(node => !selectedNodes.includes(node.id)));
    setEdges(edges => edges.filter(edge => !selectedNodes.includes(edge.source) && !selectedNodes.includes(edge.target)));
    toast({
      title: "Nodes deleted",
      description: `${selectedNodes.length} node(s) deleted from flow`
    });
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  const onFieldChange = useCallback((nodeId: string, field: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as NodeData).sourceField = field;
      }
      return node;
    }));
  }, [setNodes]);

  const onVariableNameChange = useCallback((nodeId: string, name: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as NodeData).variableName = name;
      }
      return node;
    }));
  }, [setNodes]);

  const onEmployeeChange = useCallback((nodeId: string, employeeId: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as NodeData).employeeId = employeeId;
      }
      return node;
    }));
  }, [setNodes]);

  const onCustomFieldsChange = useCallback((nodeId: string, customFields: any[]) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as NodeData).customFields = customFields;
      }
      return node;
    }));
  }, [setNodes]);

  const onSearchTermChange = useCallback((nodeId: string, searchTerm: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as NodeData).searchTerm = searchTerm;
      }
      return node;
    }));
  }, [setNodes]);

  const onFormulaChange = useCallback((nodeId: string, formula: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ComputationNodeData).formula = formula;
      }
      return node;
    }));
  }, [setNodes]);

  const onOperationChange = useCallback((nodeId: string, operation: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ComputationNodeData).operation = operation;
      }
      return node;
    }));
  }, [setNodes]);

  const onResultVariableChange = useCallback((nodeId: string, variable: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ComputationNodeData).resultVariable = variable;
      }
      return node;
    }));
  }, [setNodes]);

  const onOutputNameChange = useCallback((nodeId: string, name: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as OutputNodeData).outputName = name;
      }
      return node;
    }));
    toast({
      title: "Output name updated",
      description: `Output name changed to "${name}"`
    });
  }, [setNodes]);

  const onDescriptionChange = useCallback((nodeId: string, description: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as OutputNodeData).description = description;
      }
      return node;
    }));
  }, [setNodes]);

  const onSelectedVariableChange = useCallback((nodeId: string, variable: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as OutputNodeData).selectedVariable = variable;
      }
      return node;
    }));
  }, [setNodes]);

  const onSelectedFieldChange = useCallback((nodeId: string, field: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as OutputNodeData).selectedField = field;
      }
      return node;
    }));
  }, [setNodes]);

  const onConditionChange = useCallback((nodeId: string, condition: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ElseIfNodeData).condition = condition;
      }
      return node;
    }));
  }, [setNodes]);

  const onTruePathChange = useCallback((nodeId: string, truePath: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ElseIfNodeData).truePath = truePath;
      }
      return node;
    }));
  }, [setNodes]);

  const onFalsePathChange = useCallback((nodeId: string, falsePath: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as ElseIfNodeData).falsePath = falsePath;
      }
      return node;
    }));
  }, [setNodes]);

  const onCodeChange = useCallback((nodeId: string, code: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as CodeNodeData).code = code;
      }
      return node;
    }));
  }, [setNodes]);

  const onOutputVariableChange = useCallback((nodeId: string, outputVariable: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        (node.data as unknown as CodeNodeData).outputVariable = outputVariable;
      }
      return node;
    }));
  }, [setNodes]);

  const loadFlow = useCallback((loadedNodes: Node[], loadedEdges: Edge[], flowId?: string) => {
    if (hasUnsavedChanges && currentFlowId) {
      // Show custom dialog instead of browser confirm
      setPendingFlowLoad({ nodes: loadedNodes, edges: loadedEdges, flowId });
      setShowUnsavedChangesDialog(true);
      return;
    }
    
    // Proceed with loading the flow
    proceedWithFlowLoad(loadedNodes, loadedEdges, flowId);
  }, [hasUnsavedChanges, currentFlowId]);

  const proceedWithFlowLoad = useCallback((loadedNodes: Node[], loadedEdges: Edge[], flowId?: string) => {
    setIsLoading(true);
    
    // Clear current flow variables
    setCurrentFlowVariables({});
    
    // Set current flow ID if provided
    if (flowId) {
      setCurrentFlowId(flowId);
    } else {
      setCurrentFlowId(null);
    }
    
    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
    
    setNodes(loadedNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        employees,
        variables: currentFlowVariables,
        globalVariables,
        onFieldChange,
        onVariableNameChange,
        onEmployeeChange,
        onCustomFieldsChange,
        onSearchTermChange,
        onFormulaChange,
        onOperationChange,
        onResultVariableChange,
        setEmployees,
        onOutputNameChange,
        onDescriptionChange,
        onSelectedVariableChange,
        onSelectedFieldChange,
        onConditionChange,
        onTruePathChange,
        onFalsePathChange,
        onCodeChange,
        onOutputVariableChange,
        updateVariable
      }
    })));
    setEdges(loadedEdges);
    
    toast({
      title: "Flow loaded",
      description: "The selected flow has been loaded successfully"
    });
    setIsLoading(false);
  }, [
    employees, globalVariables, currentFlowVariables, setEmployees,
    onFieldChange, onVariableNameChange, onEmployeeChange, onCustomFieldsChange,
    onSearchTermChange, onFormulaChange, onOperationChange, onResultVariableChange, 
    onOutputNameChange, onDescriptionChange, onConditionChange, 
    onTruePathChange, onFalsePathChange, onCodeChange, 
    onOutputVariableChange, updateVariable, setNodes, setEdges, setCurrentFlowId, setHasUnsavedChanges, setIsLoading
  ]);

  const updateNodesWithCallbacks = useCallback(() => {
    setNodes(nds => nds.map(node => {
      if (node.type === 'employeeNode') {
        const data = node.data as unknown as NodeData;
        data.employees = employees;
        data.onFieldChange = onFieldChange;
        data.onVariableNameChange = onVariableNameChange;
        data.onEmployeeChange = onEmployeeChange;
        data.onCustomFieldsChange = onCustomFieldsChange;
        data.onSearchTermChange = onSearchTermChange;
      } else if (node.type === 'computationNode') {
        const data = node.data as unknown as ComputationNodeData;
        data.variables = currentFlowVariables;
        data.globalVariables = globalVariables;
        data.onFormulaChange = onFormulaChange;
        data.onOperationChange = onOperationChange;
        data.onResultVariableChange = onResultVariableChange;
        data.updateVariable = updateVariable;
      } else if (node.type === 'outputNode') {
        const data = node.data as unknown as OutputNodeData;
        data.variables = currentFlowVariables;
        data.employees = employees;
        data.setEmployees = setEmployees;
        data.onOutputNameChange = onOutputNameChange;
        data.onDescriptionChange = onDescriptionChange;
        data.onSelectedVariableChange = onSelectedVariableChange;
        data.onSelectedFieldChange = onSelectedFieldChange;
      } else if (node.type === 'elseIfNode') {
        const data = node.data as unknown as ElseIfNodeData;
        data.variables = currentFlowVariables;
        data.globalVariables = globalVariables;
        data.onConditionChange = onConditionChange;
        data.onTruePathChange = onTruePathChange;
        data.onFalsePathChange = onFalsePathChange;
      } else if (node.type === 'codeNode') {
        const data = node.data as unknown as CodeNodeData;
        data.variables = currentFlowVariables;
        data.globalVariables = globalVariables;
        data.onCodeChange = onCodeChange;
        data.onOutputVariableChange = onOutputVariableChange;
      }
      return node;
    }));
  }, [
    employees, 
    currentFlowVariables, 
    globalVariables, 
    onFieldChange, 
    onVariableNameChange, 
    onEmployeeChange, 
    onCustomFieldsChange, 
    onSearchTermChange, 
    onFormulaChange, 
    onOperationChange, 
    onResultVariableChange, 
    updateVariable, 
    setEmployees, 
    onOutputNameChange, 
    onDescriptionChange, 
    onConditionChange, 
    onTruePathChange, 
    onFalsePathChange, 
    onCodeChange, 
    onOutputVariableChange, 
    onSelectedVariableChange, 
    onSelectedFieldChange
  ]);

  useEffect(() => {
    updateNodesWithCallbacks();
  }, [updateNodesWithCallbacks]);

  const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge({
    ...params,
    animated: true,
    type: 'custom',
    markerEnd: {
      type: MarkerType.ArrowClosed
    }
  }, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowWrapper.current || !reactFlowInstance) return;
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) {
      return;
    }
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    });
    const id = `${type.replace('Node', '')}-${Math.floor(Math.random() * 10000)}`;
    let newNode: Node = {
      id,
      type,
      position,
      data: {}
    };
    if (type === 'employeeNode') {
      newNode.data = {
        label: 'Employee Data',
        sourceField: employees.length > 0 && employees[0].fields ? Object.keys(employees[0].fields)[0] : '',
        variableName: 'employeeVar',
        employeeId: employees.length > 0 ? employees[0].id : '',
        employees: employees,
        onFieldChange,
        onVariableNameChange,
        onEmployeeChange,
        onCustomFieldsChange,
        onSearchTermChange,
        searchTerm: ''
      };
    } else if (type === 'computationNode') {
      newNode.data = {
        label: 'Computation',
        operation: 'custom',
        formula: '',
        resultVariable: 'result',
        variables: currentFlowVariables,
        globalVariables: globalVariables,
        onFormulaChange,
        onOperationChange,
        onResultVariableChange,
        updateVariable
      };
    } else if (type === 'outputNode') {
      newNode.data = {
        label: 'Output',
        outputName: 'Result',
        description: 'Final result of the calculation',
        variables: currentFlowVariables,
        employees: employees,
        setEmployees: setEmployees,
        connectedEmployeeId: null,
        selectedVariable: '',
        selectedField: '',
        onOutputNameChange,
        onDescriptionChange,
        onSelectedVariableChange,
        onSelectedFieldChange
      };
    } else if (type === 'elseIfNode') {
      newNode.data = {
        label: 'Condition',
        condition: 'salary > 5000',
        truePath: 'highSalary',
        falsePath: 'lowSalary',
        variables: currentFlowVariables,
        globalVariables: globalVariables,
        onConditionChange,
        onTruePathChange,
        onFalsePathChange
      };
    } else if (type === 'codeNode') {
      newNode.data = {
        label: 'Custom Code',
        code: '// Write your code here\nreturn salary * 1.1;',
        outputVariable: 'processedSalary',
        variables: currentFlowVariables,
        globalVariables: globalVariables,
        onCodeChange,
        onOutputVariableChange
      };
    }
    setNodes(nds => nds.concat(newNode));
  }, [reactFlowInstance, setNodes, employees, globalVariables, currentFlowVariables, 
      onFieldChange, onVariableNameChange, onEmployeeChange, onCustomFieldsChange,
      onSearchTermChange, onFormulaChange, onOperationChange, onResultVariableChange, 
      onOutputNameChange, onDescriptionChange, onConditionChange, 
      onTruePathChange, onFalsePathChange, onCodeChange, 
      onOutputVariableChange, updateVariable, onSelectedVariableChange, onSelectedFieldChange]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  useEffect(() => {
    const handleDeleteEdge = (event: Event) => {
      const customEvent = event as CustomEvent;
      const edgeId = customEvent.detail.id;
      setEdges(edges => edges.filter(edge => edge.id !== edgeId));
      toast({
        title: "Connection removed",
        description: "The connection between nodes has been deleted"
      });
    };
    window.addEventListener('delete-edge', handleDeleteEdge);
    return () => {
      window.removeEventListener('delete-edge', handleDeleteEdge);
    };
  }, [setEdges]);

  const runPayrollFlow = () => {
    toast({
      title: "Payroll flow executed",
      description: "Variables available: " + Object.keys(currentFlowVariables).join(', ')
    });
  };

  const handleShowEmployeeFlow = (employeeId: string, fieldName: string) => {
    const employeeNodes = nodes.filter(node => 
      node.type === 'employeeNode' && (node.data as unknown as NodeData).employeeId === employeeId
    );
    
    if (employeeNodes.length > 0) {
      setActiveTab('editor');
      
      const node = employeeNodes[0];
      if (reactFlowInstance) {
        reactFlowInstance.fitView({
          nodes: [node],
          padding: 0.2,
          duration: 800
        });
        
        setNodes(nds => nds.map(n => ({
          ...n,
          selected: n.id === node.id
        })));
        
        toast({
          title: "Flow visualization",
          description: `Showing flow for ${fieldName} of employee ${employeeId}`
        });
      }
    }
  };

  const saveCurrentFlow = async () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a name for the flow",
        variant: "destructive"
      });
      return;
    }

    try {
      const flowId = `flow-${Date.now()}`;
      const flowData = {
        name: newFlowName,
        description: newFlowDescription,
        nodes: nodes.map(node => ({
          ...node,
          data: { ...node.data }
        })),
        edges: edges
      };

      await addFlow(flowId, flowData);
      
      setCurrentFlowId(flowId);
      setHasUnsavedChanges(false);
      setShowSaveDialog(false);
      setNewFlowName('');
      setNewFlowDescription('');
      
      toast({
        title: "Flow saved",
        description: "Your flow has been saved successfully"
      });
    } catch (error) {
      console.error("Error saving flow:", error);
      toast({
        title: "Error",
        description: "Failed to save flow. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updateCurrentFlow = async () => {
    if (!currentFlowId) {
      toast({
        title: "Error",
        description: "No flow is currently loaded",
        variant: "destructive"
      });
      return;
    }

    try {
      const currentFlow = flows.find(flow => flow.id === currentFlowId);
      if (!currentFlow) {
        toast({
          title: "Error",
          description: "Could not find the current flow",
          variant: "destructive"
        });
        return;
      }

      const flowData = {
        name: currentFlow.name,
        description: currentFlow.description,
        nodes: nodes.map(node => ({
          ...node,
          data: { ...node.data }
        })),
        edges: edges
      };

      await updateFlow(currentFlowId, flowData);
      
      setHasUnsavedChanges(false);
      
      toast({
        title: "Flow updated",
        description: "Your flow has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating flow:", error);
      toast({
        title: "Error",
        description: "Failed to update flow. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b px-1">
            <TabsList className="h-8 mb-0">
              <TabsTrigger value="editor" className="flex items-center gap-1 text-xs py-1">
                <DollarSign className="h-3 w-3" /> Payroll Flow
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-1 text-xs py-1">
                <Database className="h-3 w-3" /> Employees
              </TabsTrigger>
            </TabsList>
          </div>
          
          {activeTab === "editor" && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 border-r h-full overflow-auto scrollbar-visible">
                <Sidebar onDragStart={onDragStart} globalVariables={globalVariables} />
              </div>
              <div className="flex-1 h-full" ref={reactFlowWrapper}>
                <ReactFlow 
                  nodes={nodes} 
                  edges={edges} 
                  onNodesChange={onNodesChange} 
                  onEdgesChange={onEdgesChange} 
                  onConnect={onConnect} 
                  onInit={setReactFlowInstance} 
                  onDrop={onDrop} 
                  onDragOver={onDragOver} 
                  nodeTypes={nodeTypes} 
                  edgeTypes={edgeTypes} 
                  onSelectionChange={onSelectionChange} 
                  fitView
                  minZoom={0.4}
                  maxZoom={1.5}
                  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                >
                  <Controls position="bottom-right" showInteractive={false} className="scale-75" />
                  <MiniMap 
                    nodeStrokeWidth={2} 
                    zoomable 
                    pannable 
                    position="bottom-left" 
                    className="scale-75 opacity-70 hover:opacity-100 transition-opacity"
                    nodeBorderRadius={2}
                    maskColor="rgba(240, 240, 240, 0.4)"
                  />
                  <Background color="#aaa" gap={16} />
                  <Panel position="top-right" className="flex flex-col gap-1.5 items-end">
                    <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 rounded-md p-1.5 flex flex-col gap-1.5 w-36">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-start"
                        onClick={() => {
                          loadFlow([], []);
                        }}
                      >
                        <FileText className="h-3 w-3 mr-1.5" /> New Flow
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className={`text-xs h-7 w-full px-2 py-1 transition-all flex items-center justify-start ${
                          hasUnsavedChanges && currentFlowId 
                            ? "bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300 text-red-600" 
                            : "hover:bg-blue-50 hover:border-blue-200"
                        }`}
                        onClick={() => {
                          if (hasUnsavedChanges && currentFlowId) {
                            updateCurrentFlow();
                          } else {
                            setShowSaveDialog(true);
                          }
                        }}
                      >
                        <Save className="h-3 w-3 mr-1.5" /> 
                        {hasUnsavedChanges && currentFlowId ? "Update Flow" : "Save Flow"}
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-start"
                        onClick={() => setShowLoadDialog(true)}
                      >
                        <FileDown className="h-3 w-3 mr-1.5" /> Load Flow
                      </Button>
                      
                      <div className="border-t border-gray-200 my-0.5"></div>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-green-50 hover:border-green-200 transition-all flex items-center justify-start"
                        onClick={runPayrollFlow}
                      >
                        <DollarSign className="h-3 w-3 mr-1.5" /> Run Flow
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-start"
                        onClick={() => setIsGlobalVariableManagementOpen(true)}
                      >
                        <Variable className="h-3 w-3 mr-1.5" /> Variables
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-cyan-50 hover:border-cyan-200 transition-all flex items-center justify-start"
                        onClick={() => {
                          if (reactFlowInstance) {
                            reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
                          }
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1.5" /> Fit View
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7 w-full px-2 py-1 hover:bg-red-50 hover:border-red-200 transition-all flex items-center justify-start"
                        onClick={deleteSelectedNodes}
                        disabled={selectedNodes.length === 0}
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" /> Delete Node
                      </Button>
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            </div>
          )}
          
          {activeTab === "database" && (
            <div className="flex-1 p-0 m-0 overflow-hidden bg-white">
              <div className="h-full overflow-auto scrollbar-visible bg-white">
                <EmployeeDatabase 
                  employees={employees} 
                  setEmployees={setEmployees} 
                  globalVariables={globalVariables} 
                  setGlobalVariables={setGlobalVariables}
                  nodes={nodes}
                  edges={edges}
                  onShowFlow={handleShowEmployeeFlow}
                />
              </div>
            </div>
          )}
        </Tabs>
      </div>
      
      {/* Global Variables Management */}
      <GlobalVariablesManager 
        isOpen={isGlobalVariableManagementOpen}
        onClose={() => setIsGlobalVariableManagementOpen(false)}
      />
      
      {/* Save Flow Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Flow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flow-name">Flow Name</Label>
              <Input 
                id="flow-name" 
                value={newFlowName} 
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Enter a name for this flow"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="flow-description">Description (optional)</Label>
              <Input 
                id="flow-description" 
                value={newFlowDescription} 
                onChange={(e) => setNewFlowDescription(e.target.value)}
                placeholder="Enter a description for this flow"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={saveCurrentFlow}>Save Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <Dialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-600">Unsaved Changes</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-2">You have unsaved changes to the current flow.</p>
            <p>What would you like to do?</p>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUnsavedChangesDialog(false);
                setPendingFlowLoad(null);
              }}
            >
              Cancel
            </Button>
            <div className="space-x-2">
              <Button 
                variant="outline"
                className="border-amber-200 bg-amber-50 hover:bg-amber-100 hover:text-amber-900"
                onClick={() => {
                  if (currentFlowId) {
                    updateCurrentFlow().then(() => {
                      if (pendingFlowLoad) {
                        proceedWithFlowLoad(
                          pendingFlowLoad.nodes, 
                          pendingFlowLoad.edges, 
                          pendingFlowLoad.flowId
                        );
                      }
                      setShowUnsavedChangesDialog(false);
                      setPendingFlowLoad(null);
                    });
                  }
                }}
              >
                Save Changes
              </Button>
              <Button 
                variant="outline"
                className="border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-900"
                onClick={() => {
                  if (pendingFlowLoad) {
                    proceedWithFlowLoad(
                      pendingFlowLoad.nodes, 
                      pendingFlowLoad.edges, 
                      pendingFlowLoad.flowId
                    );
                  }
                  setShowUnsavedChangesDialog(false);
                  setPendingFlowLoad(null);
                }}
              >
                Discard Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Flow Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Load Flow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {flows.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No saved flows found
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr,auto,auto] gap-4 font-medium text-sm">
                  <div>Name</div>
                  <div>Last Updated</div>
                  <div>Actions</div>
                </div>
                
                {flows.map(flow => (
                  <div key={flow.id} className="grid grid-cols-[1fr,auto,auto] gap-4 items-center py-2 border-b">
                    <div>
                      <div className="font-medium">{flow.name}</div>
                      {flow.description && <div className="text-xs text-gray-500">{flow.description}</div>}
                    </div>
                    <div className="text-sm text-gray-500">
                      {flow.updatedAt ? new Date(flow.updatedAt.toDate()).toLocaleString() : 'N/A'}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          loadFlow(flow.nodes, flow.edges, flow.id);
                          setShowLoadDialog(false);
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PayrollFlowEditor;
