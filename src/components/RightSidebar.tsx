
import React, { useState } from 'react';
import { Database, Bot, FileText } from 'lucide-react';
import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RightSidebar as RightSidebarWrapper } from './RightSidebarProvider';
import { OverviewContainer } from './entity-attributes/OverviewContainer';
import { EntityContainer } from './entity-attributes/EntityContainer';
import { FactSheetContainer } from './entity-attributes/FactSheetContainer';
import AISidebar from './AISidebar';

const RightSidebar = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <RightSidebarWrapper className="border-l border-border/50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <SidebarHeader className="p-4 border-b border-border/50">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="entity" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Entity</span>
            </TabsTrigger>
            <TabsTrigger value="factsheet" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Fact Sheet</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>
        </SidebarHeader>

        <SidebarContent className="overflow-hidden p-0 flex-1">
          <TabsContent value="overview" className="h-full m-0">
            <OverviewContainer />
          </TabsContent>
          
          <TabsContent value="entity" className="h-full m-0">
            <EntityContainer />
          </TabsContent>
          
          <TabsContent value="factsheet" className="h-full m-0">
            <FactSheetContainer />
          </TabsContent>
          
          <TabsContent value="ai" className="h-full m-0">
            <AISidebar />
          </TabsContent>
        </SidebarContent>
      </Tabs>
    </RightSidebarWrapper>
  );
};

export default RightSidebar;
