
import React, { useState } from 'react';
import { ArrowLeft, MonitorPlay, Shirt, Maximize2, Infinity as InfinityIcon, Lock } from 'lucide-react';
import { ContentLab } from './ContentLab';
import { InfinityPage } from './InfinityPage';
import { CanvasItem } from '../types';
import { FadeIn } from './common/AnimatedComponents';
import { TOKEN_COSTS } from '../services/storageService';

type AppId = 'HUB' | 'CONTENT_LAB' | 'MOCKUP_STUDIO' | 'IMAGE_RESIZER' | 'INFINITY_BOARD';

interface AppsProps {
    items: CanvasItem[];
    setItems: React.Dispatch<React.SetStateAction<CanvasItem[]>>;
    userTokens: number;
    onUseToken: (amount: number) => void;
}

export const Apps: React.FC<AppsProps> = ({ items, setItems, userTokens, onUseToken }) => {
  const [currentApp, setCurrentApp] = useState<AppId>('HUB');

  const renderCurrentAppView = () => {
    switch (currentApp) {
        case 'CONTENT_LAB': return <ContentLab userTokens={userTokens} onUseToken={onUseToken} />;
        case 'MOCKUP_STUDIO': return <MockupStudioView userTokens={userTokens} onUseToken={onUseToken} />;
        case 'IMAGE_RESIZER': return <ImageResizerView userTokens={userTokens} onUseToken={onUseToken} />;
        case 'INFINITY_BOARD': return <InfinityPage items={items} setItems={setItems} />;
        default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {currentApp === 'HUB' ? (
          <FadeIn className="space-y-8 h-full">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Apps</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                      { id: 'INFINITY_BOARD', label: 'Infinity Board', icon: <InfinityIcon size={24} />, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', desc: 'Infinite whiteboarding canvas for ideas.' },
                      { id: 'CONTENT_LAB', label: 'Content Lab', icon: <MonitorPlay size={24} />, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', desc: 'Viral predictions for your next short video.' },
                      { id: 'MOCKUP_STUDIO', label: 'Mockup Studio', icon: <Shirt size={24} />, color: 'text-teal-500 bg-teal-500/10 border-teal-500/20', desc: 'Generate realistic clothing mockups on models.' },
                      { id: 'IMAGE_RESIZER', label: 'Generative Fill', icon: <Maximize2 size={24} />, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', desc: 'Expand your images to any aspect ratio.' },
                  ].map((app, i) => (
                      <FadeIn key={app.id} delay={i * 0.1}>
                        <button 
                            onClick={() => setCurrentApp(app.id as AppId)}
                            className="w-full bg-card border border-border rounded-2xl p-6 text-left hover:border-primary/50 transition-all group relative overflow-hidden shadow-sm active:scale-95 h-full flex flex-col"
                        >
                            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-4 ${app.color}`}>
                                {app.icon}
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">{app.label}</h3>
                            <p className="text-muted-foreground text-sm">{app.desc}</p>
                        </button>
                      </FadeIn>
                  ))}
              </div>
          </FadeIn>
      ) : (
          <FadeIn className="flex flex-col h-full">
              <div className="flex items-center gap-4 mb-4 flex-shrink-0">
                  <button 
                    onClick={() => setCurrentApp('HUB')} 
                    className="p-2 bg-card rounded-lg text-muted-foreground hover:text-foreground border border-border hover:border-primary/50 transition-all"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h1 className="text-2xl font-bold text-foreground capitalize">{currentApp.replace('_', ' ').toLowerCase()}</h1>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto relative rounded-2xl border border-border overflow-hidden bg-card/50 backdrop-blur-sm">
                  {renderCurrentAppView()}
              </div>
          </FadeIn>
      )}
    </div>
  );
};

interface AppViewProps {
    userTokens: number;
    onUseToken: (amount: number) => void;
}

const MockupStudioView: React.FC<AppViewProps> = ({ userTokens, onUseToken }) => {
    const [modelImage, setModelImage] = useState<string | null>(null);
    const [garmentImage, setGarmentImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Explicit cost per rules
    const TOKEN_COST = TOKEN_COSTS.IMAGE_GEN;
    const hasTokens = userTokens >= TOKEN_COST;
  
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: React.Dispatch<React.SetStateAction<string | null>>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => setImage(ev.target?.result as string);
        reader.readAsDataURL(file);
      }
    };
  
    const handleGenerate = async () => {
      if (!modelImage || !garmentImage || !prompt.trim()) return;
      if (!hasTokens) return alert("Insufficient tokens.");
      
      onUseToken(TOKEN_COST); // App.tsx handles the actual check/deduct call
      setIsLoading(true);
      setGeneratedImage(null);
      try {
        const result = await (window as any).geminiService.generateMockup(modelImage, garmentImage, prompt); 
        setGeneratedImage(result);
      } catch (error) {
        console.error("Mockup generation failed:", error);
        alert("Failed to generate mockup. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <FadeIn className="bg-card rounded-2xl p-6 md:p-8 space-y-6 flex flex-col h-full overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground mb-4">Create Your Mockup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase">Upload Model</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, setModelImage)} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-colors text-sm text-foreground"
            />
            {modelImage && <img src={modelImage} alt="Model" className="max-h-48 object-contain rounded-lg border border-border" />}
          </div>
          <div className="flex flex-col gap-4">
            <label className="block text-xs font-bold text-muted-foreground uppercase">Upload Garment</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, setGarmentImage)} 
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-colors text-sm text-foreground"
            />
            {garmentImage && <img src={garmentImage} alt="Garment" className="max-h-48 object-contain rounded-lg border border-border" />}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <label className="block text-xs font-bold text-muted-foreground uppercase">Prompt</label>
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            placeholder="e.g., High-end streetwear photoshoot in a studio."
            className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-24 text-sm"
          />
        </div>
        <button 
          onClick={handleGenerate} 
          disabled={isLoading || !modelImage || !garmentImage || !prompt.trim() || !hasTokens} 
          className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${hasTokens ? 'bg-primary text-primary-foreground hover:bg-orange-600' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
        >
          {isLoading ? 'Generating...' : hasTokens ? `Generate Mockup (${TOKEN_COST} Tokens)` : 'Locked (Insufficient Tokens)'}
          {!hasTokens && <Lock size={16} />}
        </button>
        {generatedImage && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Result:</h3>
            <img src={generatedImage} alt="Generated Mockup" className="w-full object-contain rounded-xl border border-border" />
          </div>
        )}
      </FadeIn>
    );
};

const ImageResizerView: React.FC<AppViewProps> = ({ userTokens, onUseToken }) => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Explicit cost per rules
    const TOKEN_COST = TOKEN_COSTS.IMAGE_GEN;
    const hasTokens = userTokens >= TOKEN_COST;
  
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          setOriginalImage(ev.target?.result as string);
          setGeneratedImage(null); 
        };
        reader.readAsDataURL(file);
      }
    };
  
    const handleGenerate = async () => {
      if (!originalImage || !aspectRatio) return;
      if (!hasTokens) return alert("Insufficient tokens.");

      onUseToken(TOKEN_COST);
      setIsLoading(true);
      setGeneratedImage(null);
      try {
        const result = await (window as any).geminiService.extendImage(originalImage, aspectRatio, "Make the image look as realistic as possible when extending."); 
        setGeneratedImage(result);
      } catch (error) {
        console.error("Image resizing failed:", error);
        alert("Failed to resize image.");
      } finally {
        setIsLoading(false);
      }
    };
  
    const aspectRatioOptions = ['1:1', '9:16', '16:9', '4:3', '3:4'];
  
    return (
      <FadeIn className="bg-card rounded-2xl p-6 md:p-8 space-y-6 flex flex-col h-full overflow-y-auto">
        <h2 className="text-lg font-bold text-foreground mb-4">Generative Fill</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Upload Image</label>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-colors text-sm text-foreground"
                />
                {originalImage && <img src={originalImage} alt="Original" className="max-h-48 object-contain rounded-lg border border-border" />}
            </div>
            <div className="flex flex-col gap-4">
                <label className="block text-xs font-bold text-muted-foreground uppercase">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                    {aspectRatioOptions.map(ratio => (
                        <button 
                            key={ratio} 
                            onClick={() => setAspectRatio(ratio)} 
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${aspectRatio === ratio ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:bg-secondary/80'}`}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <button 
          onClick={handleGenerate} 
          disabled={isLoading || !originalImage || !aspectRatio || !hasTokens} 
          className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${hasTokens ? 'bg-primary text-primary-foreground hover:bg-orange-600' : 'bg-secondary text-muted-foreground cursor-not-allowed'}`}
        >
          {isLoading ? 'Generating...' : hasTokens ? `Generate Resized Image (${TOKEN_COST} Tokens)` : 'Locked (Insufficient Tokens)'}
          {!hasTokens && <Lock size={16} />}
        </button>
        {generatedImage && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Result:</h3>
            <img src={generatedImage} alt="Generated" className="w-full object-contain rounded-xl border border-border" />
          </div>
        )}
      </FadeIn>
    );
};
