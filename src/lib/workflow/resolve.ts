import { Workflow, WorkflowEdge, WorkflowNode } from '@/types/workflow';

export type IOType = 'token' | 'amount' | 'address' | 'transaction';

const KEY_TO_TYPE: Record<string, IOType> = {
  amount: 'amount',
  toAmount: 'amount',
  fromAmount: 'amount',
  iterations: 'amount',
  address: 'address',
  recipient: 'address',
};

function findIncomingEdges(workflow: Workflow, nodeId: string): WorkflowEdge[] {
  return workflow.edges.filter((e) => e.target === nodeId);
}

function getNodeById(workflow: Workflow, nodeId: string): WorkflowNode | undefined {
  return workflow.nodes.find((n) => n.id === nodeId);
}

function pickOutputValue(prevNode: WorkflowNode, expectedType?: IOType, keyHint?: string): any {
  // Prefer explicit outputs array
  const outputs = prevNode.data.outputs || [];
  if (outputs.length) {
    // 1) Match by type first
    if (expectedType) {
      const byType = outputs.find((o) => o.type === expectedType && o.value !== undefined);
      if (byType) return byType.value;
    }
    // 2) Match by name hint
    if (keyHint) {
      const byName = outputs.find((o) => o.name === keyHint && o.value !== undefined);
      if (byName) return byName.value;
    }
    // 3) Fallback to first output with value
    const anyWithValue = outputs.find((o) => o.value !== undefined);
    if (anyWithValue) return anyWithValue.value;
  }

  // Fallback: try common config fields on previous node
  const cfg: any = prevNode.data.config || {};
  if (expectedType === 'amount') {
    if (cfg.amount !== undefined && cfg.amount !== 'fromPrevious') return cfg.amount;
    if (cfg.value !== undefined && cfg.value !== 'fromPrevious') return cfg.value;
  }
  if (expectedType === 'address') {
    if (cfg.recipient) return cfg.recipient;
    if (cfg.address && cfg.address !== 'fromPrevious') return cfg.address;
  }
  return undefined;
}

export function resolveConfigValue(
  workflow: Workflow | null | undefined,
  nodeId: string,
  key: string,
  rawValue: any
): any {
  if (!workflow) return rawValue;
  if (rawValue !== 'fromPrevious') return rawValue;

  const incoming = findIncomingEdges(workflow, nodeId);
  if (!incoming.length) return rawValue;

  // For now, consume from the first upstream edge
  const prevEdge = incoming[0];
  const prevNode = getNodeById(workflow, prevEdge.source);
  if (!prevNode) return rawValue;

  const expectedType = KEY_TO_TYPE[key];
  const resolved = pickOutputValue(prevNode, expectedType, key);
  return resolved !== undefined ? resolved : rawValue;
}
