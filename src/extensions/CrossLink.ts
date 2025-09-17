
import { Node, mergeAttributes } from '@tiptap/core';

export interface CrossLinkOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    crosslink: {
      setCrossLink: (options: { noteId: string; label?: string }) => ReturnType;
      openNoteById: (noteId: string) => ReturnType;
    };
  }
}

export const CrossLink = Node.create<CrossLinkOptions>({
  name: 'crosslink',
  inline: true,
  group: 'inline',
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      noteId: {
        default: null,
        parseHTML: element => element.getAttribute('data-note-id'),
        renderHTML: attributes => ({
          'data-note-id': attributes.noteId,
        }),
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => ({
          'data-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-crosslink]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-crosslink': true,
          class: 'bg-purple-600/20 text-purple-300 px-1 rounded font-medium cursor-pointer hover:bg-purple-600/30',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      `<<${HTMLAttributes.label || HTMLAttributes.noteId}>>`,
    ];
  },

  addCommands() {
    return {
      setCrossLink:
        options =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      openNoteById:
        noteId =>
        ({ editor }) => {
          // Emit custom event for note navigation
          const event = new CustomEvent('openNote', {
            detail: { noteId }
          });
          editor.view.dom.dispatchEvent(event);
          return true;
        },
    };
  },
});
