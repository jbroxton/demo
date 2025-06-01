/**
 * TipTap editor testing utilities
 * Helpers for testing TipTap editor content, interactions, and persistence
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';

// Mock TipTap editor for tests
export function createMockEditor(content?: any): Partial<Editor> {
  return {
    getJSON: jest.fn().mockReturnValue(content || {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Test content' }]
        }
      ]
    }),
    getHTML: jest.fn().mockReturnValue('<p>Test content</p>'),
    getText: jest.fn().mockReturnValue('Test content'),
    commands: {
      setContent: jest.fn(),
      insertContent: jest.fn(),
      focus: jest.fn(),
      blur: jest.fn(),
      setBold: jest.fn(),
      setItalic: jest.fn(),
      toggleBold: jest.fn(),
      toggleItalic: jest.fn(),
      setHeading: jest.fn(),
      setParagraph: jest.fn(),
      insertContentAt: jest.fn(),
      deleteSelection: jest.fn(),
    } as any,
    isActive: jest.fn().mockReturnValue(false),
    can: jest.fn().mockReturnValue({ setContent: jest.fn().mockReturnValue(true) }),
    state: {
      doc: {
        nodeSize: 10,
        content: { size: 1 }
      }
    } as any,
    view: {
      dom: document.createElement('div'),
      focus: jest.fn(),
    } as any,
    isDestroyed: false,
    isFocused: false,
    isEmpty: false,
  };
}

// Sample TipTap content for testing
export const SAMPLE_TIPTAP_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Test Document' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'bold' },
        { type: 'text', text: ' paragraph with ' },
        { type: 'text', marks: [{ type: 'italic' }], text: 'italic' },
        { type: 'text', text: ' text.' }
      ]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'First item' }]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Second item' }]
            }
          ]
        }
      ]
    }
  ]
};

export const EMPTY_TIPTAP_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
    }
  ]
};

// Helper to simulate typing in TipTap editor
export async function typeInEditor(editorElement: HTMLElement, text: string) {
  const user = userEvent.setup();
  
  // Focus the editor
  fireEvent.focus(editorElement);
  
  // Type the text
  await user.type(editorElement, text);
}

// Helper to simulate editor formatting commands
export function simulateEditorCommand(mockEditor: Partial<Editor>, command: string, ...args: any[]) {
  const commands = mockEditor.commands as any;
  if (commands && commands[command]) {
    commands[command](...args);
  }
}

// Helper to assert editor content
export function expectEditorContent(mockEditor: Partial<Editor>, expectedContent: any) {
  expect(mockEditor.getJSON).toHaveBeenCalled();
  const actualContent = mockEditor.getJSON?.();
  expect(actualContent).toEqual(expectedContent);
}

// Helper to assert editor HTML output
export function expectEditorHTML(mockEditor: Partial<Editor>, expectedHTML: string) {
  expect(mockEditor.getHTML).toHaveBeenCalled();
  const actualHTML = mockEditor.getHTML?.();
  expect(actualHTML).toEqual(expectedHTML);
}

// Helper to test editor persistence
export async function testEditorPersistence(
  editor: Partial<Editor>,
  saveFunction: (content: any) => Promise<void>,
  expectedContent: any
) {
  // Simulate content change
  const setContentMock = editor.commands?.setContent as jest.Mock;
  setContentMock?.(expectedContent);
  
  // Simulate save
  await saveFunction(expectedContent);
  
  // Verify save was called with correct content
  expect(setContentMock).toHaveBeenCalledWith(expectedContent);
}

// Mock TipTap extensions for testing
export const mockTipTapExtensions = [
  StarterKit.configure({
    // Disable history in tests to avoid issues
    history: false,
  }),
];

// Helper to create editor test data
export function createEditorTestData(title: string, content?: any) {
  return {
    id: `test-page-${Date.now()}`,
    title,
    type: 'project',
    tenant_id: 'test-tenant',
    created_by: 'test-user',
    updated_by: 'test-user',
    properties: {
      status: {
        type: 'select',
        select: { name: 'Active', color: 'green' }
      }
    },
    blocks: [
      {
        type: 'document',
        content: {
          tiptap_content: content || SAMPLE_TIPTAP_CONTENT,
          word_count: 25
        }
      }
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
} 