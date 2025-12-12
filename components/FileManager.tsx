
import React, { useState } from 'react';
import { FileAsset, Folder, Client } from '../types';
import { Plus, UploadCloud, Search, Folder as FolderIcon, FileText, Image as ImageIcon, MoreHorizontal, Edit2, Trash2, Filter } from 'lucide-react';

interface FileManagerProps {
  files: FileAsset[];
  setFiles: React.Dispatch<React.SetStateAction<FileAsset[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  clients?: Client[];
}

export const FileManager: React.FC<FileManagerProps> = ({ files, setFiles, folders, setFolders, clients = [] }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'DOC' | 'PDF'>('ALL');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editClientId, setEditClientId] = useState('');

  // Get current directory contents
  const currentFiles = files.filter(f => f.folderId === currentFolderId && (filterType === 'ALL' || f.type === filterType) && f.name.toLowerCase().includes(search.toLowerCase()));
  const currentFolders = folders.filter(f => f.parentId === currentFolderId && f.name.toLowerCase().includes(search.toLowerCase()));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles: FileAsset[] = Array.from(e.target.files).map((file: File) => {
              const ext = file.name.split('.').pop()?.toLowerCase();
              let type: any = 'DOC';
              if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext || '')) type = 'IMAGE';
              if (ext === 'pdf') type = 'PDF';
              
              return {
                  id: Date.now().toString() + Math.random(),
                  name: file.name,
                  type: type,
                  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                  dateModified: new Date(),
                  tag: 'Upload',
                  folderId: currentFolderId,
                  url: URL.createObjectURL(file) // For preview
              };
          });
          setFiles(prev => [...prev, ...newFiles]);
      }
  };

  const createFolder = () => {
      const newFolder: Folder = {
          id: Date.now().toString(),
          name: 'New Folder',
          parentId: currentFolderId,
          color: '#3b82f6'
      };
      setFolders(prev => [...prev, newFolder]);
      startEditing(newFolder.id, newFolder.name, newFolder.color, newFolder.clientId);
  };

  const startEditing = (id: string, name: string, color?: string, clientId?: string) => {
      setEditingId(id);
      setEditName(name);
      setEditColor(color || '#3b82f6');
      setEditClientId(clientId || '');
  };

  const saveEdit = () => {
      if (!editingId) return;
      
      // Check if folder
      const isFolder = folders.find(f => f.id === editingId);
      if (isFolder) {
          setFolders(prev => prev.map(f => f.id === editingId ? { ...f, name: editName, color: editColor, clientId: editClientId || undefined } : f));
      } else {
          // Is File
          setFiles(prev => prev.map(f => f.id === editingId ? { ...f, name: editName } : f));
      }
      setEditingId(null);
  };

  const deleteItem = (id: string, isFolder: boolean) => {
      if (confirm("Are you sure?")) {
          if (isFolder) {
              setFolders(prev => prev.filter(f => f.id !== id));
              // Should strictly delete children recursively but keeping simple
          } else {
              setFiles(prev => prev.filter(f => f.id !== id));
          }
      }
  };
  
  const getFileIcon = (file: FileAsset) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext || '')) {
          return file.url ? <img src={file.url} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-muted-foreground" />;
      }
      
      // Adobe & Design Files
      if (ext === 'psd') return <div className="w-full h-full bg-[#001E36] flex items-center justify-center text-[#31A8FF] font-bold border border-[#31A8FF]/30">Ps</div>;
      if (ext === 'ai') return <div className="w-full h-full bg-[#330000] flex items-center justify-center text-[#FF9A00] font-bold border border-[#FF9A00]/30">Ai</div>;
      if (ext === 'id' || ext === 'indd') return <div className="w-full h-full bg-[#2D001E] flex items-center justify-center text-[#FF3366] font-bold border border-[#FF3366]/30">Id</div>;
      if (ext === 'xd') return <div className="w-full h-full bg-[#2E001F] flex items-center justify-center text-[#FF26BE] font-bold border border-[#FF26BE]/30">Xd</div>;
      if (ext === 'fig') return <div className="w-full h-full bg-[#1E1E1E] flex items-center justify-center text-white font-bold border border-white/10 relative"><div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#F24E1E]"></div>Fig</div>;
      
      return <FileText size={24} className="text-muted-foreground" />;
  };

  return (
    <div className="flex flex-col h-full w-full space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Assets</h1>
        <div className="flex gap-3">
            <button onClick={createFolder} className="bg-secondary border border-border text-foreground px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-secondary/80 transition-colors">
                <Plus size={16} /> New Folder
            </button>
            <label className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 shadow-glow transition-colors cursor-pointer">
                <UploadCloud size={16} /> Upload
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
        </div>
      </div>

      <div className="bg-card rounded-[2rem] border border-border p-6 flex-1 overflow-y-auto shadow-soft flex flex-col">
         {/* Toolbar */}
         <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {currentFolderId && (
                <button onClick={() => setCurrentFolderId(undefined)} className="text-sm font-bold text-muted-foreground hover:text-foreground">
                    &larr; Back to Root
                </button>
            )}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search resources..." 
                    className="w-full bg-secondary h-10 rounded-xl pl-10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground border border-border text-sm" 
                />
            </div>
            <div className="flex gap-2">
                {['ALL', 'IMAGE', 'DOC', 'PDF'].map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilterType(f as any)} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === f ? 'bg-foreground text-background' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>
         </div>

         {/* Grid */}
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto p-1">
            
            {/* Folders */}
            {currentFolders.map(folder => (
                <div key={folder.id} className="relative group">
                    <div 
                        onClick={() => setCurrentFolderId(folder.id)}
                        className="bg-secondary p-4 rounded-2xl border border-border hover:border-primary/50 cursor-pointer transition-all aspect-square flex flex-col justify-between hover:bg-secondary/80"
                    >
                        <div className="flex justify-between items-start">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: folder.color || '#3b82f6' }}>
                                <FolderIcon size={20} fill="currentColor" />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); startEditing(folder.id, folder.name, folder.color, folder.clientId); }} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded">
                                <Edit2 size={12} />
                            </button>
                        </div>
                        <div>
                            <div className="font-bold text-foreground truncate text-sm">{folder.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                {folder.clientId && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                                {folder.clientId ? clients.find(c => c.id === folder.clientId)?.name : 'Folder'}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Files */}
            {currentFiles.map(file => (
                <div key={file.id} className="relative group">
                    <div className="bg-secondary p-4 rounded-2xl border border-border hover:border-primary/50 transition-all aspect-square flex flex-col justify-between hover:bg-secondary/80">
                        <div className="flex-1 bg-background rounded-xl mb-3 overflow-hidden flex items-center justify-center relative border border-border">
                            {getFileIcon(file)}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                                <button onClick={() => startEditing(file.id, file.name)} className="p-1 bg-black/50 text-white rounded hover:bg-black/70"><Edit2 size={10} /></button>
                                <button onClick={() => deleteItem(file.id, false)} className="p-1 bg-red-500/80 text-white rounded hover:bg-red-600"><Trash2 size={10} /></button>
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-foreground text-xs truncate" title={file.name}>{file.name}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{file.size}</div>
                        </div>
                    </div>
                </div>
            ))}
            
            {currentFiles.length === 0 && currentFolders.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <FolderIcon size={48} className="mb-4 opacity-20" />
                    <p>No files found in this directory.</p>
                </div>
            )}
         </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditingId(null)}>
              <div className="bg-card border border-border p-6 rounded-2xl w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold mb-4">Edit Item</h3>
                  <div className="space-y-3">
                      <input 
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-secondary border border-border rounded-lg p-2 text-sm"
                        placeholder="Name"
                      />
                      
                      {/* Folder specific options */}
                      {folders.find(f => f.id === editingId) && (
                          <>
                            <div className="flex gap-2 mt-2">
                                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setEditColor(c)}
                                        className={`w-6 h-6 rounded-full border ${editColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                            <select 
                                value={editClientId}
                                onChange={e => setEditClientId(e.target.value)}
                                className="w-full bg-secondary border border-border rounded-lg p-2 text-sm mt-2"
                            >
                                <option value="">No Client Linked</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                          </>
                      )}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                      {folders.find(f => f.id === editingId) && (
                          <button onClick={() => { deleteItem(editingId, true); setEditingId(null); }} className="px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded text-xs font-bold mr-auto">Delete</button>
                      )}
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-muted-foreground text-xs font-bold">Cancel</button>
                      <button onClick={saveEdit} className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold">Save</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
