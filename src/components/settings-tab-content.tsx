import { SettingsDocumentEditor } from '@/components/settings-document-editor';

interface SettingsTabContentProps {
  tabId: string;
}

export function SettingsTabContent({ tabId }: SettingsTabContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] relative">
      <div className="flex-1 flex flex-col h-full overflow-visible transition-all duration-300">
        <div className="flex-1 flex flex-col relative">
          <SettingsDocumentEditor tabId={tabId} />
        </div>
      </div>
    </div>
  );
}