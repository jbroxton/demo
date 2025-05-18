# Service Layer Multi-Tenancy Update

## Overview
This document tracks the progress of adding multi-tenancy support to all service layer functions.

## Pattern to Apply
1. Add `tenantId` parameter to all functions (with optional default value)
2. Add `.eq('tenant_id', tenantId)` to all SELECT queries
3. Include `tenant_id: tenantId` in all INSERT operations
4. Add ownership checks for UPDATE/DELETE operations (verify record belongs to tenant)

## Services to Update

### 1. requirements-db.ts ✅ COMPLETED
Functions to update:
- [x] getRequirementsFromDb - Add tenantId parameter and filter
- [x] getRequirementByIdFromDb - Add tenantId parameter and filter
- [x] getRequirementsByFeatureId - Add tenantId parameter and filter
- [x] getRequirementsByReleaseId - Add tenantId parameter and filter
- [x] createRequirementInDb - Add tenantId to insert data
- [x] updateRequirementNameInDb - Add tenantId check
- [x] updateRequirementDescriptionInDb - Add tenantId check
- [x] updateRequirementOwnerInDb - Add tenantId check
- [x] updateRequirementPriorityInDb - Add tenantId check
- [x] updateRequirementReleaseInDb - Add tenantId check
- [x] updateRequirementCujInDb - Add tenantId check
- [x] updateRequirementAcceptanceCriteriaInDb - Add tenantId check
- [x] deleteRequirementFromDb - Add tenantId check

### 2. tabs-db.ts ✅ COMPLETED
Functions to update:
- [x] getTabsFromDb - Add tenantId parameter and filter
- [x] createTabInDb - Add tenantId to insert data
- [x] deleteTabFromDb - Add tenantId check
- [x] activateTabInDb - Add tenantId check
- [x] updateTabTitleForItemInDb - Add tenantId check
- [x] updateTabInDb - Add tenantId check
- [x] updateNewTabToSavedItemInDb - Add tenantId check

### 3. features-db.ts ✅ COMPLETED
Functions to update:
- [x] getFeaturesFromDb - Add tenantId parameter and filter
- [x] getFeaturesByInterfaceId - Add tenantId parameter and filter
- [x] getFeatureByIdFromDb - Add tenantId parameter and filter
- [x] createFeatureInDb - Add tenantId to insert data and validate related entities
- [x] updateFeatureNameInDb - Add tenantId check
- [x] updateFeatureDescriptionInDb - Add tenantId check
- [x] updateFeaturePriorityInDb - Add tenantId check
- [x] deleteFeatureFromDb - Add tenantId check

### 4. products-db.ts ✅ COMPLETED
Functions to update:
- [x] getProductsFromDb - Add tenantId parameter and filter
- [x] getProductByIdFromDb - Add tenantId parameter and filter
- [x] createProductInDb - Updated parameter name and made it optional with default
- [x] updateProductNameInDb - Add tenantId check
- [x] updateProductDescriptionInDb - Add tenantId check
- [x] deleteProductFromDb - Add tenantId check and ownership validation

### 5. interfaces-db.ts ✅ COMPLETED
Functions to update:
- [x] getInterfacesFromDb - Add tenantId parameter and filter
- [x] getInterfacesByProductIdFromDb - Add tenantId parameter and filter
- [x] getInterfaceByIdFromDb - Add tenantId parameter and filter
- [x] createInterfaceInDb - Add tenantId to insert data and validate related entities
- [x] updateInterfaceNameInDb - Add tenantId check
- [x] updateInterfaceDescriptionInDb - Add tenantId check
- [x] deleteInterfaceFromDb - Add tenantId check

### 6. attachments-db.ts ✅ COMPLETED
Functions to update:
- [x] getAttachmentsFromDb - Added new function with tenantId parameter and filter
- [x] getAttachmentsForEntityFromDb - Made tenantId parameter optional with default
- [x] getParentEntityAttachmentsFromDb - Made tenantId parameter optional with default
- [x] getAttachmentByIdFromDb - Made tenantId parameter optional with default
- [x] createAttachmentInDb - Refactored to separate tenantId parameter with default
- [x] updateAttachmentInDb - Made tenantId parameter optional with default
- [x] deleteAttachmentFromDb - Made tenantId parameter optional with default
- [x] mapAttachment - Added tenantId to the mapper function

### 7. documents-db.ts
Functions to update:
- [ ] getDocumentsFromDb - Add tenantId parameter and filter
- [ ] getDocumentByIdFromDb - Add tenantId parameter and filter
- [ ] createDocumentInDb - Add tenantId to insert data
- [ ] updateDocumentContentInDb - Add tenantId check
- [ ] deleteDocumentFromDb - Add tenantId check

### 8. approval-stages-db.ts
Functions to update:
- [ ] getApprovalStagesForEntityFromDb - Add tenantId parameter and filter
- [ ] createApprovalStageInDb - Add tenantId to insert data
- [ ] updateApprovalStageInDb - Add tenantId check
- [ ] deleteApprovalStageFromDb - Add tenantId check

### 9. approval-statuses-db.ts
Functions to update:
- [ ] getApprovalStatusesFromDb - Add tenantId parameter and filter
- [ ] createApprovalStatusInDb - Add tenantId to insert data
- [ ] updateApprovalStatusInDb - Add tenantId check
- [ ] deleteApprovalStatusFromDb - Add tenantId check

### 10. entity-approvals-db.ts
Functions to update:
- [ ] getEntityApprovalsFromDb - Add tenantId parameter and filter
- [ ] createEntityApprovalInDb - Add tenantId to insert data
- [ ] bulkCreateEntityApprovalsInDb - Add tenantId to insert data
- [ ] updateEntityApprovalInDb - Add tenantId check
- [ ] deleteEntityApprovalFromDb - Add tenantId check

## Already Updated Services
1. releases-db.ts - Already has tenantId support
2. roadmaps-db.ts - Already has tenantId support