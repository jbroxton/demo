import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddStageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stageType?: 'main' | 'launch';
  onSave: (stageData: { name: string; description: string; type: 'main' | 'launch'; order: number }) => void;
}

export function AddStageDialog({ 
  isOpen, 
  onClose, 
  stageType = 'main',
  onSave 
}: AddStageDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'main' | 'launch'>(stageType);
  const [order, setOrder] = useState(50); // default to middle
  
  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim(),
      type,
      order
    });
    
    // Reset form
    setName('');
    setDescription('');
    setType(stageType);
    setOrder(50);
    
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e20] border-[#2a2a2c] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Custom Stage</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#a0a0a0]">Stage Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#232326] border-[#2a2a2c]"
              placeholder="Enter stage name"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-[#a0a0a0]">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#232326] border-[#2a2a2c] min-h-24"
              placeholder="Enter stage description"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="type" className="text-[#a0a0a0]">Stage Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as 'main' | 'launch')}
            >
              <SelectTrigger 
                id="type"
                className="bg-[#232326] border-[#2a2a2c]"
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] border-[#2a2a2c] text-white">
                <SelectItem value="main">Main Stage</SelectItem>
                <SelectItem value="launch">Launch Phase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="order" className="text-[#a0a0a0]">Display Order</Label>
            <Input
              id="order"
              type="number"
              min="0"
              max="100"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="bg-[#232326] border-[#2a2a2c]"
            />
            <p className="text-xs text-[#a0a0a0]">Lower numbers display first (0-100)</p>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-[#232326] border-[#2a2a2c] hover:bg-[#2a2a2c] text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Stage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}