
import { useState, useEffect, useCallback } from 'react';
import { storyStructureService } from '@/lib/story/storyStructureService';
import { StoryStructure, StoryStructureNode, StoryHierarchyLevel } from '@/types/storyStructure';

export interface UseStoryStructureReturn {
  structure: StoryStructure | null;
  loading: boolean;
  error: string | null;
  createNode: (title: string, level: StoryHierarchyLevel, parentId?: string, metadata?: any) => StoryStructureNode | null;
  associateNotes: (nodeId: string, noteIds: string[]) => void;
  switchPerspective: (perspectiveId: string) => void;
  getViewData: (perspectiveId?: string) => any;
  refreshStructure: () => void;
}

export function useStoryStructure(autoInitialize: boolean = true): UseStoryStructureReturn {
  const [structure, setStructure] = useState<StoryStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStructure = useCallback(() => {
    try {
      const currentStructure = storyStructureService.getStructure();
      setStructure(currentStructure);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load story structure');
      console.error('[useStoryStructure] Error refreshing structure:', err);
    }
  }, []);

  useEffect(() => {
    if (autoInitialize) {
      setLoading(true);
      try {
        const initialStructure = storyStructureService.initializeStructure();
        setStructure(initialStructure);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize story structure');
        console.error('[useStoryStructure] Error initializing:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [autoInitialize]);

  const createNode = useCallback((
    title: string,
    level: StoryHierarchyLevel,
    parentId?: string,
    metadata?: any
  ): StoryStructureNode | null => {
    try {
      const node = storyStructureService.createNode(title, level, parentId, metadata);
      refreshStructure();
      return node;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create node');
      console.error('[useStoryStructure] Error creating node:', err);
      return null;
    }
  }, [refreshStructure]);

  const associateNotes = useCallback((nodeId: string, noteIds: string[]) => {
    try {
      storyStructureService.associateNotes(nodeId, noteIds);
      refreshStructure();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to associate notes');
      console.error('[useStoryStructure] Error associating notes:', err);
    }
  }, [refreshStructure]);

  const switchPerspective = useCallback((perspectiveId: string) => {
    try {
      storyStructureService.switchPerspective(perspectiveId);
      refreshStructure();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch perspective');
      console.error('[useStoryStructure] Error switching perspective:', err);
    }
  }, [refreshStructure]);

  const getViewData = useCallback((perspectiveId?: string) => {
    try {
      const viewId = perspectiveId || structure?.activeView || 'structural';
      return storyStructureService.getStructureByPerspective(viewId);
    } catch (err) {
      console.error('[useStoryStructure] Error getting view data:', err);
      return null;
    }
  }, [structure]);

  return {
    structure,
    loading,
    error,
    createNode,
    associateNotes,
    switchPerspective,
    getViewData,
    refreshStructure
  };
}
