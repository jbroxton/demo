# Approval Status Route Refactor Summary

## Overview
Refactored `/src/app/api/approval-statuses/route.ts` to remove deprecated custom status functionality while preserving approval operation features.

## Problem
The route was mixing two concerns:
1. Custom approval status CRUD operations (deprecated)
2. Entity approval operations with roadmap status (still needed)

## Changes Made

### 1. Imports
- **Removed**: `createApprovalStatus`, `updateApprovalStatus`, `deleteApprovalStatus` 
- **Kept**: `getApprovalStatuses`, `getApprovalStatusById` (for read-only operations)

### 2. GET Handler
- **No changes** - Still allows reading existing statuses (needed for viewing)
- Added todos for multi-tenancy support

### 3. POST Handler  
- **Removed**: Custom status creation (lines 99-108)
- **Kept**: Entity approval creation with roadmap status
- Added comment explaining that custom status creation is deprecated

### 4. PUT Handler
- **Removed**: Regular status update functionality (lines 229-242)
- **Kept**: 
  - Bulk approval updates
  - Single approval updates
- Added comment explaining that custom status updates are deprecated

### 5. DELETE Handler
- **Removed**: Regular status deletion (lines 269-281)
- **Kept**: Approval roadmap status deletion
- Added comment explaining that custom status deletion is deprecated

## Result
The route now:
- Only handles approval operations (create, update, delete approvals)
- Can still read existing statuses (for display purposes)
- Cannot create, update, or delete custom statuses (deprecated)
- Maintains all routing utility patterns (error handling, validation, etc.)

## Impact
- UI components that create/edit/delete custom statuses will need to be updated or removed
- Existing approval operations continue to work as before
- Reading existing statuses still works for display purposes

## TODOs
- Update service layer functions to accept tenantId parameter
- Review and update UI components that interact with custom status operations
- Consider removing the GET handler if custom statuses are no longer displayed