import React, { useEffect, useState } from 'react';
import { useFeaturesStore, Feature } from '@/stores/features';
import { useInterfacesStore } from '@/stores/interfaces';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Puzzle, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeatureDescriptionEditor } from './feature-description-editor';

interface FeatureTabContentProps {
  featureId: string;
  tabId: string;
  isNew?: boolean;
  selectedInterfaceId?: string;
}

export function FeatureTabContent({ 
  featureId, 
  tabId,
  isNew = false,
  selectedInterfaceId 
}: FeatureTabContentProps) {
  const { getFeatureById, updateFeatureName, updateFeatureDescription, addFeature } = useFeaturesStore();
  const { getInterfaceById, getInterfaces, updateInterfaceWithFeature } = useInterfacesStore();
  const { updateTabTitle, closeTab, updateNewTabToSavedItem, activateTab } = useTabsStore();
  
  // State
  const [isClient, setIsClient] = useState(false);
  const [isEditingName, setIsEditingName] = useState(isNew);
  const [nameValue, setNameValue] = useState('');
  const [descriptionValue, setDescriptionValue] = useState('');
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [priorityValue, setPriorityValue] = useState<'High' | 'Med' | 'Low'>('Med');
  const [interfaceId, setInterfaceId] = useState(selectedInterfaceId || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // Get feature data
  const feature = !isNew ? getFeatureById(featureId) : null;
  const interfaces = getInterfaces();
  const selectedInterface = interfaceId ? getInterfaceById(interfaceId) : null;
  
  // Handle client-side rendering and initialize from feature data
  useEffect(() => {
    setIsClient(true);
    
    // Initialize values from feature when we have a feature
    if (feature) {
      setNameValue(feature.name);
      setDescriptionValue(feature.description || '');
      setPriorityValue(feature.priority);
      setInterfaceId(feature.interfaceId);
    }
  }, [feature]);
  
  // Show "not found" for non-existent features
  if (!isNew && !feature) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Feature not found or not loaded yet.
      </div>
    );
  }
  
  // Event handlers
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescriptionValue(e.target.value);
  };
  
  const handlePriorityChange = (value: string) => {
    setPriorityValue(value as 'High' | 'Med' | 'Low');
  };
  
  const handleInterfaceChange = (value: string) => {
    setInterfaceId(value);
  };
  
  const handleNameSave = () => {
    if (!isNew && feature && nameValue.trim()) {
      const trimmedName = nameValue.trim();
      if (trimmedName !== feature.name) {
        updateFeatureName(featureId, trimmedName);
        updateTabTitle(featureId, 'feature', trimmedName);
      }
      setIsEditingName(false);
    } else if (!isNew && feature) {
      setNameValue(feature.name);
      setIsEditingName(false);
    }
  };
  
  const handleDescriptionSave = () => {
    if (!isNew && feature) {
      updateFeatureDescription(featureId, descriptionValue);
      setIsDescriptionEditing(false);
    }
  };
  
  const handleSaveNewFeature = async () => {
    if (!nameValue.trim() || !interfaceId) {
      console.warn("Save prevented: Name and Interface are required.");
      return;
    }
    
    setIsSaving(true);
    setShowSaveSuccess(false);
    
    try {
      const newFeatureData: Omit<Feature, 'id'> = {
        name: nameValue.trim(),
        description: descriptionValue,
        priority: priorityValue,
        interfaceId: interfaceId,
      };

      const savedFeature = await addFeature(newFeatureData);

      if (savedFeature && savedFeature.id) {
        const temporaryTabId = tabId; 
        
        console.log('[FeatureTabContent] Calling updateNewTabToSavedItem with type:', 'feature');
        updateNewTabToSavedItem(temporaryTabId, savedFeature.id, savedFeature.name, 'feature');
        
        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);

        updateInterfaceWithFeature(interfaceId, savedFeature.id); 

        console.log('New Feature saved successfully. Tab updated.');

      } else {
         console.error('Failed to get new feature details after saving.');
      }

    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      if (!isNew && feature) {
        setNameValue(feature.name);
      }
      setIsEditingName(false);
    }
  };
  
  const handleCancelNewFeature = () => {
    closeTab(featureId);
  };
  
  return (
    <div className="flex flex-col h-full bg-[#1e1e20]">
      <div className="px-6 py-4 border-b border-[#232326]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            <Puzzle className="h-5 w-5 mr-2 text-muted-foreground" />
            {isEditingName ? (
              <div className="flex items-center w-full max-w-lg">
                <Input
                  value={nameValue}
                  onChange={handleNameChange}
                  onBlur={isNew ? undefined : handleNameSave}
                  onKeyDown={handleNameKeyDown}
                  autoFocus
                  className="text-xl font-medium text-white bg-[#232326] border-[#2a2a2c]"
                  placeholder="Enter feature name"
                />
                {!isNew && (
                  <button 
                    onClick={handleNameSave}
                    className="ml-2 p-1 rounded-md hover:bg-[#232326]"
                    aria-label="Save feature name"
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </button>
                )}
              </div>
            ) : (
              <h1 
                className="text-xl font-medium text-white flex items-center cursor-pointer hover:bg-[#232326] px-2 py-0.5 rounded-md"
                onClick={() => setIsEditingName(true)}
                title="Click to edit feature name"
              >
                {nameValue} 
                <Pencil className="h-4 w-4 ml-2 opacity-50" />
              </h1>
            )}
          </div>
          {!isNew && feature && (
             <div className="flex items-center">
               <span className="text-sm text-[#a0a0a0] mr-2">Priority:</span>
               <span className="text-sm text-white">{feature.priority}</span> 
             </div>
          )}
        </div>
        {showSaveSuccess && (
          <div className="text-sm text-green-500 mt-1 transition-opacity duration-300">
             Saved successfully!
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
          {isNew || isDescriptionEditing ? (
            <div className="border border-[#2a2a2c] rounded-md overflow-hidden">
              <FeatureDescriptionEditor
                initialContent={descriptionValue}
                onChange={(value) => setDescriptionValue(value)}
                placeholder="Enter feature description..."
              />
              {!isNew && (
                 <div className="p-2 bg-[#1e1e20] flex justify-end">
                   <Button 
                     size="sm"
                     onClick={handleDescriptionSave}
                     className="bg-blue-600 hover:bg-blue-700 text-white"
                   >
                     Save Description
                   </Button>
                 </div>
              )}
            </div>
          ) : (
            <div 
              className="prose prose-invert max-w-none cursor-pointer hover:bg-[#232326] px-2 py-1 rounded-md border border-transparent hover:border-[#2a2a2c] flex items-start min-h-[50px]"
              onClick={() => {
                setDescriptionValue(feature?.description || ''); 
                setIsDescriptionEditing(true);
              }}
              title="Click to edit description"
            >
              {isClient && feature?.description ? (
                <div 
                  className="flex-1 quill-editor-display ql-editor"
                  dangerouslySetInnerHTML={{ __html: feature.description }}
                />
              ) : (
                <span className="text-[#575757] italic flex-1">No description provided. Click to edit.</span>
              )}
              <Pencil className="h-4 w-4 opacity-50 ml-2 flex-shrink-0 self-center" />
            </div>
          )}
        </div>
        
        <div>
          <p className="text-[#a0a0a0] text-sm mb-1">Interface</p>
          {isNew ? (
            <div className="max-w-md">
              <Select
                value={interfaceId}
                onValueChange={handleInterfaceChange}
                disabled={interfaces.length === 0}
              >
                <SelectTrigger className="w-full bg-[#232326] border-[#2a2a2c]">
                  <SelectValue placeholder="Select an interface..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e1e20] border-[#2a2a2c] text-white">
                  {interfaces.map((iface) => (
                    <SelectItem key={iface.id} value={iface.id} className="hover:bg-[#2a2a2c]">
                      {iface.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {interfaces.length === 0 && (
                <p className="text-sm text-red-400 mt-1">
                  No interfaces available. Create an interface first.
                </p>
              )}
            </div>
          ) : (
            <p className="text-white">{selectedInterface ? selectedInterface.name : "N/A"}</p>
          )}
        </div>

        {isNew && (
          <div className="mt-8 flex justify-end space-x-3">
             <Button 
                variant="outline"
                onClick={handleCancelNewFeature}
                className="text-white border-[#555] hover:bg-[#333]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            <Button 
              onClick={handleSaveNewFeature}
              disabled={!nameValue.trim() || !interfaceId || isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Feature'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 