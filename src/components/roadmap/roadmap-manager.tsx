'use client'

import { useState, useEffect } from 'react';
import { useRoadmapsQuery } from '@/hooks/use-roadmaps-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2, Check } from 'lucide-react';
import { Roadmap } from '@/types/models/Roadmap';
import { RoadmapFeaturesTable } from './roadmap-features-table';

export function RoadmapManager() {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [showNewRoadmapDialog, setShowNewRoadmapDialog] = useState(false);
  const [newRoadmapData, setNewRoadmapData] = useState({ name: '', description: '', is_default: false });
  const [editRoadmapData, setEditRoadmapData] = useState<null | { id: string, name: string, description: string }>(null);

  const {
    roadmaps,
    isLoading,
    error,
    addRoadmap,
    updateRoadmap,
    deleteRoadmap
  } = useRoadmapsQuery();

  // Set default roadmap when data loads
  useEffect(() => {
    if (roadmaps.length > 0 && !selectedRoadmapId) {
      // Try to find default roadmap first
      const defaultRoadmap = roadmaps.find(r => r.is_default === 1);
      if (defaultRoadmap) {
        setSelectedRoadmapId(defaultRoadmap.id);
      } else {
        // Otherwise use the first roadmap
        setSelectedRoadmapId(roadmaps[0].id);
      }
    }
  }, [roadmaps, selectedRoadmapId]);

  // Handle creating a new roadmap
  const handleCreateRoadmap = async () => {
    try {
      await addRoadmap(newRoadmapData);
      setNewRoadmapData({ name: '', description: '', is_default: false });
      setShowNewRoadmapDialog(false);
    } catch (error) {
      console.error('Error creating roadmap:', error);
    }
  };

  // Handle updating a roadmap
  const handleUpdateRoadmap = async () => {
    if (!editRoadmapData) return;

    try {
      await updateRoadmap(editRoadmapData.id, {
        name: editRoadmapData.name,
        description: editRoadmapData.description
      });
      setEditRoadmapData(null);
    } catch (error) {
      console.error('Error updating roadmap:', error);
    }
  };

  // Handle deleting a roadmap
  const handleDeleteRoadmap = async (id: string) => {
    try {
      await deleteRoadmap(id);
      if (selectedRoadmapId === id) {
        setSelectedRoadmapId(null);
      }
    } catch (error) {
      console.error('Error deleting roadmap:', error);
    }
  };

  // Handle setting a roadmap as default
  const handleSetDefault = async (id: string) => {
    try {
      await updateRoadmap(id, { is_default: true });
    } catch (error) {
      console.error('Error setting default roadmap:', error);
    }
  };

  if (isLoading) {
    return <div>Loading roadmaps...</div>;
  }

  if (error) {
    return <div>Error loading roadmaps: {String(error)}</div>;
  }

  const selectedRoadmap = roadmaps.find(r => r.id === selectedRoadmapId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Select 
            value={selectedRoadmapId || ''} 
            onValueChange={setSelectedRoadmapId}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a roadmap" />
            </SelectTrigger>
            <SelectContent>
              {roadmaps.map(roadmap => (
                <SelectItem key={roadmap.id} value={roadmap.id}>
                  {roadmap.name} {roadmap.is_default === 1 && "(Default)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedRoadmap && !selectedRoadmap.is_default && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetDefault(selectedRoadmap.id)}
            >
              <Check className="h-4 w-4 mr-2" /> Set as Default
            </Button>
          )}
        </div>
        
        <Dialog open={showNewRoadmapDialog} onOpenChange={setShowNewRoadmapDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" /> New Roadmap
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Roadmap</DialogTitle>
              <DialogDescription>
                Create a new roadmap to organize your features.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newRoadmapData.name}
                  onChange={e => setNewRoadmapData({...newRoadmapData, name: e.target.value})}
                  placeholder="Roadmap name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRoadmapData.description}
                  onChange={e => setNewRoadmapData({...newRoadmapData, description: e.target.value})}
                  placeholder="Roadmap description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={newRoadmapData.is_default}
                  onChange={e => setNewRoadmapData({...newRoadmapData, is_default: e.target.checked})}
                />
                <Label htmlFor="is_default">Set as default roadmap</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreateRoadmap}>Create Roadmap</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRoadmap && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              {editRoadmapData?.id === selectedRoadmap.id ? (
                <div className="space-y-2 w-full">
                  <Input
                    value={editRoadmapData.name}
                    onChange={e => setEditRoadmapData({...editRoadmapData, name: e.target.value})}
                  />
                  <Textarea
                    value={editRoadmapData.description}
                    onChange={e => setEditRoadmapData({...editRoadmapData, description: e.target.value})}
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleUpdateRoadmap}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditRoadmapData(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <CardTitle>{selectedRoadmap.name}</CardTitle>
                    <CardDescription>{selectedRoadmap.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditRoadmapData({
                        id: selectedRoadmap.id,
                        name: selectedRoadmap.name,
                        description: selectedRoadmap.description || ''
                      })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!selectedRoadmap.is_default && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <RoadmapFeaturesTable roadmapId={selectedRoadmap.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}