import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasItem } from '../types';
import {
  Plus, Minus, Move, Image as ImageIcon, Trash2, StickyNote, Type,
  MessageSquare, Undo, Redo, Home, Link as LinkIcon, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Check, X, MousePointer2
} from 'lucide-react';
import { FadeIn } from './common/AnimatedComponents';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';

interface InfinityPageProps {
  items: CanvasItem[];
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
}

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 100;

export const InfinityPage: React.FC<InfinityPageProps> = ({ items, setItems }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'SELECT' | 'COMMENT' | 'CONNECT' | 'HAND'>('SELECT');
  const [spacePressed, setSpacePressed] = useState(false);

  // Dragging
  const [draggedItem, setDraggedItem] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  // Connections
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Selection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Draggable Toolbar
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0 });

  // History Stack for Undo/Redo
  const [history, setHistory] = useState<CanvasItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize history
  useEffect(() => {
    if (history.length === 0 && items.length > 0) {
      setHistory([items]);
      setHistoryIndex(0);
    }
  }, []);

  const pushToHistory = (newItems: CanvasItem[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newItems);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevItems = history[historyIndex - 1];
      setItems(prevItems);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setItems]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextItems = history[historyIndex + 1];
      setItems(nextItems);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setItems]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in textarea
      if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedItemId && document.activeElement === canvasRef.current) {
          deleteItem(selectedItemId);
        }
      }

      // Tool Shortcuts
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setTool('SELECT');
      }
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setTool('HAND');
      }
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setTool('CONNECT');
      }
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setTool('COMMENT');
      }

      // Space for temporary pan
      if (e.key === ' ' && !spacePressed) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleUndo, handleRedo, selectedItemId, spacePressed]);


  // --- PANNING & ZOOM ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // If COMMENT tool
    if (tool === 'COMMENT') {
      const x = (e.clientX - offset.x) / scale;
      const y = (e.clientY - offset.y) / scale;
      const newComment: CanvasItem = {
        id: Date.now().toString(),
        type: 'COMMENT',
        x: x - 100,
        y: y - 50,
        width: 200,
        height: 100,
        content: '',
        color: '#fca5a5',
        zIndex: 100
      };
      const newItems = [...items, newComment];
      setItems(newItems);
      pushToHistory(newItems);
      setTool('SELECT');
      return;
    }

    // Check if should pan (middle mouse, hand tool, or space key)
    const shouldPan = e.button === 1 || tool === 'HAND' || spacePressed;
    const clickedCanvas = e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-bg');

    if (shouldPan && clickedCanvas) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      e.preventDefault();
      return;
    }

    if (clickedCanvas) {
      // Deselect if clicking empty space
      setSelectedItemId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Update mouse position for dynamic connection line
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - offset.x) / scale,
        y: (e.clientY - rect.top - offset.y) / scale
      });
    }

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return; // Don't process item dragging while panning
    }

    if (draggedItem) {
      const deltaX = (e.clientX - draggedItem.startX) / scale;
      const deltaY = (e.clientY - draggedItem.startY) / scale;

      setItems(prev => prev.map(item => {
        if (item.id === draggedItem.id) {
          return { ...item, x: draggedItem.initialX + deltaX, y: draggedItem.initialY + deltaY };
        }
        return item;
      }));
    }
  };

  const handleMouseUp = () => {
    if (draggedItem) {
      pushToHistory(items);
    }
    setIsPanning(false);
    setDraggedItem(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale - e.deltaY * zoomSensitivity), 5);

      // Calculate zoom towards mouse position
      // Simple approximation for now (zoom to center or top-left)
      setScale(newScale);
    } else {
      setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const resetView = () => {
    setOffset({ x: 0, y: 0 });
    setScale(1);
  };

  // --- ITEM LOGIC ---
  const startDragItem = (e: React.MouseEvent, item: CanvasItem) => {
    if (tool === 'CONNECT') {
      e.stopPropagation();
      if (connectingNodeId === null) {
        setConnectingNodeId(item.id);
      } else {
        // Complete connection
        if (connectingNodeId !== item.id) {
          setItems(prev => prev.map(i => {
            if (i.id === connectingNodeId) {
              const existing = i.connectedTo || [];
              if (!existing.includes(item.id)) {
                return { ...i, connectedTo: [...existing, item.id] };
              }
            }
            return i;
          }));
          pushToHistory(items);
        }
        setConnectingNodeId(null);
      }
      return;
    }

    if (tool !== 'SELECT') return;

    e.stopPropagation();
    setSelectedItemId(item.id);

    setDraggedItem({
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    });
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    // Also remove any connections to this item
    const cleanedItems = newItems.map(i => ({
      ...i,
      connectedTo: i.connectedTo?.filter(targetId => targetId !== id)
    }));
    setItems(cleanedItems);
    pushToHistory(cleanedItems);
    setSelectedItemId(null);
  };

  const updateItemStyle = (id: string, newStyle: Partial<NonNullable<CanvasItem['style']>>) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        return { ...i, style: { ...(i.style || {}), ...newStyle } };
      }
      return i;
    }));
    pushToHistory(items);
  };

  // --- DRAG AND DROP UPLOAD ---
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const droppedItems: CanvasItem[] = [];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const mouseX = (e.clientX - offset.x) / scale;
            const mouseY = (e.clientY - offset.y) / scale;

            const newItem: CanvasItem = {
              id: Date.now().toString() + Math.random(),
              type: 'IMAGE',
              x: mouseX,
              y: mouseY,
              width: 300,
              content: event.target.result as string,
              zIndex: items.length + 1
            };
            setItems(prev => [...prev, newItem]);
            pushToHistory([...items, newItem]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const selectedItem = items.find(i => i.id === selectedItemId);

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      tabIndex={0}
      style={{
        cursor: isPanning ? 'grabbing' : (spacePressed || tool === 'HAND' ? 'grab' : (tool === 'COMMENT' ? 'text' : (tool === 'CONNECT' ? 'crosshair' : 'default'))),
      }}
    >


      {/* --- TOOLBAR --- */}
      <FadeIn className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/50 p-2 rounded-2xl shadow-xl">
        <Button
          variant={tool === 'SELECT' ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setTool('SELECT')} title="Select (V)"
        >
          <MousePointer2 size={18} />
        </Button>
        <Button
          variant={tool === 'HAND' ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setTool('HAND')} title="Pan (H)"
        >
          <Move size={18} />
        </Button>
        <Button
          variant={tool === 'CONNECT' ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setTool('CONNECT')} title="Connect (C)"
        >
          <LinkIcon size={18} />
        </Button>
        <Button
          variant={tool === 'COMMENT' ? "default" : "ghost"} size="icon" className="h-9 w-9" onClick={() => setTool('COMMENT')} title="Comment (M)"
        >
          <MessageSquare size={18} />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="ghost" size="icon" className="h-9 w-9" onClick={resetView} title="Reset View"
        >
          <Home size={18} />
        </Button>
        <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleUndo} disabled={historyIndex <= 0}><Undo size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRedo} disabled={historyIndex >= history.length - 1}><Redo size={14} /></Button>
        </div>
      </FadeIn>

      <div className="absolute top-6 right-6 z-50 bg-background/50 backdrop-blur border border-border rounded-lg px-2 py-1 text-xs font-mono">
        {Math.round(scale * 100)}%
      </div>

      {/* --- SELECTED ITEM FORMATTING TOOLBAR --- */}
      {selectedItem && selectedItem.type === 'NOTE' && (
        <div
          className="absolute z-50 bg-background/90 backdrop-blur-xl border border-border rounded-xl p-2 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5"
          style={{
            left: toolbarPos.x || '50%',
            bottom: toolbarPos.y || '2rem',
            transform: toolbarPos.x ? 'none' : 'translateX(-50%)',
            cursor: isDraggingToolbar ? 'grabbing' : 'default'
          }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).classList.contains('drag-handle')) {
              setIsDraggingToolbar(true);
              setToolbarDragStart({ x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y });
              e.stopPropagation();
            }
          }}
          onMouseMove={(e) => {
            if (isDraggingToolbar) {
              setToolbarPos({
                x: e.clientX - toolbarDragStart.x,
                y: window.innerHeight - (e.clientY - toolbarDragStart.y)
              });
            }
          }}
          onMouseUp={() => setIsDraggingToolbar(false)}
        >
          <div className="drag-handle cursor-grab active:cursor-grabbing px-1 py-2 -ml-1 hover:bg-secondary/50 rounded transition-colors" title="Drag to move">
            <div className="w-1 h-4 bg-border rounded-full" />
          </div>
          <Button
            variant={selectedItem.style?.fontWeight === 'bold' ? 'secondary' : 'ghost'}
            size="icon" className="h-8 w-8"
            onClick={() => updateItemStyle(selectedItem.id, { fontWeight: selectedItem.style?.fontWeight === 'bold' ? 'normal' : 'bold' })}
          >
            <Bold size={14} />
          </Button>
          <Button
            variant={selectedItem.style?.fontStyle === 'italic' ? 'secondary' : 'ghost'}
            size="icon" className="h-8 w-8"
            onClick={() => updateItemStyle(selectedItem.id, { fontStyle: selectedItem.style?.fontStyle === 'italic' ? 'normal' : 'italic' })}
          >
            <Italic size={14} />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs text-muted-foreground">Size</span>
            <Slider
              value={[selectedItem.style?.fontSize || 14]}
              min={MIN_FONT_SIZE} max={MAX_FONT_SIZE} step={1}
              className="w-24"
              onValueChange={([val]) => updateItemStyle(selectedItem.id, { fontSize: val })}
            />
            <span className="text-xs font-mono w-4">{selectedItem.style?.fontSize || 14}</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteItem(selectedItem.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      )}


      {/* --- CANVAS CONTENT --- */}
      <div
        className="absolute origin-top-left transition-transform duration-75 ease-linear will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {/* CONNECTIONS LAYER */}
        <svg className="absolute top-0 left-0 w-[50000px] h-[50000px] pointer-events-none -z-10 overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
            </marker>
          </defs>
          {items.map(source => (
            source.connectedTo?.map(targetId => {
              const target = items.find(i => i.id === targetId);
              if (!target) return null;
              const sx = source.x + (source.width || 200) / 2;
              const sy = source.y + (source.height || 100) / 2;
              const tx = target.x + (target.width || 200) / 2;
              const ty = target.y + (target.height || 100) / 2;
              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={sx} y1={sy} x2={tx} y2={ty}
                  stroke="gray" strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="5,5"
                />
              );
            })
          ))}
          {/* Active Connection Line */}
          {tool === 'CONNECT' && connectingNodeId && (
            (() => {
              const source = items.find(i => i.id === connectingNodeId);
              if (!source) return null;
              const sx = source.x + (source.width || 200) / 2;
              const sy = source.y + (source.height || 100) / 2;
              return (
                <line
                  x1={sx} y1={sy} x2={mousePos.x} y2={mousePos.y}
                  stroke="hsl(var(--primary))" strokeWidth="2"
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              );
            })()
          )}
        </svg>

        {items.map(item => (
          <ContextMenu key={item.id}>
            <ContextMenuTrigger>
              <div
                onMouseDown={(e) => startDragItem(e, item)}
                className={cn(
                  "absolute group transition-shadow duration-200",
                  selectedItemId === item.id ? "ring-2 ring-primary shadow-2xl z-50" : "hover:ring-1 hover:ring-primary/50",
                  tool === 'CONNECT' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
                )}
                style={{
                  left: item.x,
                  top: item.y,
                  zIndex: item.zIndex,
                  width: item.width,
                  height: item.height
                }}
              >
                {item.type === 'IMAGE' && (
                  <div className="relative rounded-lg overflow-hidden h-full">
                    <img
                      src={item.content}
                      alt="Node"
                      className="w-full h-full object-cover pointer-events-none select-none"
                      style={{
                        opacity: tool === 'CONNECT' && connectingNodeId && connectingNodeId !== item.id ? 0.8 : 1
                      }}
                    />
                  </div>
                )}

                {item.type === 'NOTE' && (
                  <div
                    className="p-4 shadow-lg rounded-md flex flex-col h-full bg-[#fef3c7] text-black"
                  >
                    <textarea
                      defaultValue={item.content}
                      className="bg-transparent w-full h-full resize-none outline-none font-medium"
                      style={{
                        fontSize: item.style?.fontSize || 14,
                        fontWeight: item.style?.fontWeight || 'normal',
                        fontStyle: item.style?.fontStyle || 'normal',
                        textAlign: item.style?.textAlign || 'left',
                        fontFamily: 'inherit' // Or handwritten font
                      }}
                      onMouseDown={(e) => e.stopPropagation()} // Allow text editing
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: val } : i));
                      }}
                      onBlur={() => pushToHistory(items)}
                      placeholder="Type something..."
                    />
                  </div>
                )}

                {item.type === 'COMMENT' && (
                  <div
                    className="p-3 shadow-md rounded-xl bg-card border border-border flex flex-col h-full"
                  >
                    <div className="flex items-center gap-2 mb-1 opacity-50">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-bold uppercase">Comment</span>
                    </div>
                    <textarea
                      defaultValue={item.content}
                      className="bg-transparent w-full h-full resize-none outline-none text-sm"
                      style={{ fontSize: 13 }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: val } : i));
                      }}
                      onBlur={() => pushToHistory(items)}
                      placeholder="Add comment..."
                    />
                  </div>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => {
                // Duplicate logic
                const newItem = { ...item, id: Date.now().toString(), x: item.x + 20, y: item.y + 20 };
                setItems(prev => [...prev, newItem]);
                pushToHistory([...items, newItem]);
              }}>
                Duplicate
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                // Bring to front
                const maxZ = Math.max(...items.map(i => i.zIndex || 0));
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, zIndex: maxZ + 1 } : i));
              }}>
                Bring to Front
              </ContextMenuItem>
              <ContextMenuItem onClick={() => {
                // Send to back
                const minZ = Math.min(...items.map(i => i.zIndex || 0));
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, zIndex: minZ - 1 } : i));
              }}>
                Send to Back
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem className="text-red-500 focus:text-red-500" onClick={() => deleteItem(item.id)}>
                <Trash2 size={14} className="mr-2" /> Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>

      {/* --- INSTRUCTION TOAST FOR CONNECT MODE --- */}
      {tool === 'CONNECT' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-in fade-in slide-in-from-bottom-5 pointer-events-none">
          {connectingNodeId ? "Click another note to connect" : "Select a note to start connection"}
        </div>
      )}
    </div>
  );
};
