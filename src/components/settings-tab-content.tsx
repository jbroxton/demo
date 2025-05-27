import React from 'react';
import { SettingsDocumentEditor } from '@/components/settings-document-editor';

interface SettingsTabContentProps {
  tabId: string;
}

export function SettingsTabContent({ tabId }: SettingsTabContentProps) {
  return <SettingsDocumentEditor tabId={tabId} />;
}