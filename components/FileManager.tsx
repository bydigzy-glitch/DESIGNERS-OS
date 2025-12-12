
import React, { useState, useMemo } from 'react';
import { FileAsset, Folder, Client } from '../types';
import { 
  Search, Folder as FolderIcon, FileText, Image as ImageIcon, 
  MoreHorizontal, Edit2, Trash2, Filter, Plus, UploadCloud, 
  LayoutGrid, List, Clock, Star, Users, HardDrive, PieChart, 
  Video, Music, File as FileGeneric, MoreVertical, ChevronRight,
  ArrowUpRight, RefreshCw, RotateCcw, Heart, Menu, X
} from 'lucide-react';
import { FadeIn, CountUp } from './common/AnimatedComponents';
import { AnimatePresence, motion } from 'framer-motion';

interface FileManagerProps {
  files: FileAsset[];
  setFiles: React.Dispatch<React.SetStateAction<FileAsset[]>>;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  clients?: Client[];
  isDriveConnected?: boolean;
}

export const FileManager: React.FC<FileManagerProps> = ({ files, setFiles, folders, setFolders, clients = [], isDriveConnected }) => {
  const [activeSection, setActiveSection] = useState<'MY_STORAGE' | 'RECENTS' | 'FAVORITES' | 'TRASH'>('MY_STORAGE');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  // Stats Calculation (Live Data)
  const stats = useMemo(() => {
      const activeFiles = files.filter(f => !f.isTrashed);
      const imageCount = activeFiles.filter(f => f.type === 'IMAGE').length;
      const videoCount = activeFiles.filter(f => f.type === 'VIDEO').length;
      const docCount = activeFiles.filter(f => ['DOC', 'PDF'].includes(f.type)).length;
      const otherCount = activeFiles.length - imageCount - videoCount - docCount;
      
      const totalGB = 100; // Mocked Total
      // Mock sizes logic since we just have string "XX MB"
      const parseSize = (s: string) => parseFloat(s) || 0;
      const usedSize = activeFiles.reduce((acc, f) => acc + parseSize(f.size), 0);
      
      return {
          image: { count: imageCount, size: `${(imageCount * 2.5).toFixed(1)} MB`, total: '100 GB', color: 'bg-red-500', icon: <ImageIcon size={20} className="text-red-500" /> },
          video: { count: videoCount, size: `${(videoCount * 15).toFixed(1)} MB`, total: '100 GB', color: 'bg-blue-500', icon: <Video size={20} className="text-blue-500" /> },
          doc: { count: docCount, size: `${(docCount * 1.2).toFixed(1)} MB`, total: '100 GB', color: 'bg-emerald-500', icon: <FileText size={20} className="text-emerald-500" /> },
          other: { count: otherCount, size: `${(otherCount * 0.5).toFixed(1)} MB`, total: '100 GB', color: 'bg-yellow-500', icon: <MoreHorizontal size={20} className="text-yellow-500" /> },
          totalUsed: usedSize,
          usagePercent: Math.min(100, (usedSize / (totalGB * 1024)) * 100)
      };
  }, [files]);

  // Filtering Logic
  const displayFiles = useMemo(() => {
      let filtered = files;

      // 1. Section Filter
      if (activeSection === 'MY_STORAGE') {
          filtered = filtered.filter(f => !f.isTrashed);
      } else if (activeSection === 'RECENTS') {
          filtered = filtered.filter(f => !f.isTrashed); // Sort applied at end
      } else if (activeSection === 'FAVORITES') {
          filtered = filtered.filter(f => f.isFavorite && !f.isTrashed);
      } else if (activeSection === 'TRASH') {
          filtered = filtered.filter(f => f.isTrashed);
      }

      // 2. Search Filter
      if (search) {
          filtered = filtered.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
      }

      // 3. Dropdown Filter
      if (filterType) {
          filtered = filtered.filter(f => f.type === filterType);
      }

      // 4. Sorting
      // Default: Date Modified Descending
      return filtered.sort((a,b) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime());
  }, [files, activeSection, search, filterType]);

  // Actions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newFiles: FileAsset[] = Array.from(e.target.files).map((file: File) => {
              const ext = file.name.split('.').pop()?.toLowerCase();
              let type: any = 'DOC';
              if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext || '')) type = 'IMAGE';
              if (['mp4', 'mov', 'webm'].includes(ext || '')) type = 'VIDEO';
              if (ext === 'pdf') type = 'PDF';
              
              return {
                  id: Date.now().toString() + Math.random(),
                  name: file.name,
                  type: type,
                  size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                  dateModified: new Date(),
                  tag: 'Upload',
                  url: URL.createObjectURL(file),
                  isFavorite: false,
                  isTrashed: false
              };
          });
          setFiles(prev => [...newFiles, ...prev]);
      }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f));
  };

  const moveToTrash = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isTrashed: true } : f));
  };

  const restoreFromTrash = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setFiles(prev => prev.map(f => f.id === id ? { ...f, isTrashed: false } : f));
  };

  const deleteForever = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("Delete permanently?")) {
          setFiles(prev => prev.filter(f => f.id !== id));
      }
  };

  const getFileIcon = (file: FileAsset) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (file.type === 'IMAGE') return <ImageIcon size={20} className="text-red-400" />;
      if (file.type === 'VIDEO') return <Video size={20} className="text-blue-400" />;
      if (file.type === 'PDF') return <FileText size={20} className="text-red-500" />;
      if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileText size={20} className="text-emerald-500" />;
      if (['doc', 'docx'].includes(ext || '')) return <FileText size={20} className="text-blue-500" />;
      return <FileGeneric size={20} className="text-muted-foreground" />;
  };

  const SidebarContent = () => (
      <>
         <div>
             <button 
                onClick={() => { setActiveSection('MY_STORAGE'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-glow mb-6 transition-all ${activeSection === 'MY_STORAGE' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}
             >
                 <LayoutGrid size={18} /> Overview Storage
             </button>

             <div className="space-y-1">
                 <div className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">File Manager</div>
                 {[
                     { id: 'MY_STORAGE', label: 'My Storage', icon: <HardDrive size={18} /> },
                     { id: 'RECENTS', label: 'Recents', icon: <Clock size={18} /> },
                     { id: 'FAVORITES', label: 'Favorites', icon: <Star size={18} /> },
                     { id: 'TRASH', label: 'Trash', icon: <Trash2 size={18} /> },
                 ].map(item => (
                     <button 
                        key={item.id}
                        onClick={() => { setActiveSection(item.id as any); setIsMobileMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeSection === item.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}
                     >
                         <div className="flex items-center gap-3">
                             {item.icon} {item.label}
                         </div>
                         {item.id === 'RECENTS' && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{files.filter(f => !f.isTrashed && new Date().getTime() - new Date(f.dateModified).getTime() < 86400000).length}</span>}
                     </button>
                 ))}
             </div>
         </div>

         <div className="space-y-1 mt-6">
             <div className="text-xs font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">Team Storage</div>
             <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div> Civic Team
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div> Developer Team
             </button>
             <button className="w-full flex items-center gap-2 px-4 py-2 mt-2 text-xs font-bold text-primary hover:underline">
                 <Plus size={12} /> Add team storage
             </button>
         </div>

         <div className="mt-auto pt-6">
             <div className="flex justify-between items-end mb-2">
                 <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                     <HardDrive size={16} /> Storage
                 </div>
                 <span className="text-xs font-medium text-muted-foreground">{stats.usagePercent.toFixed(0)}%</span>
             </div>
             <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
                 <div className="h-full bg-primary rounded-full" style={{ width: `${stats.usagePercent}%` }}></div>
             </div>
             <button className="w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-glow hover:bg-primary/90 transition-colors">
                 Upgrade Plan
             </button>
         </div>
      </>
  );

  return (
    <FadeIn className="flex h-full w-full bg-background text-foreground overflow-hidden rounded-[2rem] border border-border shadow-2xl relative">
      
      {/* DESKTOP SIDEBAR */}
      <div className="w-64 border-r border-border p-5 hidden xl:flex flex-col gap-4 bg-card/50">
         <SidebarContent />
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
          {isMobileMenuOpen && (
              <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="absolute inset-0 bg-black/60 z-30 xl:hidden backdrop-blur-sm"
                />
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    className="absolute top-0 left-0 bottom-0 w-72 bg-card border-r border-border p-5 z-40 xl:hidden overflow-y-auto flex flex-col"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold">Menu</h2>
                        <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
                    </div>
                    <SidebarContent />
                </motion.div>
              </>
          )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-card pb-20 md:pb-0">
          
          {/* Header */}
          <div className="h-auto min-h-[80px] border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 bg-card/50 backdrop-blur-xl sticky top-0 z-20 gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-secondary rounded-lg xl:hidden">
                          <Menu size={20} />
                      </button>
                      <h2 className="text-xl font-bold text-foreground truncate">
                          {activeSection === 'MY_STORAGE' ? 'Overview' : 
                           activeSection === 'RECENTS' ? 'Recents' :
                           activeSection === 'FAVORITES' ? 'Favorites' : 'Trash'}
                      </h2>
                  </div>
                  <label className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-glow md:hidden">
                      <UploadCloud size={14} /> 
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..." 
                        className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary md:w-64"
                      />
                  </div>
                  
                  <div className="flex gap-1">
                      <div className="relative">
                          <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)} 
                            className={`p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors ${filterType ? 'text-primary bg-secondary' : ''}`}
                          >
                              <Filter size={18} />
                          </button>
                          {isFilterOpen && (
                              <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                  <div className="p-2 space-y-1">
                                      <button onClick={() => { setFilterType(null); setIsFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg">All Types</button>
                                      <button onClick={() => { setFilterType('IMAGE'); setIsFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg">Images</button>
                                      <button onClick={() => { setFilterType('VIDEO'); setIsFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg">Videos</button>
                                      <button onClick={() => { setFilterType('DOC'); setIsFilterOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-secondary rounded-lg">Documents</button>
                                  </div>
                              </div>
                          )}
                      </div>
                      
                      <button className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-colors hidden sm:block" onClick={() => setViewMode(viewMode === 'LIST' ? 'GRID' : 'LIST')}>
                          {viewMode === 'LIST' ? <LayoutGrid size={18} /> : <List size={18} />}
                      </button>
                  </div>

                  <label className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-glow hover:bg-primary/90 transition-colors cursor-pointer active:scale-95">
                      <UploadCloud size={16} /> <span>Upload</span>
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                  </label>
              </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
              
              {/* Only show Stats on My Storage */}
              {activeSection === 'MY_STORAGE' && (
                  <FadeIn>
                      <h3 className="text-lg font-bold text-foreground mb-4">Storage Breakdown</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                          {Object.entries(stats).filter(([k]) => ['image','video','doc','other'].includes(k)).map(([key, stat]: any) => (
                              <div key={key} className="bg-secondary/30 border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors group">
                                  <div className="flex items-start justify-between mb-4 md:mb-6">
                                      <div className={`p-3 rounded-xl bg-background border border-border shadow-sm`}>
                                          {stat.icon}
                                      </div>
                                      <button className="text-muted-foreground hover:text-foreground"><MoreVertical size={16} /></button>
                                  </div>
                                  <h4 className="text-lg font-bold text-foreground capitalize mb-1">{key}</h4>
                                  <p className="text-xs text-muted-foreground font-medium mb-4">{stat.count} items</p>
                                  
                                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden mb-2">
                                      <div className={`h-full rounded-full ${stat.color} w-[30%]`}></div>
                                  </div>
                                  <div className="text-xs font-bold text-muted-foreground">
                                      <span className="text-foreground">{stat.size}</span> used
                                  </div>
                              </div>
                          ))}
                      </div>
                  </FadeIn>
              )}

              {/* Only show Suggested on My Storage */}
              {activeSection === 'MY_STORAGE' && displayFiles.length > 0 && (
                  <FadeIn delay={0.1}>
                      <h3 className="text-lg font-bold text-foreground mb-4">Suggested</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                          {displayFiles.slice(0, 4).map(file => (
                              <div key={file.id} className="bg-secondary/30 border border-border rounded-2xl p-4 hover:bg-secondary/50 transition-colors group cursor-pointer">
                                  <div className="flex justify-between items-start mb-3">
                                      {getFileIcon(file)}
                                      <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal size={16} /></button>
                                  </div>
                                  <h4 className="text-sm font-bold text-foreground truncate mb-1" title={file.name}>{file.name}</h4>
                                  
                                  {/* Preview if image */}
                                  {file.type === 'IMAGE' && file.url ? (
                                      <div className="h-24 w-full rounded-lg overflow-hidden mt-2 bg-black/20">
                                          <img src={file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                  ) : (
                                      <div className="h-24 w-full rounded-lg overflow-hidden mt-2 bg-background border border-border flex items-center justify-center p-4">
                                          <div className="text-[10px] text-muted-foreground leading-relaxed overflow-hidden h-full text-center flex items-center">
                                              Preview unavailable
                                          </div>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </FadeIn>
              )}

              {/* Main File List */}
              <FadeIn delay={0.2} className="bg-secondary/10 border border-border rounded-2xl overflow-hidden min-h-[300px]">
                  <div className="p-4 md:p-6 border-b border-border flex justify-between items-center">
                      <h3 className="text-lg font-bold text-foreground">
                          {activeSection === 'TRASH' ? 'Trash Bin' : 'Files'}
                      </h3>
                      <div className="text-xs text-muted-foreground font-medium">
                          {displayFiles.length} items
                      </div>
                  </div>
                  
                  {viewMode === 'LIST' ? (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm min-w-[600px]">
                              <thead className="bg-secondary/30 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                                  <tr>
                                      <th className="px-4 md:px-6 py-4 w-10"><input type="checkbox" className="rounded bg-background border-border" /></th>
                                      <th className="px-4 md:px-6 py-4">Name</th>
                                      <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Size</th>
                                      <th className="px-4 md:px-6 py-4 hidden md:table-cell">Shared</th>
                                      <th className="px-4 md:px-6 py-4 hidden sm:table-cell">Last Modified</th>
                                      <th className="px-4 md:px-6 py-4 text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                  {displayFiles.map(file => (
                                      <tr key={file.id} className="group hover:bg-secondary/30 transition-colors">
                                          <td className="px-4 md:px-6 py-4"><input type="checkbox" className="rounded bg-background border-border" /></td>
                                          <td className="px-4 md:px-6 py-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="p-2 rounded bg-background border border-border flex-shrink-0">{getFileIcon(file)}</div>
                                                  <span className="font-bold text-foreground truncate max-w-[150px] md:max-w-[200px]" title={file.name}>{file.name}</span>
                                                  {file.isFavorite && <Heart size={12} className="text-red-500 fill-red-500 flex-shrink-0" />}
                                              </div>
                                          </td>
                                          <td className="px-4 md:px-6 py-4 font-mono text-muted-foreground text-xs hidden sm:table-cell">{file.size}</td>
                                          <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                                              <div className="flex -space-x-2">
                                                  <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-card"></div>
                                                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-card"></div>
                                              </div>
                                          </td>
                                          <td className="px-4 md:px-6 py-4 text-muted-foreground text-xs hidden sm:table-cell">
                                              {new Date(file.dateModified).toLocaleDateString()}
                                          </td>
                                          <td className="px-4 md:px-6 py-4 text-right">
                                              <div className="flex justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                  {activeSection === 'TRASH' ? (
                                                      <>
                                                          <button onClick={(e) => restoreFromTrash(file.id, e)} className="p-2 hover:bg-background rounded-lg text-green-500" title="Restore">
                                                              <RotateCcw size={16} />
                                                          </button>
                                                          <button onClick={(e) => deleteForever(file.id, e)} className="p-2 hover:bg-background rounded-lg text-red-500" title="Delete Forever">
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </>
                                                  ) : (
                                                      <>
                                                          <button onClick={(e) => toggleFavorite(file.id, e)} className={`p-2 hover:bg-background rounded-lg ${file.isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`} title="Favorite">
                                                              <Heart size={16} fill={file.isFavorite ? 'currentColor' : 'none'} />
                                                          </button>
                                                          <button onClick={(e) => moveToTrash(file.id, e)} className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-red-500" title="Trash">
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                                  {displayFiles.length === 0 && (
                                      <tr>
                                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                              {activeSection === 'TRASH' ? 'Trash is empty.' : 'No files found.'}
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  ) : (
                      <div className="p-4 md:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {displayFiles.map(file => (
                              <div key={file.id} className="bg-secondary/30 border border-border rounded-xl p-4 hover:bg-secondary/50 transition-colors group relative">
                                  <div className="aspect-square bg-background rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                                      {file.type === 'IMAGE' && file.url ? (
                                          <img src={file.url} className="w-full h-full object-cover" />
                                      ) : (
                                          getFileIcon(file)
                                      )}
                                      
                                      {/* Hover Actions Overlay */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                          {activeSection === 'TRASH' ? (
                                               <button onClick={(e) => restoreFromTrash(file.id, e)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white"><RotateCcw size={16} /></button>
                                          ) : (
                                               <button onClick={(e) => moveToTrash(file.id, e)} className="p-2 bg-white/20 hover:bg-red-500/80 rounded-full text-white"><Trash2 size={16} /></button>
                                          )}
                                      </div>
                                  </div>
                                  <div className="text-xs font-bold text-foreground truncate" title={file.name}>{file.name}</div>
                                  <div className="flex justify-between items-center mt-1">
                                      <span className="text-[10px] text-muted-foreground">{file.size}</span>
                                      {activeSection !== 'TRASH' && (
                                          <button onClick={(e) => toggleFavorite(file.id, e)} className={`${file.isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
                                              <Heart size={12} fill={file.isFavorite ? 'currentColor' : 'none'} />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {displayFiles.length === 0 && (
                              <div className="col-span-full text-center py-12 text-muted-foreground">
                                  No files found.
                              </div>
                          )}
                      </div>
                  )}
              </FadeIn>

          </div>
      </div>
    </FadeIn>
  );
};