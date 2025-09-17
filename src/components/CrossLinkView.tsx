
import { NodeViewWrapper } from '@tiptap/react';
import { useCallback } from 'react';
import { ReactNodeViewProps } from '@tiptap/react';

const CrossLinkView = ({ node, editor }: ReactNodeViewProps) => {
  const noteId = node.attrs.noteId as string;
  const label = node.attrs.label as string;

  const handleClick = useCallback(() => {
    editor.commands.openNoteById(noteId);
  }, [editor, noteId]);

  return (
    <NodeViewWrapper
      as="span"
      className="bg-purple-600/20 text-purple-300 px-1 rounded font-medium cursor-pointer hover:bg-purple-600/30 transition-colors"
      onClick={handleClick}
    >
      &lt;&lt;{label || noteId}&gt;&gt;
    </NodeViewWrapper>
  );
};

export default CrossLinkView;
