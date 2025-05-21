# Tab Patterns and Best Practices

## Overview
This document describes the patterns and best practices for working with tabs in the Speqq application.

## Item IDs for Tabs

When opening tabs, an `itemId` is required that identifies the entity being displayed. The backend validation expects UUID-formatted strings for all `itemId` values, even for list/group views.

### Entity-Specific Tabs

For tabs showing a specific entity (like a particular product, feature, or roadmap), use the entity's UUID:

```javascript
openTab({
  title: entity.name,
  type: 'entity-type', // e.g., 'product', 'feature', 'roadmap'
  itemId: entity.id,   // The actual entity UUID
  hasChanges: false
});
```

### Group/List View Tabs

For tabs showing a list of entities (like all roadmaps or all products), use a placeholder UUID:

```javascript
openTab({
  title: 'Roadmaps',
  type: 'roadmap',
  itemId: '00000000-0000-0000-0000-000000000001', // Placeholder UUID for roadmaps list
  hasChanges: false
});
```

## Known Placeholder UUIDs

| Entity Type | Group View Name | Placeholder UUID |
|-------------|----------------|-------------------|
| roadmap     | Roadmaps list   | 00000000-0000-0000-0000-000000000001 |

## Implementation Details

In the tab router (`tab-query-content.tsx`), we check for both the placeholder UUID and any legacy string identifiers:

```javascript
if (activeTab.itemId === 'roadmaps' || activeTab.itemId === '00000000-0000-0000-0000-000000000001') {
  // Show the roadmaps list view
}
```

This maintains backward compatibility with existing tabs while enforcing the UUID format for new tabs. 