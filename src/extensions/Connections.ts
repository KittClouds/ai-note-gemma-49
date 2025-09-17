
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface ParsedConnections {
  tags: string[];
  mentions: string[];
  links: string[];
  entities: Array<{ kind: string; label: string; attributes?: any }>;
  triples: Array<{ subject: any; predicate: string; object: any }>;
  backlinks: string[];
}

function parseNoteConnections(json: any): ParsedConnections {
  const connections: ParsedConnections = {
    tags: [],
    mentions: [],
    links: [],
    entities: [],
    triples: [],
    backlinks: []
  };

  const extractFromNode = (node: any) => {
    if (!node) return;

    switch (node.type) {
      case 'tag':
        if (node.attrs?.tag) {
          connections.tags.push(node.attrs.tag);
        }
        break;
      case 'wikilink':
        if (node.attrs?.target) {
          connections.links.push(node.attrs.target);
        }
        break;
      case 'entity':
        if (node.attrs?.kind && node.attrs?.label) {
          connections.entities.push({
            kind: node.attrs.kind,
            label: node.attrs.label,
            attributes: node.attrs.attributes
          });
        }
        break;
      case 'triple':
        if (node.attrs?.subject && node.attrs?.predicate && node.attrs?.object) {
          connections.triples.push({
            subject: node.attrs.subject,
            predicate: node.attrs.predicate,
            object: node.attrs.object
          });
        }
        break;
      case 'crosslink':
        if (node.attrs?.noteId) {
          connections.backlinks.push(node.attrs.noteId);
        }
        break;
    }

    // Extract mentions from marks
    if (node.marks) {
      node.marks.forEach((mark: any) => {
        if (mark.type === 'mention' && mark.attrs?.id) {
          connections.mentions.push(mark.attrs.id);
        }
      });
    }

    // Recursively process child nodes
    if (node.content) {
      node.content.forEach(extractFromNode);
    }
  };

  if (json.content) {
    json.content.forEach(extractFromNode);
  }

  return connections;
}

export const Connections = Extension.create({
  name: 'connections',

  addStorage() {
    return {
      tags: [],
      mentions: [],
      links: [],
      entities: [],
      triples: [],
      backlinks: [],
      crosslinks: []
    } as ParsedConnections & { crosslinks: Array<{ noteId: string; label: string }> };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('connections'),
        appendTransaction: (transactions, oldState, newState) => {
          // Only recalculate if the document has changed
          const docChanged = transactions.some(tr => tr.docChanged);
          if (!docChanged) return null;

          // Parse connections from the current document
          const json = this.editor.getJSON();
          const connections = parseNoteConnections(json);

          // Extract crosslinks
          const crosslinks: Array<{ noteId: string; label: string }> = [];
          
          const extractCrosslinks = (node: any) => {
            if (node.type === 'crosslink') {
              crosslinks.push({
                noteId: node.attrs?.noteId || '',
                label: node.attrs?.label || node.attrs?.noteId || ''
              });
            }
            if (node.content) {
              node.content.forEach(extractCrosslinks);
            }
          };
          
          if (json.content) {
            json.content.forEach(extractCrosslinks);
          }

          // Update storage
          this.storage.tags = connections.tags;
          this.storage.mentions = connections.mentions;
          this.storage.links = connections.links;
          this.storage.entities = connections.entities;
          this.storage.triples = connections.triples;
          this.storage.backlinks = connections.backlinks;
          this.storage.crosslinks = crosslinks;

          // Use setTimeout to emit event after transaction is complete
          setTimeout(() => {
            // Create a custom event on the editor's DOM element
            const event = new CustomEvent('connectionsUpdate', {
              detail: { ...this.storage }
            });
            this.editor.view.dom.dispatchEvent(event);
          }, 0);

          return null; // No transaction needed, just updating storage
        },
      }),
    ];
  },
});
