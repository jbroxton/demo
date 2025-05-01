"use client";

import React from 'react';
import { Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

interface RequirementActionBarProps {
  onAddRequirement: () => void;
  onDeleteRequirements?: () => void;
  selectedCount?: number;
}

export function RequirementActionBar({ 
  onAddRequirement, 
  onDeleteRequirements,
  selectedCount = 0
}: RequirementActionBarProps) {
  return (
    <div className="flex items-center gap-2 p-2" style={{ backgroundColor: 'var(--sidebar)' }}>
      <Button
        color="primary"
        onClick={onAddRequirement}
        size="small"
        variant="contained"
        startIcon={<AddIcon style={{ color: "var(--sidebar-primary-foreground)" }} />}
        className="requirement-add-button"
        sx={{
          backgroundColor: 'var(--sidebar-accent)',
          color: 'var(--sidebar-accent-foreground) !important',
          textTransform: 'none',
          borderRadius: '0.375rem',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '0.375rem 0.75rem',
          minWidth: '5rem',
          boxShadow: 'none',
          border: '1px solid var(--sidebar-border)',
          '&:hover': {
            backgroundColor: 'var(--sidebar-primary)',
            boxShadow: 'none',
          },
          '& .MuiButton-label': {
            color: 'var(--sidebar-accent-foreground)',
          },
          '& .MuiSvgIcon-root': {
            color: 'var(--sidebar-accent-foreground)',
          },
        }}
      >
        <span style={{ color: "var(--sidebar-accent-foreground)" }}>Add</span>
      </Button>
      
      {onDeleteRequirements && (
        <Button
          color="error"
          onClick={onDeleteRequirements}
          size="small"
          variant="outlined"
          startIcon={<DeleteIcon style={{ color: selectedCount === 0 ? 'var(--sidebar-foreground)' : '#ef4444' }} />}
          disabled={selectedCount === 0}
          className="requirement-delete-button"
          sx={{
            backgroundColor: 'transparent',
            borderColor: selectedCount === 0 ? 'var(--sidebar-border)' : '#ef4444',
            color: selectedCount === 0 ? 'var(--sidebar-foreground) !important' : '#ef4444 !important',
            textTransform: 'none',
            borderRadius: '0.375rem',
            fontWeight: 500,
            fontSize: '0.875rem',
            padding: '0.375rem 0.75rem',
            minWidth: '5rem',
            '&:hover': {
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              borderColor: '#ef4444',
            },
            '&.Mui-disabled': {
              borderColor: 'var(--sidebar-border)',
              color: 'var(--sidebar-foreground) !important',
              opacity: 0.5,
              backgroundColor: 'transparent',
            },
            '& .MuiButton-label': {
              color: selectedCount === 0 ? 'var(--sidebar-foreground)' : '#ef4444',
            },
            '& .MuiSvgIcon-root': {
              color: selectedCount === 0 ? 'var(--sidebar-foreground)' : '#ef4444',
            },
          }}
        >
          <span style={{ color: selectedCount === 0 ? 'var(--sidebar-foreground)' : '#ef4444' }}>
            Delete {selectedCount > 0 ? `(${selectedCount})` : ''}
          </span>
        </Button>
      )}
    </div>
  );
}