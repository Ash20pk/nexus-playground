'use client';

import React, { useEffect } from 'react';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { useWorkflowStore } from '@/store/workflowStore';
import { useRouter } from 'next/navigation';

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

export default function WorkflowPage({ params }: WorkflowPageProps) {
  const router = useRouter();
  const { currentWorkflow, loadWorkflow, savedWorkflows, loadWorkflows } = useWorkflowStore();
  const [workflowId, setWorkflowId] = React.useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setWorkflowId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!workflowId) return;

    // Load workflows from storage first
    loadWorkflows();
  }, [workflowId, loadWorkflows]);

  useEffect(() => {
    if (!workflowId || !savedWorkflows.length) return;

    // Find and load the specific workflow
    const workflow = savedWorkflows.find(w => w.id === workflowId);
    if (workflow) {
      loadWorkflow(workflow);
    } else {
      // If workflow not found, redirect to studio
      router.push('/studio');
    }
  }, [workflowId, savedWorkflows, loadWorkflow, router]);

  if (!workflowId || !currentWorkflow) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50">
      <WorkflowBuilder />
    </div>
  );
}