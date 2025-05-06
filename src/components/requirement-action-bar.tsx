"use client";

import React from 'react';
import { Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';

interface RequirementActionBarProps {
  onAddRequirement: () => void;
  onDeleteRequirements?: () => void;
  onAttachFile?: () => void;
  selectedCount?: number;
}

export function RequirementActionBar({ 
  onAddRequirement, 
  onDeleteRequirements,
  onAttachFile = () => {},
  selectedCount = 0
}: RequirementActionBarProps) {
  return (
    <div className="requirement-action-bar">
      <Button
        onClick={onAddRequirement}
        className="requirement-add-button"
        startIcon={<AddIcon />}
      >
        Add
      </Button>
      
      <Button
        onClick={onAttachFile}
        className="requirement-attach-button"
        startIcon={<AttachFileIcon />}
      >
        Attach File
      </Button>
      
      {onDeleteRequirements && (
        <Button
          onClick={onDeleteRequirements}
          className="requirement-delete-button"
          disabled={selectedCount === 0}
          startIcon={<DeleteIcon />}
        >
          Delete {selectedCount > 0 ? `(${selectedCount})` : ''}
        </Button>
      )}
    </div>
  );
}