
import React, { useState, useRef, useEffect } from 'react';
import { FileAsset, Folder } from '../types';
import { 
  FileText, Image, Package, Plus, Folder as FolderIcon, 
  ChevronRight, UploadCloud, Search, Copy, Clipboard, 
  ArrowLeft, Filter, MoreHorizontal, Share2, Trash2, Edit2, Scissors
} from 'lucide-react';

interface FileManagerProps {
  files: FileAsset[];
  setFiles: React.Dispatch<React.SetStateAction<FileAsset[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  isDriveConnected: boolean;
}

type SortOption = 'NAME' | 'DATE' | 'SIZE';

export const FileManager: React.FC<FileManagerProps> = ({ files, setFiles, folders, setFolders, isDriveConnected }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('DATE');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ 
    visible: boolean; 
    x: number; 
    y: number; 
    type: 'FILE' | 'FOLDER' | 'BACKGROUND'; 
    id?: string 
  }>({ visible: false, x: 0, y: 0, type: 'BACKGROUND' });

  // Clipboard State (for Copy/Cut/Paste)
  const [clipboard, setClipboard] = useState<{ 
    type: 'file' | 'folder', 
    id: string, 
    action: 'COPY' | 'CUT' 
  } | null>(null);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, visible: false });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // Filter & Sort Logic
  const filteredFiles = files.filter(f => 
    (f.folderId || null) === currentFolderId && 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredFolders = folders.filter(f => 
    (f.parentId || null) === currentFolderId && 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortItems = <T extends { name: string, dateModified?: Date, size?: string }>(items: T[]) => {
    return [...items].sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === 'DATE' && a.dateModified && b.dateModified) {
        valA = new Date(a.dateModified).getTime();
        valB = new Date(b.dateModified).getTime();
      } else if (sortBy === 'SIZE' && a.size && b.size) {
        valA = parseFloat(a.size);
        valB = parseFloat(b.size);
      }

      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });
  };

  const sortedFiles = sortItems(filteredFiles);
  const sortedFolders = sortItems(filteredFolders);

  // Breadcrumb Logic
  const getBreadcrumbs = () => {
    if (!currentFolderId) return [{ id: null, name: 'Root' }];
    const path = [];
    let curr = folders.find(f => f.id === currentFolderId);
    while (curr) {
      path.unshift(curr);
      curr = folders.find(f => f.id === curr?.parentId);
    }
    return [{ id: null, name: 'Root' }, ...path];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newFile: FileAsset = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type.includes('image') ? 'IMAGE' : file.type.includes('pdf') ? 'PDF' : 'DOC',
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          dateModified: new Date(),
          tag: 'Upload',
          folderId: currentFolderId || undefined,
          url: result
        };
        setFiles(prev => [newFile, ...prev]);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFolder = () => {
    const name = prompt("Enter folder name:", "New Folder");
    if (name) {
      const newFolder: Folder = {
        id: Date.now().toString(),
        name,
        parentId: currentFolderId || undefined
      };
      setFolders(prev => [...prev, newFolder]);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'FILE' | 'FOLDER' | 'BACKGROUND', id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      id
    });
  };

  const handleAction = (action: string) => {
    const { type, id } = contextMenu;
    if (!id && action !== 'PASTE' && action !== 'NEW_FOLDER' && action !== 'UPLOAD') return;

    switch (action) {
        case 'OPEN':
            if (type === 'FOLDER' && id) setCurrentFolderId(id);
            break;
        case 'RENAME':
            const item = type === 'FILE' ? files.find(f => f.id === id) : folders.find(f => f.id === id);
            if (item) {
                const newName = prompt("Rename to:", item.name);
                if (newName) {
                    if (type === 'FILE') {
                        setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
                    } else {
                        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
                    }
                }
            }
            break;
        case 'DELETE':
            if (confirm("Are you sure you want to delete this item?")) {
                if (type === 'FILE') {
                    setFiles(prev => prev.filter(f => f.id !== id));
                } else {
                    setFolders(prev => prev.filter(f => f.id !== id));
                    // Also delete contents? For now just the folder to keep simple
                }
            }
            break;
        case 'SHARE':
            // Mock share
            alert(`Link copied to clipboard: designpreneur.os/share/${id}`);
            break;
        case 'COPY':
            if (id) setClipboard({ type: type === 'FILE' ? 'file' : 'folder', id, action: 'COPY' });
            break;
        case 'CUT':
            if (id) setClipboard({ type: type === 'FILE' ? 'file' : 'folder', id, action: 'CUT' });
            break;
        case 'PASTE':
            if (!clipboard) return;
            
            if (clipboard.type === 'file') {
                const file = files.find(f => f.id === clipboard.id);
                if (file) {
                    if (clipboard.action === 'CUT') {
                        // Move
                        setFiles(prev => prev.map(f => f.id === clipboard.id ? { ...f, folderId: currentFolderId || undefined } : f));
                    } else {
                        // Copy
                        const newFile: FileAsset = {
                            ...file,
                            id: Date.now().toString(),
                            name: `${file.name} (Copy)`,
                            folderId: currentFolderId || undefined,
                            dateModified: new Date()
                        };
                        setFiles(prev => [...prev, newFile]);
                    }
                }
            } else {
                // Folder logic (simplified, shallow copy/move)
                const folder = folders.find(f => f.id === clipboard.id);
                if (folder) {
                    if (clipboard.id === currentFolderId) return; // Prevent pasting into self
                    if (clipboard.action === 'CUT') {
                        setFolders(prev => prev.map(f => f.id === clipboard.id ? { ...f, parentId: currentFolderId || undefined } : f));
                    } else {
                        const newFolder: Folder = {
                            ...folder,
                            id: Date.now().toString(),
                            name: `${folder.name} (Copy)`,
                            parentId: currentFolderId || undefined
                        };
                        setFolders(prev => [...prev, newFolder]);
                    }
                }
            }
            if (clipboard.action === 'CUT') setClipboard(null); // Clear after move
            break;
        case 'NEW_FOLDER':
            handleCreateFolder();
            break;
        case 'UPLOAD':
            fileInputRef.current?.click();
            break;
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  const getIcon = (type: string, url?: string) => {
    if (type === 'IMAGE' && url) {
        return <img src={url} alt="preview" className="w-full h-full object-cover rounded-xl" />;
    }
    switch(type) {
      case 'IMAGE': return <Image size={24} className="text-purple-400" />;
      case 'PDF': return <FileText size={24} className="text-red-400" />;
      case 'ZIP': return <Package size={24} className="text-yellow-400" />;
      default: return <FileText size={24} className="text-gray-400" />;
    }
  };

  const goBack = () => {
    if (currentFolderId) {
        const curr = folders.find(f => f.id === currentFolderId);
        setCurrentFolderId(curr?.parentId || null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 md:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Asset Management</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Design Files
            {isDriveConnected && (
              <span className="text-[10px] bg-green-900/30 text-green-400 border border-green-900/50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Drive Synced</span>
            )}
          </h1>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
          >
            <UploadCloud size={16} /> Upload
          </button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-400 overflow-x-auto pb-2">
        {getBreadcrumbs().map((crumb, index, arr) => (
          <React.Fragment key={crumb.id || 'root'}>
            <button 
              onClick={() => setCurrentFolderId(crumb.id as string | null)}
              className={`hover:text-white font-medium transition-colors ${index === arr.length - 1 ? 'text-white' : ''}`}
            >
              {crumb.name}
            </button>
            {index < arr.length - 1 && <ChevronRight size={14} className="text-gray-600" />}
          </React.Fragment>
        ))}
      </div>

      {/* Main Content Area */}
      <div 
        className="bg-card-bg rounded-[2.5rem] border border-gray-800 p-8 min-h-[600px] flex flex-col relative"
        onContextMenu={(e) => handleContextMenu(e, 'BACKGROUND')}
      >
        
        {/* Controls Bar */}
        <div className="flex items-center gap-3 mb-6">
           {currentFolderId && (
               <button 
                onClick={goBack}
                className="w-12 h-12 bg-[#141416] border border-gray-800 rounded-xl flex items-center justify-center text-white hover:bg-gray-800 hover:border-accent-blue transition-all flex-shrink-0"
               >
                 <ArrowLeft size={20} />
               </button>
           )}
           
           <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search assets..." 
               className="w-full bg-[#141416] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent-blue transition-colors h-12"
             />
           </div>

           {/* Filter/Sort Dropdown */}
            <div className="relative group">
                <button className="h-12 px-4 bg-[#141416] border border-gray-800 rounded-xl flex items-center gap-2 text-gray-400 hover:text-white hover:border-gray-600 transition-all">
                    <Filter size={18} />
                    <span className="text-xs font-bold uppercase hidden md:inline">{sortBy}</span>
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#141416] border border-gray-800 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-20">
                    {(['DATE', 'NAME', 'SIZE'] as SortOption[]).map(opt => (
                        <button 
                            key={opt}
                            onClick={() => setSortBy(opt)}
                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/5 ${sortBy === opt ? 'text-accent-blue' : 'text-gray-400'}`}
                        >
                            {opt}
                        </button>
                    ))}
                    <div className="h-px bg-gray-800"></div>
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
                        className="w-full text-left px-4 py-3 text-xs font-bold text-gray-400 hover:bg-white/5"
                    >
                        {sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
                    </button>
                </div>
            </div>
        </div>

        {/* Empty State */}
        {sortedFolders.length === 0 && sortedFiles.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-3xl m-4 pointer-events-none">
             <UploadCloud size={48} className="mb-4 opacity-20" />
             <p className="font-bold">Folder is empty</p>
             <p className="text-xs mt-1">Right-click to add items</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 content-start">
          
          {/* Folders */}
          {sortedFolders.map((folder) => (
            <div 
              key={folder.id} 
              onDoubleClick={() => setCurrentFolderId(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, 'FOLDER', folder.id)}
              className="bg-[#141416] p-4 rounded-2xl border border-gray-800 flex flex-col gap-3 hover:border-accent-blue/50 cursor-pointer transition-all group aspect-square justify-between relative"
            >
               <button 
                 onClick={(e) => { e.stopPropagation(); handleContextMenu(e, 'FOLDER', folder.id); }}
                 className="absolute top-2 right-2 p-1.5 hover:bg-gray-700 rounded-lg text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
               >
                    <MoreHorizontal size={16} />
               </button>

              <div 
                className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center group-hover:bg-accent-blue/20 transition-colors"
              >
                <FolderIcon size={20} className="text-gray-400 group-hover:text-accent-blue" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-300 truncate block">{folder.name}</span>
                <span className="text-[10px] text-gray-600 uppercase font-bold">Folder</span>
              </div>
            </div>
          ))}

          {/* Files */}
          {sortedFiles.map((file) => (
            <div 
                key={file.id} 
                onContextMenu={(e) => handleContextMenu(e, 'FILE', file.id)}
                className="bg-[#141416] p-4 rounded-2xl border border-gray-800 flex flex-col justify-between group hover:border-gray-600 transition-all aspect-square relative cursor-default"
            >
               <button 
                 onClick={(e) => { e.stopPropagation(); handleContextMenu(e, 'FILE', file.id); }}
                 className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-gray-700 rounded-lg text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
               >
                    <MoreHorizontal size={16} />
               </button>
              
              <div className="flex-1 flex items-center justify-center overflow-hidden rounded-xl mb-3 bg-gray-800">
                {getIcon(file.type, file.url)}
              </div>
              
              <div>
                <div className="font-bold text-sm text-white mb-1 truncate w-full" title={file.name}>{file.name}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider flex justify-between">
                  <span>{file.size}</span>
                  <span>{file.type}</span>
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Context Menu UI */}
      {contextMenu.visible && (
        <div 
            className="fixed z-50 bg-[#141416] border border-gray-700 rounded-xl shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.type === 'BACKGROUND' ? (
                <>
                    <button onClick={() => handleAction('NEW_FOLDER')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <FolderIcon size={14} /> New Folder
                    </button>
                    <button onClick={() => handleAction('UPLOAD')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <UploadCloud size={14} /> Upload File
                    </button>
                    {clipboard && (
                        <>
                        <div className="h-px bg-gray-800 my-1"></div>
                        <button onClick={() => handleAction('PASTE')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                            <Clipboard size={14} /> Paste
                        </button>
                        </>
                    )}
                </>
            ) : (
                <>
                    {contextMenu.type === 'FOLDER' && (
                         <button onClick={() => handleAction('OPEN')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                            <FolderIcon size={14} /> Open
                         </button>
                    )}
                    <button onClick={() => handleAction('SHARE')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <Share2 size={14} /> Share Link
                    </button>
                    <button onClick={() => handleAction('RENAME')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <Edit2 size={14} /> Rename
                    </button>
                    <div className="h-px bg-gray-800 my-1"></div>
                    <button onClick={() => handleAction('CUT')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <Scissors size={14} /> Cut
                    </button>
                    <button onClick={() => handleAction('COPY')} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-bold text-white flex items-center gap-2">
                        <Copy size={14} /> Copy
                    </button>
                    <div className="h-px bg-gray-800 my-1"></div>
                    <button onClick={() => handleAction('DELETE')} className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-sm font-bold text-red-500 flex items-center gap-2">
                        <Trash2 size={14} /> Delete
                    </button>
                </>
            )}
        </div>
      )}

    </div>
  );
};
