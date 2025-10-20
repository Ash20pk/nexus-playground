import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Play,
  Save,
  FileText,
  Settings,
  Share,
  Download,
  Upload,
  Pause,
  ArrowLeft
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useNexus } from '@/provider/NexusProvider';
import ConnectWallet from '../blocks/connect-wallet';
import Link from 'next/link';
import { toast } from 'sonner';

export const WorkflowToolbar: React.FC = () => {
  const {
    currentWorkflow,
    isExecuting,
    execution,
    saveCurrentWorkflow,
    executeWorkflow,
    stopExecution,
    updateWorkflowMetadata
  } = useWorkflowStore();

  const { nexusSdk, isInitialized } = useNexus();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState(currentWorkflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(currentWorkflow?.description || '');

  const handleSave = () => {
    if (!currentWorkflow) return;

    saveCurrentWorkflow();
    toast.success('Workflow saved successfully!');
  };

  const handleExecute = async () => {
    if (!currentWorkflow) return;

    if (currentWorkflow.nodes.length === 0) {
      toast.error('Add some nodes to your workflow first!');
      return;
    }

    const triggerNode = currentWorkflow.nodes.find(n => n.data.type === 'trigger');
    if (!triggerNode) {
      toast.error('Your workflow needs a trigger node to start execution!');
      return;
    }

    // Check if NexusSDK is initialized
    if (!isInitialized || !nexusSdk) {
      toast.error('Please connect your wallet to execute workflows!');
      return;
    }

    await executeWorkflow(nexusSdk);
  };

  const handleStop = () => {
    stopExecution();
    toast.warning('Workflow execution stopped');
  };

  const handleSettingsSave = () => {
    updateWorkflowMetadata({
      name: workflowName,
      description: workflowDescription
    });
    setIsSettingsOpen(false);
    toast.success('Workflow settings updated!');
  };

  const handleExport = () => {
    if (!currentWorkflow) return;

    const dataStr = JSON.stringify(currentWorkflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentWorkflow.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Workflow exported successfully!');
  };

  const getExecutionStatus = () => {
    if (!execution) return null;

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={statusColors[execution.status]}>
        {execution.status}
      </Badge>
    );
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Link href="/studio" className="flex items-center gap-3 mr-6 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
            <h1 className="text-3xl font-black text-black tracking-tight">
                  Nexus Playground
            </h1>
          </Link>
          <div className="border-l border-gray-200 pl-4">
            <h2 className="text-lg text-gray-600 font-semibold">
              {currentWorkflow?.name || 'Untitled Workflow'}
            </h2>
            <p className="text-sm text-gray-600">
              {currentWorkflow?.nodes.length || 0} nodes • {currentWorkflow?.edges.length || 0} connections
            </p>
          </div>
          {getExecutionStatus()}
        </div>

        <div className="flex items-center gap-3">
          <ConnectWallet />

          <div className="border-l border-gray-200 pl-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={!currentWorkflow}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>

          {isExecuting ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleStop}
            >
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleExecute}
              disabled={!currentWorkflow || !isInitialized}
              title={!isInitialized ? 'Connect your wallet to execute workflows' : 'Execute workflow'}
            >
              <Play className="h-4 w-4 mr-2" />
              {!isInitialized ? 'Connect Wallet' : 'Execute'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!currentWorkflow}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkflowName(currentWorkflow?.name || '');
                  setWorkflowDescription(currentWorkflow?.description || '');
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Workflow Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Workflow Name
                  </label>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border rounded-md resize-none"
                    rows={3}
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe what this workflow does"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsSettingsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSettingsSave}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};