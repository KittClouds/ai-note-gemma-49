
export interface Note {
  id: string;
  title: string;
  content: string;
  type: 'note';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  title: string;
  type: 'folder';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export type FileSystemItem = Note | Folder;

export interface FileTreeState {
  items: FileSystemItem[];
  selectedItemId: string | null;
  expandedFolders: Set<string>;
}
