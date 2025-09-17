
import React, { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { GlobalEntityManagerContent } from './GlobalEntityManagerContent';
import { TemplateManagerDrawer } from '../template-manager/TemplateManagerDrawer';

export function EntityManagerDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="World Bible - Entity Manager"
        >
          <Database className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[85vh]">
        <DrawerHeader className="border-b">
          <DrawerTitle className="flex items-center justify-between">
            World Bible - Entity Manager
            <TemplateManagerDrawer />
          </DrawerTitle>
        </DrawerHeader>
        <GlobalEntityManagerContent />
      </DrawerContent>
    </Drawer>
  );
}
