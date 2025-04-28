import React from 'react';
import { Requirement } from '@/stores/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RequirementsPlaceholderProps {
  requirements?: Requirement[];
  isEditing?: boolean;
}

export function RequirementsPlaceholder({ 
  requirements = [], 
  isEditing = false 
}: RequirementsPlaceholderProps) {
  return (
    <Card className="bg-[#1e1e20] border-[#2a2a2c]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        {requirements.length > 0 ? (
          <div className="text-sm text-[#a0a0a0]">
            {requirements.length} requirement(s) added
          </div>
        ) : (
          <div className="text-sm text-[#a0a0a0]">
            {isEditing 
              ? "Add requirements to this feature by clicking 'Add Requirement' in the action bar." 
              : "No requirements added yet."}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 