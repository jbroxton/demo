# Fixing Cursor Jump Issues in Tiptap

## The Problem

When typing in a Tiptap editor, the cursor would unexpectedly jump to the end of the document after each keystroke or after a few keystrokes. This made the editor practically unusable for content creation.

## Root Cause

After investigating, we identified a circular update pattern causing the cursor jumps:

1. User types in the editor
2. The editor fires `onUpdate` which calls `onChange` prop
3. Parent component updates its state with new content
4. Parent passes this updated content back to the editor as `initialContent`
5. The editor replaces its content with the new `initialContent`
6. Content replacement resets cursor position to the end
7. Cycle repeats with each keystroke

This is a common issue in controlled components where two-way data binding causes unintended content replacement.

## Solution

We implemented a focus-based protection system that prevents content updates when the user is actively typing:

```tsx
// Key part of the solution
useEffect(() => {
  // Skip if editor isn't available
  if (!editor || editor.isDestroyed) {
    return;
  }
  
  // Process content
  const content = processedContent();
  const contentString = typeof content === 'string' ? content : JSON.stringify(content);
  
  // Skip if content hasn't changed
  if (lastContent.current === contentString) {
    return;
  }
  
  // For first load, set the content directly
  if (!hasInitialized.current) {
    // Set initial content and mark as a programmatic update
    isApplyingTransaction.current = true;
    editor.commands.setContent(content);
    lastContent.current = contentString;
    hasInitialized.current = true;
    
    // Reset flag
    setTimeout(() => {
      isApplyingTransaction.current = false;
    }, 0);
    
    return;
  }
  
  // If editor is focused (user is typing), don't update content
  if (editor.isFocused) {
    console.log('[SimpleEditor] Skipping content update while editor is focused');
    return;
  }
  
  // Otherwise, it's safe to update content (when editor doesn't have focus)
  isApplyingTransaction.current = true;
  editor.commands.setContent(content);
  lastContent.current = contentString;
  
  // Reset flag after a brief delay
  setTimeout(() => {
    isApplyingTransaction.current = false;
  }, 0);
}
```

## Implementation Details

1. **Focus-Based Protection**
   - We use `editor.isFocused` to detect if the user is actively typing
   - Content updates from props are completely skipped when the editor has focus
   - This breaks the circular update cycle during typing

2. **Transaction Flagging**
   - We use `isApplyingTransaction.current` to track programmatic content changes
   - This prevents the editor from triggering `onChange` when we update content programmatically
   - The flag is reset after the current call stack completes

3. **Initialization Handling**
   - First content load is handled specially to ensure initial content is set
   - The `hasInitialized` flag prevents unnecessary full content replacement after first load

4. **Content Comparison**
   - We track the last content string to avoid unnecessary updates
   - Skip updates if the content hasn't actually changed

5. **Debounced Updates**
   - Added debounced `onChange` handler to reduce update frequency (500ms)
   - This limits how often parent components receive content updates

## Why It Works

This solution works by breaking the circular update pattern at its core:

1. During active typing, external content updates are ignored completely
2. When the editor doesn't have focus, content can be safely updated without affecting user experience
3. Programmatic content updates are flagged to prevent triggering onChange
4. We only use the safer Tiptap commands API for content updates rather than direct ProseMirror manipulation

The key insight is that we don't need real-time bidirectional updates during active typing. When a user is typing, the flow should be one-way only: Editor → Parent Component. 

Parent → Editor updates should only happen when the editor doesn't have focus or on initial load.

## Notes on Alternative Solutions

We explored several approaches before settling on this solution:

1. Transaction-based filtering (using Tiptap's transaction events)
2. Selection preservation (storing and restoring cursor position)
3. Detecting page refreshes
4. Using deep comparison for content changes

The focus-based approach proved simplest and most reliable, addressing the root cause directly by breaking the update cycle during active typing.

## References

- [Tiptap Events Documentation](https://tiptap.dev/docs/editor/api/events)
- [React Controlled Components Best Practices](https://reactjs.org/docs/forms.html#controlled-components) 