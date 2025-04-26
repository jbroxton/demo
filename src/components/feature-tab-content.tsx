import React, { useEffect, useState } from 'react';
import { useFeaturesStore } from '@/stores/features';
import { FeatureEditor } from './feature-editor';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Pencil, Check } from 'lucide-react';

interface FeatureTabContentProps {
  featureId: string;
}

export function FeatureTabContent({ featureId }: FeatureTabContentProps) {
  const { getFeatureById, updateFeatureName } = useFeaturesStore();
  const { updateTabTitle } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const feature = getFeatureById(featureId);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize name value from feature
    if (feature) {
      setNameValue(feature.name);
    }
  }, [feature]);
  
  if (!feature) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Feature not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== feature.name) {
      updateFeatureName(featureId, nameValue);
      updateTabTitle(featureId, 'feature', nameValue);
    } else {
      // Reset to original name if empty or unchanged
      setNameValue(feature.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(feature.name);
      setIsEditing(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326]">
        <div className="flex items-center mb-1">
          {isEditing ? (
            <div className="flex items-center w-full max-w-lg">
              <Input
                value={nameValue}
                onChange={handleNameChange}
                onBlur={handleNameSave}
                onKeyDown={handleKeyDown}
                autoFocus
                className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
              />
              <button 
                onClick={handleNameSave}
                className="ml-2 p-1 rounded-md hover:bg-[#232326]"
                aria-label="Save feature name"
              >
                <Check className="h-4 w-4 text-green-500" />
              </button>
            </div>
          ) : (
            <h1 
              className="text-xl font-medium text-white flex items-center cursor-pointer hover:bg-[#232326] px-2 py-0.5 rounded-md"
              onClick={() => setIsEditing(true)}
            >
              {feature.name}
              <Pencil className="ml-2 h-4 w-4 opacity-50" />
            </h1>
          )}
        </div>
        <div className="flex items-center mt-2 gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full ${
              feature.priority === 'High' ? 'bg-red-500' : 
              feature.priority === 'Med' ? 'bg-yellow-500' : 'bg-blue-500'
            } mr-2`}></div>
            <span className="text-sm text-[#a0a0a0]">{feature.priority} Priority</span>
          </div>
          {feature.description && (
            <div className="text-sm text-[#a0a0a0] truncate max-w-md">
              {feature.description}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        {!isClient ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-[#a0a0a0]">Loading editor...</div>
          </div>
        ) : (
          <FeatureEditor 
            featureId={featureId} 
            initialContent={feature.content || "Enter details about this feature here..."}
          />
        )}
      </div>
    </div>
  );
} 