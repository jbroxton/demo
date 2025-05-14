'use client';

import React from 'react';
import { ThemedRequirementsTable } from './themed-requirements-table';

interface RequirementsPlaceholderProps {
  featureId: string;
  userId?: string;
  showAddRow?: boolean;
  onAddRowCancel?: () => void;
  onRowClick?: (requirementId: string, requirementName: string) => void;
}

export function RequirementsPlaceholder({
  featureId,
  userId = 'anonymous',
  showAddRow = false,
  onAddRowCancel,
  onRowClick
}: RequirementsPlaceholderProps) {
  return (
    <div className="w-full flex flex-col">
      <ThemedRequirementsTable
        featureId={featureId}
        showAddRow={showAddRow}
        onAddRowCancel={onAddRowCancel}
        onRowClick={onRowClick}
      />
    </div>
  );
}