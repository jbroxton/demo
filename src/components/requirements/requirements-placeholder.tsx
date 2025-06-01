'use client';

import { RequirementsTable } from './requirements-table';

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
      <RequirementsTable
        featureId={featureId}
        showAddRow={showAddRow}
        onAddRowCancel={onAddRowCancel}
        onRowClick={onRowClick}
      />
    </div>
  );
}