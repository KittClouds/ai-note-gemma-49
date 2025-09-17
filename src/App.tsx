
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LiveStoreNotesProvider } from "@/contexts/LiveStoreNotesContext";
import { CommandHistoryProvider } from "@/contexts/CommandHistoryContext";
import { BulkSelectionProvider } from "@/contexts/BulkSelectionContext";
import { EntitySelectionProvider } from "@/contexts/EntitySelectionContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AtlasPage from "./pages/Atlas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CommandHistoryProvider>
            <LiveStoreNotesProvider>
              <BulkSelectionProvider>
                <EntitySelectionProvider>
                  <ChatHistoryProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/atlas" element={<AtlasPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ChatHistoryProvider>
                </EntitySelectionProvider>
              </BulkSelectionProvider>
            </LiveStoreNotesProvider>
          </CommandHistoryProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
