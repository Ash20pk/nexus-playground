import { NextRequest, NextResponse } from 'next/server';
import { Workflow } from '@/types/workflow';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public');

    let workflows = storage.getAllWorkflows();

    if (isPublic === 'true') {
      workflows = workflows.filter(w => w.isPublic);
    }

    return NextResponse.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflows'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const workflow: Workflow = await request.json();

    // Validate workflow
    if (!workflow.name || !workflow.id) {
      return NextResponse.json({
        success: false,
        error: 'Workflow name and ID are required'
      }, { status: 400 });
    }

    // Save workflow using shared storage
    const savedWorkflow = storage.saveWorkflow(workflow);

    return NextResponse.json({
      success: true,
      data: savedWorkflow
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to save workflow'
    }, { status: 500 });
  }
}