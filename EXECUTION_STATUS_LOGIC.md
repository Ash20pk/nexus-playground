# Workflow Execution Status Logic

## New Approach: Node-Status-Based Determination

Instead of failing the workflow on any thrown error, we now check **actual node execution status**.

## Flow

### 1. Node Execution
```
Node executes → One of three outcomes:
  ✅ Success: Node completes normally
  ⚠️  Warning: Non-blocking error (401, metadata, etc.) → Treated as success
  ❌ Error: Real failure → Marked as error
```

### 2. Status Recording
```typescript
onNodeStatus(nodeId, 'success' | 'error') // Called for each node
// Stored in: workflowStore.nodeExecutionStatus
```

### 3. Final Determination (in workflowStore)
```typescript
// After execution completes (success or error):
const nodeStatuses = Object.values(state.nodeExecutionStatus);
const hasFailedNodes = nodeStatuses.some(status => status === 'error');
const allNodesCompleted = nodeStatuses.every(status => status === 'success');

if (hasFailedNodes) {
  workflow.status = 'failed'  // ❌ At least one node failed
} else if (allNodesCompleted) {
  workflow.status = 'completed'  // ✅ All nodes succeeded
} else {
  workflow.status = 'failed'  // ⚠️  Partial execution
}
```

## Examples

### Example 1: All Nodes Succeed (with non-blocking warnings)
```
Node 1: Transfer → Success ✅
  └─ Console: 401 metadata error (ignored)
Node 2: Swap → Success ✅
  └─ Console: XAR_CA_SDK warning (ignored)
  
nodeExecutionStatus: { node1: 'success', node2: 'success' }
workflow.status: 'completed' ✅
```

### Example 2: Node Actually Fails
```
Node 1: Transfer → Success ✅
Node 2: Swap → Error ❌
  └─ Insufficient balance
  
nodeExecutionStatus: { node1: 'success', node2: 'error' }
workflow.status: 'failed' ❌
```

### Example 3: Auxiliary Error After Success
```
Node 1: Transfer → Success ✅
  └─ Transaction confirmed
  └─ Metadata save throws 401 (auxiliary service)
  
nodeExecutionStatus: { node1: 'success' }
Execution throws: 401 error
Store checks: All nodes 'success'
workflow.status: 'completed' ✅
```

## Key Changes

### Before ❌
- Any thrown error → `workflow.status = 'failed'`
- 401 metadata errors caused failed status
- Had to filter every possible error pattern

### After ✅
- Check actual node outcomes → Smart status determination
- Non-blocking errors don't affect status
- Clean separation: auxiliary errors vs. node failures

## Benefits

1. **Resilient**: Auxiliary service failures don't break workflows
2. **Accurate**: Status reflects actual transaction outcomes
3. **Maintainable**: Don't need to maintain exhaustive error pattern lists
4. **User-friendly**: Green status when transactions actually succeed
