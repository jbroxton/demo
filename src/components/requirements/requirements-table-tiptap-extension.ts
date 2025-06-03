import { mergeAttributes } from '@tiptap/core';
import Table from '@tiptap/extension-table';
// We'll create the table structure manually instead of using createTable

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    requirementsTable: {
      /**
       * Insert a requirements table
       */
      insertRequirementsTable: (options?: {
        rows?: number;
        cols?: number;
        featureId?: string;
      }) => ReturnType;
    };
  }
}

// Create a custom table that doesn't load the conflicting plugins
export const RequirementsTable = Table.extend({
  name: 'requirementsTable',

  // Override addProseMirrorPlugins to prevent plugin conflicts
  addProseMirrorPlugins() {
    // Don't include the parent plugins that cause conflicts
    // We'll rely on the main Table extension for table functionality
    return [];
  },

  // Ensure this node is recognized as a table
  group: 'block',
  content: 'tableRow+',
  tableRole: 'table',
  isolating: true,
  defining: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      isRequirementsTable: {
        default: true,
        parseHTML: element => element.hasAttribute('data-requirements-table'),
        renderHTML: attributes => {
          if (!attributes.isRequirementsTable) {
            return {};
          }
          return {
            'data-requirements-table': '',
          };
        },
      },
      featureId: {
        default: null,
        parseHTML: element => element.getAttribute('data-feature-id'),
        renderHTML: attributes => {
          if (!attributes.featureId) {
            return {};
          }
          return {
            'data-feature-id': attributes.featureId,
          };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'table',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      ['tbody', 0],
    ];
  },

  addCommands() {
    return {
      insertRequirementsTable:
        (options = {}) =>
        ({ commands }) => {
          const { rows = 3, cols = 5, featureId } = options;

          const headers = ['Title', 'Status', 'Priority', 'Jira ID', 'Owner'];

          // Create a wrapper with title and table
          const content = [
            // Title heading
            {
              type: 'heading',
              attrs: { level: 3 },
              content: [{
                type: 'text',
                text: 'Requirements'
              }]
            },
            // The table
            {
              type: this.name,
              attrs: {
                isRequirementsTable: true,
                featureId: featureId || null,
              },
              content: [
                // Header row
                {
                  type: 'tableRow',
                  content: headers.map(header => ({
                    type: 'tableHeader',
                    content: [{
                      type: 'paragraph',
                      content: [{
                        type: 'text',
                        text: header
                      }]
                    }]
                  }))
                },
                // Data rows
                ...Array(rows).fill(null).map(() => ({
                  type: 'tableRow',
                  content: Array(cols).fill(null).map(() => ({
                    type: 'tableCell',
                    content: [{
                      type: 'paragraph'
                    }]
                  }))
                }))
              ]
            }
          ];

          return commands.insertContent(content);
        },
    };
  },
});