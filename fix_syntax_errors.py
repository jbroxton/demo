#!/usr/bin/env python3

import re

# Read the file
with open('/Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx', 'r') as f:
    content = f.read()

# Fix all the broken syntax patterns
fixes = [
    # Fix broken insertContent calls
    (r'insertContent\(\'([^\']+)\'\n\.run\(\);', r"insertContent('\1').run();"),
    (r'insertContent\(\'([^\']+)\'\s+\.run\(\);', r"insertContent('\1').run();"),
    
    # Fix missing closing parentheses in comments
    (r'pagesQuery\.getPageById\(\s*\n', r'pagesQuery.getPageById()\n'),
    (r'single document\s*\n', r'single document)\n'),
    (r'direct TipTap\s*\n', r'direct TipTap)\n'),
    (r'1/3 second\s*\n', r'1/3 second)\n'),
    (r'300ms debounce\s*\n', r'300ms debounce)\n'),
    (r'via provider\s*\n', r'via provider)\n'),
    (r'\.toISOString\(\s*\n', r'.toISOString()\n'),
    
    # Fix filter issues
    (r'\.toLowerCase\(\s*\n', r'.toLowerCase())\n'),
    (r'item\.title\s*\n\s*\);', r'item.title)'),
    (r'\.includes\(item\.title\s*\n\s*\);', r'.includes(item.title)'),
    
    # Fix map issues
    (r'lang\.name\`\s*\n', r'lang.name}`)'),
    
    # Fix bubble menu shouldShow
    (r'!editor\.isActive\(\'table\'\s*\n', r"!editor.isActive('table')"),
]

for pattern, replacement in fixes:
    content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Write back to file
with open('/Users/delaghetto/Documents/Projects/demo/src/components/unified-page-editor.tsx', 'w') as f:
    f.write(content)

print("Fixed syntax errors!")