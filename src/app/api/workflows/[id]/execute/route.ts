import { NextRequest, NextResponse } from 'next/server';
import { WorkflowExecution } from '@/types/workflow';
import { storage } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get execution result from frontend (where real execution happens)
    const executionResult: WorkflowExecution = await request.json();

    if (!executionResult || executionResult.workflowId !== id) {
      return NextResponse.json({
        success: false,
        error: 'Invalid execution data'
      }, { status: 400 });
    }

    // Save the execution result from frontend
    storage.saveExecution(executionResult);

    return NextResponse.json({
      success: true,
      data: executionResult
    });

  } catch (error) {
    const { id } = await params;
    const execution: WorkflowExecution = {
      id: crypto.randomUUID(),
      workflowId: id,
      status: 'failed',
      startedAt: new Date(),
      completedAt: new Date(),
      error: error instanceof Error ? error.message : 'Unknown error',
      results: {}
    };

    storage.saveExecution(execution);

    return NextResponse.json({
      success: false,
      error: 'Failed to save execution result',
      data: execution
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflowExecutions = storage.getExecutionsForWorkflow(id);

    return NextResponse.json({
      success: true,
      data: workflowExecutions
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch executions'
    }, { status: 500 });
  }
}