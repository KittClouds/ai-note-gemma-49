
import React from 'react';
import { StoryIntelligenceDashboard } from './StoryIntelligenceDashboard';
import { Card } from '@/components/ui/card';

export function StoryIntelligencePanel() {
  return (
    <div className="h-full">
      <StoryIntelligenceDashboard className="h-full border-0 shadow-none" />
    </div>
  );
}
