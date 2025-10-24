import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
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
  Edit,
  Copy,
  Trash2,
  Plus,
  Search,
  Download,
  Upload,
  Globe
} from 'lucide-react';
import { Workflow, WorkflowTemplate } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { useRouter } from 'next/navigation';
import ConnectWallet from '../blocks/connect-wallet';
import { toast } from 'sonner';

interface WorkflowListProps {
  onSelectWorkflow?: (workflow: Workflow) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({ onSelectWorkflow }) => {
  const router = useRouter();
  const {
    savedWorkflows,
    createNewWorkflow,
    loadWorkflow,
    saveWorkflows,
    loadWorkflows
  } = useWorkflowStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [publicWorkflows, setPublicWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    loadWorkflows();
    fetchTemplates();
    fetchPublicWorkflows();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/workflows/templates');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchPublicWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows?public=true');
      const data = await response.json();
      if (data.success) {
        setPublicWorkflows(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch public workflows:', error);
    }
  };

  const handleCreateNew = () => {
    createNewWorkflow('New Workflow');
    const { currentWorkflow } = useWorkflowStore.getState();
    if (currentWorkflow) {
      router.push(`/studio/${currentWorkflow.id}`);
    }
    toast.success('New workflow created!');
  };

  const handleLoadTemplate = (template: WorkflowTemplate) => {
    const workflow: Workflow = {
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
      description: template.description,
      nodes: template.nodes,
      edges: template.edges,
      created: new Date(),
      updated: new Date(),
      isPublic: false,
      tags: [template.category]
    };

    loadWorkflow(workflow);
    router.push(`/studio/${workflow.id}`);
    setIsTemplateDialogOpen(false);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleSelectWorkflow = (workflow: Workflow) => {
    loadWorkflow(workflow);
    router.push(`/studio/${workflow.id}`);
  };

  const handleDuplicateWorkflow = (workflow: Workflow) => {
    const duplicated: Workflow = {
      ...workflow,
      id: crypto.randomUUID(),
      name: `${workflow.name} (Copy)`,
      created: new Date(),
      updated: new Date()
    };

    loadWorkflow(duplicated);
    router.push(`/studio/${duplicated.id}`);
    toast.success('Workflow duplicated!');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow: Workflow = JSON.parse(e.target?.result as string);
        workflow.id = crypto.randomUUID(); // Generate new ID
        workflow.created = new Date();
        workflow.updated = new Date();

        loadWorkflow(workflow);
        router.push(`/studio/${workflow.id}`);
        toast.success('Workflow imported successfully!');
      } catch (error) {
        toast.error('Failed to import workflow. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  const filteredWorkflows = savedWorkflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-black text-black tracking-tight">
                  Nexus Playground
                </h1>
                <p className="text-sm text-gray-700 font-semibold">
                  Visual Intent Composer for Cross-Chain Workflows
                </p>
              </div>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Workflows</h2>
            <p className="text-sm text-gray-600 mt-1">Create and manage your cross-chain automation workflows</p>
          </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-workflow"
          />
          <label htmlFor="import-workflow">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>

          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Workflow Templates</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <Card key={template.id} className="cursor-pointer hover:shadow-[-6px_6px_0_0_#000000] transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {template.nodes.length} nodes
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleLoadTemplate(template)}
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-8">
        {/* My Workflows */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Workflows</h3>
          {filteredWorkflows.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-gray-600 mb-6">No workflows found</p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workflow
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-[-6px_6px_0_0_#000000] transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {workflow.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {workflow.description || 'No description'}
                        </p>
                      </div>
                      {workflow.isPublic && (
                        <Globe className="h-4 w-4 text-black" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      {workflow.tags.map((tag) => (
                        <Badge key={tag}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{workflow.nodes.length} nodes</span>
                      <span>{new Date(workflow.updated).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSelectWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDuplicateWorkflow(workflow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Public Workflows */}
        {publicWorkflows.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Workflows</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicWorkflows.slice(0, 6).map((workflow) => (
                <Card key={workflow.id} className="hover:shadow-[-6px_6px_0_0_#000000] transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {workflow.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {workflow.description || 'No description'}
                        </p>
                      </div>
                      <Globe className="h-4 w-4 text-black" />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-3">
                      {workflow.tags.map((tag) => (
                        <Badge key={tag}>
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{workflow.nodes.length} nodes</span>
                      <span>{new Date(workflow.updated).toLocaleDateString()}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleDuplicateWorkflow(workflow)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use This Workflow
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};