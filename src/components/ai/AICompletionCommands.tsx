
import { CommandGroup, CommandItem, CommandSeparator } from "@/components/ui/command";
import { Replace, TrashIcon } from "lucide-react";

interface AICompletionCommandsProps {
  completion: string;
  onDiscard: () => void;
  editor: any; // TipTap editor instance
}

const AICompletionCommands = ({
  completion,
  onDiscard,
  editor,
}: AICompletionCommandsProps) => {
  const handleInsertCompletion = () => {
    // Guard against missing editor or completion text
    if (!editor || !completion) {
      console.error("Editor instance or completion text is missing.");
      return;
    }

    // Chain Tiptap commands to perform the insertion/replacement
    editor
      .chain()
      .focus()
      .insertContent(completion)
      .run();

    // Call the onDiscard function to close the AI UI after the action is complete
    onDiscard();
  };

  return (
    <>
      <CommandGroup>
        <CommandItem
          className="gap-2 px-4"
          value="insert-replace"
          onSelect={handleInsertCompletion}
        >
          <Replace className="h-4 w-4 text-muted-foreground" />
          Insert/Replace
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />

      <CommandGroup>
        <CommandItem onSelect={onDiscard} value="discard" className="gap-2 px-4">
          <TrashIcon className="h-4 w-4 text-muted-foreground" />
          Discard
        </CommandItem>
      </CommandGroup>
    </>
  );
};

export default AICompletionCommands;
