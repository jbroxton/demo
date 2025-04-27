import React, { useEffect, useState } from 'react';
import { useInterfacesStore } from '@/stores/interfaces';
import { useTabsStore } from '@/stores/tabs';
import { Input } from '@/components/ui/input';
import { Pencil, Check, Layers } from 'lucide-react';

interface InterfaceTabContentProps {
  interfaceId: string;
}

export function InterfaceTabContent({ interfaceId }: InterfaceTabContentProps) {
  const { getInterfaceById, updateInterfaceName } = useInterfacesStore();
  const { updateTabTitle } = useTabsStore();
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const interface_ = getInterfaceById(interfaceId);
  
  // Handle client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Initialize name value from interface
    if (interface_) {
      setNameValue(interface_.name);
    }
  }, [interface_]);
  
  if (!interface_) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e20] text-[#a0a0a0]">
        Interface not found
      </div>
    );
  }
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameValue(e.target.value);
  };
  
  const handleNameSave = () => {
    if (nameValue.trim() !== '' && nameValue !== interface_.name) {
      updateInterfaceName(interfaceId, nameValue);
      updateTabTitle(interfaceId, 'interface', nameValue);
    } else {
      // Reset to original name if empty or unchanged
      setNameValue(interface_.name);
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setNameValue(interface_.name);
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
                aria-label="Save interface name"
              >
                <Check className="h-4 w-4 text-green-500" />
              </button>
            </div>
          ) : (
            <h1 
              className="text-xl font-medium text-white flex items-center cursor-pointer hover:bg-[#232326] px-2 py-0.5 rounded-md"
              onClick={() => setIsEditing(true)}
            >
              <Layers className="h-5 w-5 mr-2 text-muted-foreground" />
              {interface_.name}
              <Pencil className="ml-2 h-4 w-4 opacity-50" />
            </h1>
          )}
        </div>
        {interface_.description && (
          <div className="text-sm text-[#a0a0a0] mt-2">
            {interface_.description}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden p-4">
        <div className="text-white">
          <h2 className="text-lg font-medium mb-4">Interface Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Description</p>
              <p>{interface_.description || "No description provided."}</p>
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Product</p>
              <p>Connected to product ID: {interface_.productId}</p>
            </div>
            
            <div>
              <p className="text-[#a0a0a0] text-sm mb-1">Features</p>
              <p>{interface_.features && interface_.features.length > 0 
                ? `${interface_.features.length} features connected` 
                : "No features connected to this interface."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 