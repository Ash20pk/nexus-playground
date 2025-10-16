'use client';

import React from 'react';
import { WorkflowList } from './workflow/WorkflowList';

export const NexusFlowStudio: React.FC = () => {
  return (
    <div className="h-screen">
      <WorkflowList />
    </div>
  );
};