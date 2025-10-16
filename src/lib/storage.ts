import { Workflow, WorkflowExecution } from '@/types/workflow';

// Shared in-memory storage for demo purposes
// In production, this would be a proper database
class MemoryStorage {
  private workflows: Workflow[] = [];
  private executions: WorkflowExecution[] = [];

  // Workflows
  getAllWorkflows(): Workflow[] {
    return this.workflows;
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.find(w => w.id === id);
  }

  saveWorkflow(workflow: Workflow): Workflow {
    const existingIndex = this.workflows.findIndex(w => w.id === workflow.id);

    const updatedWorkflow = {
      ...workflow,
      updated: new Date()
    };

    if (existingIndex >= 0) {
      this.workflows[existingIndex] = updatedWorkflow;
    } else {
      this.workflows.push({
        ...updatedWorkflow,
        created: new Date()
      });
    }

    return updatedWorkflow;
  }

  deleteWorkflow(id: string): boolean {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index >= 0) {
      this.workflows.splice(index, 1);
      return true;
    }
    return false;
  }

  // Executions
  getAllExecutions(): WorkflowExecution[] {
    return this.executions;
  }

  getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
    return this.executions.filter(e => e.workflowId === workflowId);
  }

  saveExecution(execution: WorkflowExecution): WorkflowExecution {
    this.executions.push(execution);
    return execution;
  }

  // Utility
  reset(): void {
    this.workflows = [];
    this.executions = [];
  }
}

// Export singleton instance
export const storage = new MemoryStorage();