'use client';

import React, { useCallback, useMemo, useState } from 'react';
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
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import { WorkflowNode } from './WorkflowNode';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { WorkflowToolbar } from './WorkflowToolbar';
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
    deleteEdge
  } = useWorkflowStore();

  const [isNodePaletteOpen, setIsNodePaletteOpen] = useState(false);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState(currentWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentWorkflow?.edges || []);

  // Update local state when store changes
  React.useEffect(() => {
    if (currentWorkflow) {
      setNodes(currentWorkflow.nodes);
      setEdges(currentWorkflow.edges);
    }
  }, [currentWorkflow, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = addEdge(connection, edges);
      setEdges(newEdge);
      addEdgeToStore(connection);
    },
    [edges, setEdges, addEdgeToStore]
  );

  const onAddNode = useCallback(
    (type: WorkflowNodeType) => {
      const position = {
        x: Math.random() * 400,
        y: Math.random() * 400
      };
      addNodeToStore(type, position);
    },
    [addNodeToStore]
  );

  const onDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((edges) => edges.filter((edge) => edge.id !== edgeId));
      deleteEdge(edgeId);
    },
    [setEdges, deleteEdge]
  );

  const selectedNode = useMemo(() => {
    return nodes.find((node) => node.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  // Open config panel when a node is selected
  React.useEffect(() => {
    if (selectedNodeId) {
      setIsConfigPanelOpen(true);
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-gray-50"
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
        <Dialog open={isConfigPanelOpen} onOpenChange={setIsConfigPanelOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
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