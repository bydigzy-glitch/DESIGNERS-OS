
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CanvasItem } from '../types';
import { Plus, Minus, Move, Image as ImageIcon, Trash2, StickyNote, Type, MessageSquare, Undo, Redo } from 'lucide-react';
import { FadeIn } from './common/AnimatedComponents';
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/lib/utils";

interface InfinityPageProps {
  items: CanvasItem[];
  setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
}

export const InfinityPage: React.FC<InfinityPageProps> = ({ items, setItems }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tool, setTool] = useState<'SELECT' | 'COMMENT'>('SELECT');

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
  }, []); // Only runs once on mount/init logic handled inside if needed, but really we want to track changes

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

  // Capture Undo Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo]);

  // --- PANNING LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // If tool is COMMENT, add comment
    if (tool === 'COMMENT') {
      const x = (e.clientX - offset.x) / scale;
      const y = (e.clientY - offset.y) / scale;
      const newComment: CanvasItem = {
        id: Date.now().toString(),
        type: 'COMMENT',
        x: x - 100, // center it roughly
        y: y - 50,
        width: 200,
        height: 100,
        content: 'New Comment',
        color: '#fca5a5',
        zIndex: 100
      };
      const newItems = [...items, newComment];
      setItems(newItems);
      pushToHistory(newItems);
      setTool('SELECT'); // Revert to select
      return;
    }

    // Middle mouse or Space+Click initiates pan
    if (e.button === 1 || e.shiftKey || tool === 'SELECT') {
      // Check if clicking on empty space
      if (e.target === canvasRef.current) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
        e.preventDefault();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }

    if (draggedItem) {
      // Calculate delta considering zoom scale
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
      // Commit drag to history
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
      setScale(newScale);
    } else {
      // Standard Panning
      setOffset(prev => ({ x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  // --- ITEM DRAGGING LOGIC ---
  const startDragItem = (e: React.MouseEvent, item: CanvasItem) => {
    if (tool !== 'SELECT') return;
    e.stopPropagation();
    setDraggedItem({
      id: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: item.x,
      initialY: item.y
    });
  };

  // --- PASTING LOGIC ---
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const newItem: CanvasItem = {
                  id: Date.now().toString(),
                  type: 'IMAGE',
                  x: (-offset.x + window.innerWidth / 2) / scale, // Center relative to viewport
                  y: (-offset.y + window.innerHeight / 2) / scale,
                  width: 300,
                  content: event.target.result as string,
                  zIndex: 1
                };
                const newItems = [...items, newItem];
                setItems(newItems);
                pushToHistory(newItems);
              }
            };
            reader.readAsDataURL(blob);
          }
        } else if (item.type.indexOf('text') !== -1) {
          item.getAsString((text) => {
            const newItem: CanvasItem = {
              id: Date.now().toString(),
              type: 'NOTE',
              x: (-offset.x + window.innerWidth / 2) / scale,
              y: (-offset.y + window.innerHeight / 2) / scale,
              width: 200,
              height: 200,
              content: text,
              color: '#fef3c7',
              zIndex: 1
            };
            const newItems = [...items, newItem];
            setItems(newItems);
            pushToHistory(newItems);
          });
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [offset, scale, setItems, items, history, historyIndex]);

  const deleteItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    pushToHistory(newItems);
  };

  return (
    <div
      className="h-full w-full relative overflow-hidden bg-dot-grid"
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{
        cursor: isPanning ? 'grabbing' : (tool === 'COMMENT' ? 'text' : 'default'),
      }}
    >
      <DotPattern
        width={20}
        height={20}
        cx={1}
        cy={1}
        cr={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "fill-primary/20"
        )}
      />
      {/* Controls */}
      <FadeIn className="absolute top-4 left-4 z-50 flex flex-col gap-2">
        <div className="bg-card border border-border rounded-xl p-2 shadow-lg flex flex-col gap-2">
          <button onClick={() => setScale(s => Math.min(s + 0.1, 5))} className="p-1 hover:bg-secondary rounded" title="Zoom In"><Plus size={16} /></button>
          <span className="text-xs text-center font-mono">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className="p-1 hover:bg-secondary rounded" title="Zoom Out"><Minus size={16} /></button>
        </div>

        <div className="bg-card border border-border rounded-xl p-2 shadow-lg flex flex-col gap-2">
          <button
            onClick={() => setTool('SELECT')}
            className={`p-1.5 rounded transition-colors ${tool === 'SELECT' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
            title="Select / Pan"
          >
            <Move size={16} />
          </button>
          <button
            onClick={() => setTool('COMMENT')}
            className={`p-1.5 rounded transition-colors ${tool === 'COMMENT' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
            title="Add Comment"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={handleUndo}
            className="p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
            title="Undo (Ctrl+Z)"
            disabled={historyIndex <= 0}
          >
            <Undo size={16} />
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-lg text-xs text-muted-foreground max-w-xs">
          <p className="font-bold mb-1 text-foreground">Infinity Board</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Ctrl+V</strong> to paste images/text</li>
            <li><strong>Scroll</strong> to Pan</li>
            <li><strong>Ctrl+Scroll</strong> to Zoom</li>
          </ul>
        </div>
      </FadeIn>

      <div
        className="absolute origin-top-left transition-transform duration-75 ease-linear will-change-transform"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {items.map(item => (
          <div
            key={item.id}
            onMouseDown={(e) => startDragItem(e, item)}
            className={`absolute group ${tool === 'SELECT' ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
              left: item.x,
              top: item.y,
              zIndex: item.zIndex,
              width: item.width,
              height: item.height
            }}
          >
            {item.type === 'IMAGE' && (
              <div className="relative border-4 border-transparent hover:border-primary/50 transition-colors rounded-lg">
                <img
                  src={item.content}
                  alt="Canvas Item"
                  className="w-full h-auto rounded-md shadow-2xl pointer-events-none select-none"
                  style={{ maxWidth: '600px' }}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            {item.type === 'NOTE' && (
              <div
                className="p-4 shadow-xl rounded-sm text-black flex flex-col relative group hover:ring-2 ring-primary/50 transition-all"
                style={{ backgroundColor: item.color || '#fef3c7', minHeight: '150px' }}
              >
                <textarea
                  defaultValue={item.content}
                  className="bg-transparent w-full h-full resize-none outline-none text-sm font-handwriting"
                  onMouseDown={(e) => e.stopPropagation()} // Allow text selection
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: val } : i));
                  }}
                  onBlur={() => pushToHistory(items)} // Save state on blur
                />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}

            {item.type === 'COMMENT' && (
              <div
                className="p-3 shadow-lg rounded-xl bg-card border border-border flex flex-col relative group hover:ring-2 ring-primary/50 transition-all"
                style={{ minWidth: '200px' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                    U
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Comment</span>
                </div>
                <textarea
                  defaultValue={item.content}
                  className="bg-transparent w-full h-full resize-none outline-none text-xs text-foreground min-h-[40px]"
                  placeholder="Add a comment..."
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItems(prev => prev.map(i => i.id === item.id ? { ...i, content: val } : i));
                  }}
                  onBlur={() => pushToHistory(items)}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
