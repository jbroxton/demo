"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Requirement, useRequirementsStore } from '@/stores/requirements';
import { useReleasesStore, Release } from '@/stores/releases';
import { 
  MaterialReactTable, 
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from 'material-react-table';
import { 
  ThemeProvider, 
  createTheme,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import { RequirementActionBar } from './requirement-action-bar';

// Define props interface for the component
interface RequirementsGridProps {
  featureId: string;
  userId?: string;
}

export function RequirementsGrid({ featureId, userId = 'anonymous' }: RequirementsGridProps) {
  console.log('Rendering RequirementsGrid for featureId:', featureId);
  
  // State
  const [rowData, setRowData] = useState<Requirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [releases, setReleases] = useState<Release[]>([]);
  const [rowSelection, setRowSelection] = useState({});
  
  // Store hooks
  const {
    getRequirementsByFeatureId,
    addRequirement,
    updateRequirement,
    deleteRequirement
  } = useRequirementsStore();
  
  const { getReleases, getReleasesByFeatureId } = useReleasesStore();
  
  // Define columns
  const columns = useMemo<MRT_ColumnDef<Requirement>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 150,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiEditTextFieldProps: {
          required: true,
          error: false,
          helperText: 'Name is required',
        },
        Cell: ({ cell }) => (
          <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        size: 200,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        Cell: ({ cell }) => (
          <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 100,
        editVariant: 'select',
        editSelectOptions: ['High', 'Med', 'Low'],
        muiEditTextFieldProps: {
          select: true
        },
        Cell: ({ cell }) => {
          const priority = cell.getValue<string>();
          const colorClass = 
            priority === 'High' 
              ? 'bg-red-900/20 text-red-300' 
              : priority === 'Med' 
                ? 'bg-yellow-900/20 text-yellow-300' 
                : 'bg-blue-900/20 text-blue-300';
          
          return (
            <span className={`text-xs font-medium px-2 py-1 rounded ${colorClass}`}>
              {priority}
            </span>
          );
        },
      },
      {
        accessorKey: 'owner',
        header: 'Owner',
        size: 150,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        Cell: ({ cell }) => (
          <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell.getValue<string>()}</span>
        ),
      },
      {
        accessorKey: 'releaseId',
        header: 'Release',
        size: 150,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        Cell: ({ cell }) => {
          const releaseId = cell.getValue<string | undefined>();
          const release = releases.find(r => r.id === releaseId);
          return <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{release?.name || 'Not assigned'}</span>;
        },
        Edit: ({ cell, column, row, table }) => {
          return (
            <FormControl fullWidth size="small">
              <InputLabel id="release-select-label">Release</InputLabel>
              <Select
                labelId="release-select-label"
                value={cell.getValue<string | undefined>() || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (row._valuesCache) {
                    // TypeScript issue fix
                    (row as any)._valuesCache[column.id] = newValue;
                  }
                }}
                label="Release"
                sx={{ minWidth: '100px' }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {releases.map((release) => (
                  <MenuItem key={release.id} value={release.id}>
                    {release.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        },
      },
      {
        accessorKey: 'cuj',
        header: 'Customer Journey',
        size: 200,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        Cell: ({ cell }) => (
          <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell.getValue<string>() || ''}</span>
        ),
      },
      {
        accessorKey: 'acceptanceCriteria',
        header: 'Acceptance Criteria',
        size: 200,
        enableResizing: true,
        muiTableHeadCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        muiTableBodyCellProps: {
          sx: { 
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }
        },
        Cell: ({ cell }) => (
          <span style={{ color: 'white', whiteSpace: 'normal', wordBreak: 'break-word' }}>{cell.getValue<string>() || ''}</span>
        ),
      },
    ],
    [releases]
  );
  
  // Handle saving a row (edit or create)
  const handleSaveRow = async ({ row, values }: { row: MRT_Row<Requirement>; values: any }) => {
    try {
      // Prepare updates
      const updates: Partial<Requirement> = {};
      
      // Compare values with original data to find changes
      Object.keys(values).forEach(key => {
        const typedKey = key as keyof Requirement;
        if (values[key] !== row.original[typedKey]) {
          updates[typedKey] = values[key];
        }
      });
      
      if (Object.keys(updates).length > 0) {
        // Update the requirement in the store
        updateRequirement(row.original.id, updates);
        
        // Update local state
        setRowData(prev => 
          prev.map(item => (item.id === row.original.id ? { ...item, ...updates } : item))
        );
        
        toast.success('Requirement updated');
      }
    } catch (error) {
      console.error('Error saving row:', error);
      toast.error('Failed to update requirement');
    }
  };
  
  // Add a new requirement row
  const handleAddRequirement = () => {
    console.log('Adding new requirement');
    
    try {
      const newRequirement: Omit<Requirement, 'id'> = {
        name: 'New Requirement',
        description: '',
        priority: 'Med',
        featureId,
        owner: userId,
      };
      
      // Add the requirement to the store
      const savedRequirement = addRequirement(newRequirement);
      
      // Update local state
      setRowData(prev => [...prev, savedRequirement]);
      toast.success('Requirement added');
    } catch (error) {
      console.error('Error adding requirement:', error);
      toast.error('Failed to add requirement');
    }
  };

  // Delete selected requirements
  const handleDeleteRequirements = useCallback(() => {
    // Get selected rows
    const selectedRows = Object.keys(rowSelection);
    if (selectedRows.length === 0) return;
    
    // Confirm deletion
    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} requirement(s)?`)) {
      try {
        // Delete each selected requirement
        let successCount = 0;
        selectedRows.forEach(rowId => {
          const row = rowData.find(r => r.id === rowId);
          if (row) {
            const success = deleteRequirement(row.id);
            if (success) successCount++;
          }
        });
        
        // Update local state
        setRowData(prev => prev.filter(item => !selectedRows.includes(item.id)));
        setRowSelection({});
        
        toast.success(`${successCount} requirement(s) deleted`);
      } catch (error) {
        console.error('Error deleting requirements:', error);
        toast.error('Failed to delete requirements');
      }
    }
  }, [rowSelection, rowData, deleteRequirement]);

  // Load requirements and releases on mount
  useEffect(() => {
    if (featureId) {
      const requirements = getRequirementsByFeatureId(featureId);
      const featureReleases = getReleasesByFeatureId(featureId);
      console.log('Requirements loaded:', requirements);
      console.log('Releases loaded:', featureReleases);
      
      setRowData(requirements);
      setReleases(featureReleases);
      setIsLoading(false);
    }
  }, [featureId, getRequirementsByFeatureId, getReleasesByFeatureId, getReleases]);

  // Material UI dark theme - simplify to inherit global styles
  const darkTheme = useMemo(
    () =>
      createTheme({
        // Use minimal theme configuration to allow global styles to take over
        palette: {
          mode: 'dark',
          text: {
            primary: '#ffffff',
            secondary: '#ffffff',
          },
          background: {
            default: '#0C0C0D',
            paper: '#0C0C0D',
          }
        },
        components: {
          MuiTableCell: {
            styleOverrides: {
              root: {
                color: '#ffffff'
              },
              head: {
                color: '#ffffff'
              },
              body: {
                color: '#ffffff'
              }
            }
          }
        }
      }),
    []
  );

  // Count selected rows
  const selectedCount = Object.keys(rowSelection).length;

  // Create table instance
  const table = useMaterialReactTable({
    columns,
    data: rowData,
    enableRowSelection: true,
    enableRowNumbers: true,
    enableColumnResizing: true,
    layoutMode: 'grid',
    enableFullScreenToggle: false,
    enableColumnOrdering: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enablePagination: false,
    enableEditing: true,
    editDisplayMode: 'cell',
    onEditingRowSave: handleSaveRow,
    positionActionsColumn: 'last',
    muiTopToolbarProps: {
      sx: { 
        backgroundColor: 'var(--sidebar)',
        borderBottom: '1px solid var(--sidebar-border)',
      }
    },
    muiBottomToolbarProps: {
      sx: { 
        backgroundColor: 'var(--sidebar)',
        borderTop: '1px solid var(--sidebar-border)',
        color: 'var(--sidebar-foreground)',
        padding: '8px',
      }
    },
    muiTableContainerProps: {
      sx: {
        backgroundColor: 'var(--sidebar)',
        border: 'none',
        minHeight: '300px',
        maxHeight: '300px',
        '& .MuiTableCell-root': {
          color: 'var(--sidebar-foreground)',
        },
      }
    },
    muiTablePaperProps: {
      sx: {
        backgroundColor: 'var(--sidebar)',
        border: '1px solid var(--sidebar-border)',
        borderRadius: '0.375rem',
        boxShadow: 'none',
      }
    },
    muiTableHeadProps: {
      sx: {
        '& .MuiTableRow-root': {
          backgroundColor: 'var(--sidebar)',
        },
      },
    },
    muiTableBodyProps: {
      sx: {
        '& .MuiTableRow-root': {
          '& .MuiTableCell-root': {
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            maxHeight: 'none',
          },
        },
      },
    },
    renderTopToolbarCustomActions: () => (
      <RequirementActionBar 
        onAddRequirement={handleAddRequirement} 
        onDeleteRequirements={handleDeleteRequirements}
        selectedCount={selectedCount}
      />
    ),
    state: {
      isLoading,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    initialState: { 
      density: 'compact',
    },
    getRowId: row => row.id,
  });

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-2 p-1 bg-[#1e1e20]">
        <div className="text-white text-sm">
          {isDirty && <span className="text-yellow-400 mr-2">●</span>}
          {rowData.length} requirement(s)
        </div>
      </div>
      
      <div className="flex-1 w-full h-[340px] text-white">
        <ThemeProvider theme={darkTheme}>
          <div style={{ height: "100%" }}>
            <MaterialReactTable table={table} />
          </div>
        </ThemeProvider>
      </div>
    </div>
  );
} 