"use client";

import React from 'react';
import { Plus, FileUp, Trash2 } from 'lucide-react';
import { useAppTheme } from '@/providers/sidenav-theme-provider';

interface RequirementActionBarProps {
  onAddRequirement: () => void;
  onDeleteRequirements?: () => void;
  onAttachFile?: () => void;
  selectedCount?: number;
}

export function RequirementActionBarThemed({ 
  onAddRequirement, 
  onDeleteRequirements,
  onAttachFile = () => {},
  selectedCount = 0
}: RequirementActionBarProps) {
  const theme = useAppTheme();
  
  return (
    <div className={theme.actionBar}>
      <button
        onClick={onAddRequirement}
        className={theme.buttonPrimary}
      >
        <div className={theme.buttonIcon}>
          <Plus className="h-4 w-4" />
        </div>
        <span>Add Requirement</span>
      </button>
      
      <button
        onClick={onAttachFile}
        className={theme.buttonSecondary}
      >
        <div className={theme.buttonIcon}>
          <FileUp className="h-4 w-4" />
        </div>
        <span>Attach File</span>
      </button>
      
      {onDeleteRequirements && (
        <button
          onClick={onDeleteRequirements}
          className={selectedCount === 0 ? theme.buttonDisabled : theme.buttonDanger}
          disabled={selectedCount === 0}
        >
          <div className={theme.buttonIcon}>
            <Trash2 className="h-4 w-4" />
          </div>
          <span>Delete {selectedCount > 0 ? `(${selectedCount})` : ''}</span>
        </button>
      )}
    </div>
  );
}