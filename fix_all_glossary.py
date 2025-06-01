#!/usr/bin/env python3

import re

# Read the file
with open('/Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx', 'r') as f:
    content = f.read()

# Define the pattern to match span elements and extract just the text
pattern = r'editor\.chain\(\)\.focus\(\)\.deleteRange\(range\)\.insertContent\(\s*[\'"]<span[^>]*>([^<]+)<\/span>[\'"]'
replacement = r"editor.chain().focus().deleteRange(range).insertContent('\1')"

# Apply the replacement
fixed_content = re.sub(pattern, replacement, content)

# Write back to file
with open('/Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx', 'w') as f:
    f.write(fixed_content)

print("Fixed all glossary terms!")