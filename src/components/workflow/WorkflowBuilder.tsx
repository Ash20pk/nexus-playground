'use client';

import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  Node,
  Edge,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import { WorkflowNode } from './WorkflowNode';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowLegend } from './WorkflowLegend';
import { useWorkflowStore } from '@/store/workflowStore';
import { WorkflowNodeType } from '@/types/workflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const nodeTypes = {
  workflowNode: WorkflowNode
};

export const WorkflowBuilder: React.FC = () => {
  const {
    currentWorkflow,
    selectedNodeId,
    addNode: addNodeToStore,
    addEdge: addEdgeToStore,
    deleteEdge,
    updateNodePositions
  } = useWorkflowStore();

  const positionUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reactFlowInstance = useReactFlow();

  const [isNodePaletteOpen, setIsNodePaletteOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflow?.edges || []);
  const [isDragging, setIsDragging] = React.useState(false);
  const prevWorkflowIdRef = useRef<string | null>(null);
  const prevWorkflowUpdatedRef = useRef<number | null>(null);

  // Sync node positions back to store with debounce
  const syncNodePositions = useCallback((updatedNodes: Node[]) => {
    if (positionUpdateTimeoutRef.current) {
      clearTimeout(positionUpdateTimeoutRef.current);
    }
    
    positionUpdateTimeoutRef.current = setTimeout(() => {
      const updates = updatedNodes.map(node => ({
        id: node.id,
        position: node.position
      }));
      updateNodePositions(updates);
    }, 300); // Debounce for 300ms
  }, [updateNodePositions]);

  // Custom nodes change handler that also syncs positions
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    // Track dragging state
    const isDraggingNow = changes.some(
      (change: any) => change.type === 'position' && change.dragging === true
    );
    
    const dragEnded = changes.some(
      (change: any) => change.type === 'position' && change.dragging === false
    );
    
    if (isDraggingNow) {
      setIsDragging(true);
    } else if (dragEnded) {
      setIsDragging(false);
      // Sync positions after drag ends
      setNodes((currentNodes) => {
        syncNodePositions(currentNodes);
        return currentNodes;
      });
    }
  }, [onNodesChange, setNodes, syncNodePositions]);

  // Sync from store when workflow changes, nodes/edges are added/removed, or when workflow updated timestamp changes
  React.useEffect(() => {
    if (!currentWorkflow) return;

    const workflowChanged = prevWorkflowIdRef.current !== currentWorkflow.id;
    const nodeCountChanged = nodes.length !== currentWorkflow.nodes.length;
    const edgeCountChanged = edges.length !== currentWorkflow.edges.length;
    const currentUpdatedTs = Number(new Date(currentWorkflow.updated as any));
    const updatedChanged = prevWorkflowUpdatedRef.current !== currentUpdatedTs;

    // Update if workflow changed, nodes/edges count changed, or workflow timestamp changed (but not during dragging)
    if (workflowChanged || ((!isDragging) && (nodeCountChanged || edgeCountChanged || updatedChanged))) {
      setNodes(currentWorkflow.nodes);
      setEdges(currentWorkflow.edges);
      prevWorkflowIdRef.current = currentWorkflow.id;
      prevWorkflowUpdatedRef.current = currentUpdatedTs;
    }
  }, [currentWorkflow, nodes.length, edges.length, isDragging, setNodes, setEdges]);

  // Remove the problematic effect that was causing selectedNode to be cleared

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (positionUpdateTimeoutRef.current) {
        clearTimeout(positionUpdateTimeoutRef.current);
      }
    };
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
      addEdgeToStore(connection);
    },
    [setEdges, addEdgeToStore]
  );

  // Validate connections to ensure proper handle matching
  const isValidConnection = useCallback((connection: Connection | Edge) => {
    // Allow all connections - React Flow will handle the visual feedback
    // We just need to ensure handles are properly identified
    return true;
  }, []);

  const onAddNode = useCallback(
    (type: WorkflowNodeType) => {
      // Get the current viewport to place node in visible area
      const viewport = reactFlowInstance.getViewport();
      const { x: viewX, y: viewY, zoom } = viewport;
      
      // Calculate center of viewport in flow coordinates
      const centerX = -viewX / zoom + (window.innerWidth / 2) / zoom;
      const centerY = -viewY / zoom + (window.innerHeight / 2) / zoom;
      
      // Add some randomness around center to avoid overlapping
      const position = {
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + (Math.random() - 0.5) * 200
      };
      
      addNodeToStore(type, position);
    },
    [addNodeToStore, reactFlowInstance]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
      deleteEdge(edgeId);
    },
    [setEdges, deleteEdge]
  );

  const selectedNode = useMemo(() => {
    const found = nodes.find((node) => node.id === selectedNodeId);
    console.log('🎯 selectedNode computed:', { selectedNodeId, found: !!found, nodesLength: nodes.length });
    if (selectedNodeId && !found) {
      console.log('⚠️ Node not found in nodes array!', { selectedNodeId, nodeIds: nodes.map(n => n.id) });
    }
    return found;
  }, [nodes, selectedNodeId]);

  // Open config panel when a node is selected
  React.useEffect(() => {
    console.log('🔄 selectedNodeId changed:', selectedNodeId);
    if (selectedNodeId) {
      console.log('✅ Opening config panel for node:', selectedNodeId);
      setIsConfigPanelOpen(true);
    } else {
      console.log('❌ Closing config panel - no node selected');
      setIsConfigPanelOpen(false);
    }
  }, [selectedNodeId]);

  if (!currentWorkflow) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No workflow loaded
          </h3>
          <p className="text-gray-600">
            Create a new workflow or load an existing one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Main Canvas */}
      <div className="h-full">
        <WorkflowToolbar />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
          }}
          className="bg-gray-50"
          snapToGrid={true}
          snapGrid={[15, 15]}
          deleteKeyCode="Delete"
          connectionRadius={30}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>

      {/* Floating Add Node Button */}
      <Button
        size="lg"
        className="fixed bottom-8 left-8 rounded-full h-14 w-14 p-0 shadow-[-6px_6px_0_0_#000000] hover:shadow-[-8px_8px_0_0_#000000] z-10"
        onClick={() => setIsNodePaletteOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Legend/Help */}
      <WorkflowLegend />

      {/* Node Palette Dialog */}
      <Dialog open={isNodePaletteOpen} onOpenChange={setIsNodePaletteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Node</DialogTitle>
          </DialogHeader>
          <NodePalette onAddNode={(type) => {
            onAddNode(type);
            setIsNodePaletteOpen(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* Node Configuration Dialog */}
      {selectedNode && (
        <Dialog
          open={isConfigPanelOpen}
          onOpenChange={(open) => {
            console.log('🚪 Dialog onOpenChange called:', { open, selectedNodeId });
            if (!open) {
              console.log('🔴 Dialog closing - clearing selection');
              setIsConfigPanelOpen(false);
              useWorkflowStore.getState().setSelectedNode(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>Node Configuration</DialogTitle>
            </DialogHeader>
            <NodeConfigPanel
              node={selectedNode}
              onDeleteEdge={onDeleteEdge}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};