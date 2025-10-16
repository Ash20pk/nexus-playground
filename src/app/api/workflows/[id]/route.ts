import { NextRequest, NextResponse } from 'next/server';
import { Workflow } from '@/types/workflow';

// In-memory storage for demo purposes
// In production, use a proper database
let workflows: Workflow[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflow = workflows.find(w => w.id === params.id);

    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflow'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates: Partial<Workflow> = await request.json();
    const workflowIndex = workflows.findIndex(w => w.id === params.id);

    if (workflowIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    workflows[workflowIndex] = {
      ...workflows[workflowIndex],
      ...updates,
      updated: new Date()
    };

    return NextResponse.json({
      success: true,
      data: workflows[workflowIndex]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update workflow'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workflowIndex = workflows.findIndex(w => w.id === params.id);

    if (workflowIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Workflow not found'
      }, { status: 404 });
    }

    workflows.splice(workflowIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to delete workflow'
    }, { status: 500 });
  }
}