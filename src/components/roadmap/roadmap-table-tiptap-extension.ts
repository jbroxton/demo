import { mergeAttributes } from '@tiptap/core';
import Table from '@tiptap/extension-table';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    roadmapTable: {
      /**
       * Insert a roadmap features table
       */
      insertRoadmapTable: (options?: {
        rows?: number;
        cols?: number;
        roadmapId?: string;
      }) => ReturnType;
    };
  }
}

// Create a roadmap table extension that extends TipTap's Table
export const RoadmapTable = Table.extend({
  name: 'roadmapTable',

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
      isRoadmapTable: {
        default: true,
        parseHTML: element => element.hasAttribute('data-roadmap-table'),
        renderHTML: attributes => {
          if (!attributes.isRoadmapTable) {
            return {};
          }
          return {
            'data-roadmap-table': '',
          };
        },
      },
      roadmapId: {
        default: null,
        parseHTML: element => element.getAttribute('data-roadmap-id'),
        renderHTML: attributes => {
          if (!attributes.roadmapId) {
            return {};
          }
          return {
            'data-roadmap-id': attributes.roadmapId,
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
      insertRoadmapTable:
        (options = {}) =>
        ({ commands }) => {
          const { rows = 4, cols = 6, roadmapId } = options;

          const headers = ['Feature', 'Quarter', 'Status', 'Owner', 'Priority', 'Notes'];

          // Create a wrapper with title and table
          const content = [
            // Title heading
            {
              type: 'heading',
              attrs: { level: 3 },
              content: [{
                type: 'text',
                text: 'Roadmap Features'
              }]
            },
            // The table
            {
              type: this.name,
              attrs: {
                isRoadmapTable: true,
                roadmapId: roadmapId || null,
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