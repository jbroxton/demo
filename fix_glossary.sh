#\!/bin/bash

# Fix all glossary terms to insert just the text
sed -i '' 's/editor\.chain()\.focus()\.deleteRange(range)\.insertContent(\s*'"'"'<span[^>]*>\([^<]*\)<\/span>'"'"'\s*)/editor.chain().focus().deleteRange(range).insertContent("\1")/g' /Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx

# Also handle cases with escaped quotes
sed -i '' "s/editor\.chain()\.focus()\.deleteRange(range)\.insertContent(\s*'<span[^>]*>\([^<]*\)<\/span>'\s*)/editor.chain().focus().deleteRange(range).insertContent('\1')/g" /Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx
