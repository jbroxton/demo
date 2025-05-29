"use client";

import React from 'react';
import { Block } from '@/types/models/Block';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Code, FileText, List, Heading } from 'lucide-react';

interface BlockRendererProps {
  block: Block;
  isEditable?: boolean;
  onEdit?: (block: Block) => void;
}

export function BlockRenderer({ block, isEditable = false, onEdit }: BlockRendererProps) {
  const handleClick = () => {
    if (isEditable && onEdit) {
      onEdit(block);
    }
  };

  return (
    <div 
      className={`${isEditable ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={handleClick}
    >
      {renderBlockContent(block)}
    </div>
  );
}

function renderBlockContent(block: Block) {
  switch (block.type) {
    case 'document':
      return <DocumentBlock block={block} />;
    case 'requirement':
      return <RequirementBlock block={block} />;
    case 'criteria':
      return <CriteriaBlock block={block} />;
    case 'heading':
      return <HeadingBlock block={block} />;
    case 'bulleted_list':
    case 'numbered_list':
      return <ListBlock block={block} />;
    default:
      return <UnknownBlock block={block} />;
  }
}

function DocumentBlock({ block }: { block: Block }) {
  const content = block.content as import('@/types/models/Block').DocumentContent;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4" />
          <Badge variant="outline">Document</Badge>
          {content.word_count && (
            <span className="text-sm text-muted-foreground">
              {content.word_count} words
            </span>
          )}
        </div>
        <div className="prose max-w-none">
          {content.tiptap_content ? (
            <TipTapRenderer content={content.tiptap_content} />
          ) : (
            <p className="text-muted-foreground">Empty document</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementBlock({ block }: { block: Block }) {
  const content = block.content as import('@/types/models/Block').RequirementContent;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="h-4 w-4" />
          <Badge variant="outline">Requirement</Badge>
          <Badge variant={getPriorityVariant(content.priority)}>
            {content.priority || 'Medium'}
          </Badge>
          <Badge variant={getStatusVariant(content.status)}>
            {content.status || 'Draft'}
          </Badge>
        </div>
        
        {content.name && (
          <h4 className="font-semibold mb-2">{content.name}</h4>
        )}
        
        {content.cuj && (
          <p className="text-muted-foreground mb-2 italic">
            {content.cuj}
          </p>
        )}
        
        {content.owner && (
          <p className="text-sm text-muted-foreground">
            Owner: {content.owner}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CriteriaBlock({ block }: { block: Block }) {
  const content = block.content as import('@/types/models/Block').CriteriaContent;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Circle className="h-4 w-4" />
          <Badge variant="outline">Criteria</Badge>
          <Badge variant={getStatusVariant(content.status)}>
            {content.status || 'Draft'}
          </Badge>
        </div>
        
        {content.description && (
          <p className="mb-2">{content.description}</p>
        )}
        
        {content.acceptance_test && (
          <div className="bg-muted p-3 rounded">
            <p className="text-sm">
              <strong>Test:</strong> {content.acceptance_test}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HeadingBlock({ block }: { block: Block }) {
  const content = block.content as import('@/types/models/Block').HeadingContent;
  const level = content.level || 1;
  const text = content.rich_text?.[0]?.text?.content || 'Untitled Heading';
  
  const renderHeading = () => {
    switch (level) {
      case 1:
        return <h1 className="text-3xl font-bold">{text}</h1>;
      case 2:
        return <h2 className="text-2xl font-bold">{text}</h2>;
      case 3:
        return <h3 className="text-xl font-bold">{text}</h3>;
      default:
        return <h2 className="text-2xl font-bold">{text}</h2>;
    }
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Heading className="h-4 w-4" />
          <Badge variant="outline">Heading {level}</Badge>
        </div>
        {renderHeading()}
      </CardContent>
    </Card>
  );
}

function ListBlock({ block }: { block: Block }) {
  const content = block.content as import('@/types/models/Block').ListContent;
  const items = content.rich_text || [];
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <List className="h-4 w-4" />
          <Badge variant="outline">List</Badge>
          <span className="text-sm text-muted-foreground">
            {items.length} items
          </span>
        </div>
        
        {items.length > 0 ? (
          <ul className="list-disc list-inside space-y-1">
            {items.map((item, index: number) => (
              <li key={index} className="text-sm">
                {item.text?.content || ''}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Empty list</p>
        )}
      </CardContent>
    </Card>
  );
}


function UnknownBlock({ block }: { block: Block }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="destructive">Unknown: {block.type}</Badge>
        </div>
        <pre className="text-sm text-muted-foreground">
          {JSON.stringify(block.content, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

// TipTap content renderer for document blocks
function TipTapRenderer({ content }: { content: any }) {
  if (!content?.content) {
    return <p className="text-muted-foreground">Empty content</p>;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index}>
            {node.content?.map((child: any, childIndex: number) => 
              renderNode(child, childIndex)
            )}
          </p>
        );
      
      case 'heading':
        const level = node.attrs?.level || 1;
        const content = node.content?.map((child: any, childIndex: number) => 
          renderNode(child, childIndex)
        );
        switch (level) {
          case 1:
            return <h1 key={index}>{content}</h1>;
          case 2:
            return <h2 key={index}>{content}</h2>;
          case 3:
            return <h3 key={index}>{content}</h3>;
          case 4:
            return <h4 key={index}>{content}</h4>;
          case 5:
            return <h5 key={index}>{content}</h5>;
          case 6:
            return <h6 key={index}>{content}</h6>;
          default:
            return <h2 key={index}>{content}</h2>;
        }
      
      case 'text':
        let text = node.text || '';
        
        // Apply text marks
        if (node.marks) {
          for (const mark of node.marks) {
            switch (mark.type) {
              case 'bold':
                text = <strong key={index}>{text}</strong>;
                break;
              case 'italic':
                text = <em key={index}>{text}</em>;
                break;
              case 'code':
                text = <code key={index} className="bg-muted px-1 rounded">{text}</code>;
                break;
              case 'link':
                text = <a key={index} href={mark.attrs?.href} className="text-blue-600 underline">{text}</a>;
                break;
            }
          }
        }
        
        return text;
      
      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside">
            {node.content?.map((child: any, childIndex: number) => 
              renderNode(child, childIndex)
            )}
          </ul>
        );
      
      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside">
            {node.content?.map((child: any, childIndex: number) => 
              renderNode(child, childIndex)
            )}
          </ol>
        );
      
      case 'listItem':
        return (
          <li key={index}>
            {node.content?.map((child: any, childIndex: number) => 
              renderNode(child, childIndex)
            )}
          </li>
        );
      
      case 'codeBlock':
        return (
          <pre key={index} className="bg-muted p-3 rounded overflow-x-auto">
            <code>{node.content?.[0]?.text || ''}</code>
          </pre>
        );
      
      default:
        return (
          <div key={index} className="text-muted-foreground">
            [Unknown node: {node.type}]
          </div>
        );
    }
  };

  return (
    <div>
      {content.content.map((node: any, index: number) => renderNode(node, index))}
    </div>
  );
}

// Helper functions for badge variants
function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority?.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'complete':
      return 'default';
    case 'in progress':
      return 'secondary';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}