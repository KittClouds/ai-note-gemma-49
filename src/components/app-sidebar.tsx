
import * as React from "react";
import { Plus, FolderPlus, CheckSquare, Settings, MessageCircle, StickyNote, Network } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarRail, SidebarHeader } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileTreeItem } from "./FileTreeItem";
import { BulkActionsToolbar } from "./BulkActionsToolbar";
import { EnhancedSearchBar } from "./EnhancedSearchBar";
import { UndoRedoToolbar } from "./UndoRedoToolbar";
import { SystemStatusModal } from "./SystemStatusModal";
import { ChatHistoryView } from "./chat-history/ChatHistoryView";
import { useNotes } from "@/contexts/LiveStoreNotesContext";
import { useBulkSelection } from "@/contexts/BulkSelectionContext";
import { useState } from "react";
import { Note } from "@/types/notes";

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const {
    createNote,
    createFolder,
    getItemsByParent,
    state,
    selectItem,
    getSystemStatus
  } = useNotes();
  const {
    isSelectionMode,
    enterSelectionMode,
    hasSelection
  } = useBulkSelection();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("notes");
  const rootItems = getItemsByParent(); // Items without a parent
  const [showSystemStatus, setShowSystemStatus] = useState(false);

  // Get all notes from the state for search functionality
  const allNotes = state.items.filter(item => item.type === 'note') as Note[];

  // Filter items based on search query for text search
  const filteredItems = searchQuery.trim() ? rootItems.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.type === 'note' && item.content.toLowerCase().includes(searchQuery.toLowerCase())) : rootItems;
  
  const handleNoteSelect = (noteId: string) => {
    selectItem(noteId);
    setSearchQuery(""); // Clear search when selecting a note
  };
  
  const allItemIds = state.items.map(item => item.id);

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="atlas" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Atlas
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === "notes" && (
          <div className="flex items-center justify-between p-2">
            <h2 className="text-lg font-semibold">Notes</h2>
            <div className="flex gap-1">
              {!isSelectionMode && (
                <>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => createNote()} title="New Note">
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => createFolder()} title="New Folder">
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={enterSelectionMode} title="Bulk Select">
                    <CheckSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowSystemStatus(true)} title="System Status">
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "notes" && <UndoRedoToolbar />}
      </SidebarHeader>

      <SidebarContent className="mx-0">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="notes" className="h-full m-0">
            {isSelectionMode && <BulkActionsToolbar allItemIds={allItemIds} />}
            
            {!isSelectionMode && (
              <SidebarGroup>
                <SidebarGroupLabel>Search</SidebarGroupLabel>
                <SidebarGroupContent>
                  <EnhancedSearchBar 
                    searchQuery={searchQuery} 
                    onSearchChange={setSearchQuery} 
                    notes={allNotes} 
                    onNoteSelect={handleNoteSelect} 
                    className="px-2" 
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            
            <SidebarGroup>
              <SidebarGroupLabel>
                {isSelectionMode ? 'Select Items' : 'All Notes'}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map(item => (
                    <FileTreeItem key={item.id} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>

          <TabsContent value="chats" className="h-full m-0">
            <ChatHistoryView />
          </TabsContent>

          <TabsContent value="atlas" className="h-full m-0">
            <div className="p-4 text-center">
              <Network className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Visualize your notes as an interactive embedding map
              </p>
              <Button
                onClick={() => window.location.href = '/atlas'}
                variant="outline"
                className="w-full"
              >
                Open Atlas View
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SidebarContent>

      <SidebarRail />
      <SystemStatusModal 
        open={showSystemStatus} 
        onOpenChange={setShowSystemStatus} 
        mergeVacuumStats={getSystemStatus().mergeVacuum} 
      />
    </Sidebar>
  );
}
