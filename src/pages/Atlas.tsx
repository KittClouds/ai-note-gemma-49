// src/pages/Atlas.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useNotes } from "@/contexts/LiveStoreNotesContext";
import { toAtlasData, AtlasRecord } from "@/lib/atlas/atlasAdapter";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Network } from "lucide-react";
import { embeddingsService } from "@/lib/embeddings/embeddingsService";
import { SimpleEmbeddingView } from "@/components/SimpleEmbeddingView";

export default function AtlasPage() {
  const { theme } = useTheme();
  const { selectItem } = useNotes();
  const [isLoading, setIsLoading] = React.useState(false);
  const [atlas, setAtlas] = React.useState<ReturnType<typeof toAtlasData> | null>(null);

  const sync = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const records = await embeddingsService.getAtlasData();
      setAtlas(toAtlasData(records));
    } catch (error) {
      console.error('Failed to sync embeddings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // initial load
    sync();
  }, [sync]);

  // Handle note selection when a point is clicked
  const handleSelection = React.useCallback((noteId: string) => {
    selectItem(noteId);
  }, [selectItem]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-3 mb-4">
        <Network className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Embedding Atlas</h1>
        <Button onClick={sync} disabled={isLoading} variant="outline" size="sm">
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          Sync Embeddings
        </Button>
      </div>

      {atlas && atlas.x.length > 0 ? (
        <SimpleEmbeddingView
          data={{
            x: atlas.x,
            y: atlas.y,
            ids: atlas.ids,
            titles: atlas.titles,
            snippets: atlas.snippets,
          }}
          onSelection={handleSelection}
          colorScheme={theme === "dark" ? "dark" : "light"}
        />
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Loading embeddings..." : "No embedding data yet. Click \"Sync Embeddings\" to visualize your notes."}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}